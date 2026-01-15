<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Scooter;
use App\Models\PartnerScooterModelTransferFee;
use App\Models\ScooterModel;
use App\Models\OrderScooter;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Partner;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['partner', 'scooters']);

        // Filter by month (format: YYYY-MM)
        if ($request->has('month')) {
            $month = $request->get('month');
            $startDate = Carbon::parse($month . '-01')->timezone('Asia/Taipei')->startOfMonth();
            $endDate = Carbon::parse($month . '-01')->timezone('Asia/Taipei')->endOfMonth();
            $query->whereBetween('appointment_date', [$startDate, $endDate]);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('tenant', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('order_number', 'like', "%{$search}%");
            });
        }

        // Pagination: 200 per page
        $perPage = 200;
        $orders = $query->orderBy('appointment_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'data' => OrderResource::collection($orders->items()),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'partner_id' => 'nullable|exists:partners,id',
            'tenant' => 'nullable|string|max:255',
            'appointment_date' => 'required|date',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date',
            'expected_return_time' => 'nullable|date',
            'phone' => 'nullable|string|max:20',
            'shipping_company' => 'nullable|in:泰富,藍白,聯營,大福,公船',
            'ship_arrival_time' => 'nullable|date',
            'ship_return_time' => 'nullable|date',
            'payment_method' => 'nullable|in:現金,月結,日結,匯款,刷卡,行動支付',
            'payment_amount' => 'nullable|numeric|min:0',
            'status' => 'required|in:已預訂,進行中,待接送,已完成,在合作商',
            'remark' => 'nullable|string',
            'scooter_ids' => 'required|array|min:1',
            'scooter_ids.*' => 'exists:scooters,id',
        ]);

        // 驗證 end_time 必須在 start_time 之後（如果兩者都存在）
        if ($request->has('start_time') && $request->has('end_time') && $request->get('start_time') && $request->get('end_time')) {
            $validator->after(function ($validator) use ($request) {
                if (strtotime($request->get('end_time')) <= strtotime($request->get('start_time'))) {
                    $validator->errors()->add('end_time', '結束時間必須在開始時間之後');
                }
            });
        }

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Check if scooters are available
        $scooterIds = $request->get('scooter_ids');
        $unavailableScooters = Scooter::whereIn('id', $scooterIds)
            ->where('status', '!=', '待出租')
            ->pluck('plate_number')
            ->toArray();

        if (!empty($unavailableScooters)) {
            return response()->json([
                'message' => 'Some scooters are not available',
                'errors' => [
                    'scooter_ids' => ['以下機車不可租借: ' . implode(', ', $unavailableScooters)],
                ],
            ], 422);
        }

        DB::beginTransaction();
        try {
            $validated = $validator->validated();
            
            // 如果沒有提供 payment_amount 或為 0，自動計算費用
            if (empty($validated['payment_amount']) || $validated['payment_amount'] == 0) {
                $partnerId = $validated['partner_id'] ?? null;
                $startTime = $validated['start_time'] ?? null;
                $endTime = $validated['end_time'] ?? null;
                
                $calculatedAmount = $this->calculateOrderAmount($partnerId, $scooterIds, $startTime, $endTime);
                $validated['payment_amount'] = $calculatedAmount;
            }
            
            $order = Order::create($validated);
            $order->scooters()->attach($scooterIds);

            // 根據訂單狀態更新機車狀態
            $status = $request->get('status', '已預訂');
            // 如果狀態為已預訂、已完成、待接送，機車狀態變為待出租
            if (in_array($status, ['已預訂', '已完成', '待接送'])) {
                Scooter::whereIn('id', $scooterIds)->update(['status' => '待出租']);
            } else {
                // 其他狀態（進行中、在合作商）機車狀態為出租中
                Scooter::whereIn('id', $scooterIds)->update(['status' => '出租中']);
            }

            DB::commit();

            return response()->json([
                'message' => 'Order created successfully',
                'data' => new OrderResource($order->load(['partner', 'scooters'])),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to create order', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all(),
            ]);
            return response()->json([
                'message' => 'Failed to create order',
                'error' => $e->getMessage(),
                'details' => config('app.debug') ? $e->getTraceAsString() : null,
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Order $order): JsonResponse
    {
        return response()->json([
            'data' => new OrderResource($order->load(['partner', 'scooters'])),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Order $order): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'partner_id' => 'nullable|exists:partners,id',
            'tenant' => 'nullable|string|max:255',
            'appointment_date' => 'required|date',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date',
            'expected_return_time' => 'nullable|date',
            'phone' => 'nullable|string|max:20',
            'shipping_company' => 'nullable|in:泰富,藍白,聯營,大福,公船',
            'ship_arrival_time' => 'nullable|date',
            'ship_return_time' => 'nullable|date',
            'payment_method' => 'nullable|in:現金,月結,日結,匯款,刷卡,行動支付',
            'payment_amount' => 'nullable|numeric|min:0',
            'status' => 'required|in:已預訂,進行中,待接送,已完成,在合作商',
            'remark' => 'nullable|string',
            'scooter_ids' => 'sometimes|array|min:1',
            'scooter_ids.*' => 'exists:scooters,id',
        ]);

        // 驗證 end_time 必須在 start_time 之後（如果兩者都存在）
        if ($request->has('start_time') && $request->has('end_time') && $request->get('start_time') && $request->get('end_time')) {
            $validator->after(function ($validator) use ($request) {
                if (strtotime($request->get('end_time')) <= strtotime($request->get('start_time'))) {
                    $validator->errors()->add('end_time', '結束時間必須在開始時間之後');
                }
            });
        }

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $oldStatus = $order->status;
            $oldScooterIds = $order->scooters->pluck('id')->toArray();

            $validated = $validator->validated();
            
            // 如果沒有提供 payment_amount 或為 0，自動計算費用
            if (empty($validated['payment_amount']) || $validated['payment_amount'] == 0) {
                $partnerId = $validated['partner_id'] ?? $order->partner_id;
                $startTime = $validated['start_time'] ?? $order->start_time;
                $endTime = $validated['end_time'] ?? $order->end_time;
                
                // 如果更新了機車，使用新的機車 ID，否則使用原有的
                $scooterIdsForCalculation = $request->has('scooter_ids') 
                    ? $request->get('scooter_ids') 
                    : $oldScooterIds;
                
                $calculatedAmount = $this->calculateOrderAmount($partnerId, $scooterIdsForCalculation, $startTime, $endTime);
                $validated['payment_amount'] = $calculatedAmount;
            }
            
            $order->update($validated);

            $newStatus = $request->get('status', $order->status);
            $allScooterIds = [];

            // Update scooters if provided
            if ($request->has('scooter_ids')) {
                $newScooterIds = $request->get('scooter_ids');

                // Check if new scooters are available (only check those not already in the order)
                $unavailableScooters = Scooter::whereIn('id', $newScooterIds)
                    ->where('status', '!=', '待出租')
                    ->whereNotIn('id', $oldScooterIds)
                    ->pluck('plate_number')
                    ->toArray();

                if (!empty($unavailableScooters)) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'Some scooters are not available',
                        'errors' => [
                            'scooter_ids' => ['以下機車不可租借: ' . implode(', ', $unavailableScooters)],
                        ],
                    ], 422);
                }

                // Detach old scooters
                $order->scooters()->detach();
                // Attach new scooters
                $order->scooters()->attach($newScooterIds);
                $allScooterIds = $newScooterIds;

                // Restore old scooters to 待出租
                Scooter::whereIn('id', $oldScooterIds)
                    ->whereNotIn('id', $newScooterIds)
                    ->update(['status' => '待出租']);
            } else {
                // If no scooter_ids provided, use existing scooters
                $allScooterIds = $order->scooters->pluck('id')->toArray();
            }

            // 根據訂單狀態更新所有相關機車的狀態
            // 如果狀態為已預訂、已完成、待接送，機車狀態變為待出租
            if (in_array($newStatus, ['已預訂', '已完成', '待接送'])) {
                Scooter::whereIn('id', $allScooterIds)->update(['status' => '待出租']);
            } else {
                // 其他狀態（進行中、在合作商）機車狀態為出租中
                Scooter::whereIn('id', $allScooterIds)->update(['status' => '出租中']);
            }

            DB::commit();

            return response()->json([
                'message' => 'Order updated successfully',
                'data' => new OrderResource($order->load(['partner', 'scooters'])),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update order status only
     */
    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:已預訂,進行中,待接送,已完成,在合作商',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $oldStatus = $order->status;
            $newStatus = $request->get('status');

            // Update order status
            $order->update(['status' => $newStatus]);

            // Get all scooters associated with this order
            $scooterIds = $order->scooters->pluck('id')->toArray();

            // 根據訂單狀態更新所有相關機車的狀態
            // 如果狀態為已預訂、已完成、待接送，機車狀態變為待出租
            if (in_array($newStatus, ['已預訂', '已完成', '待接送'])) {
                Scooter::whereIn('id', $scooterIds)->update(['status' => '待出租']);
            } else {
                // 其他狀態（進行中、在合作商）機車狀態為出租中
                Scooter::whereIn('id', $scooterIds)->update(['status' => '出租中']);
            }

            DB::commit();

            return response()->json([
                'message' => 'Order status updated successfully',
                'data' => new OrderResource($order->load(['partner', 'scooters'])),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update order status',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Order $order): JsonResponse
    {
        DB::beginTransaction();
        try {
            // Update scooter status to 待出租
            $scooterIds = $order->scooters->pluck('id')->toArray();
            Scooter::whereIn('id', $scooterIds)->update(['status' => '待出租']);

            $order->delete();

            DB::commit();

            return response()->json([
                'message' => 'Order deleted successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get order statistics by month
     */
    public function statistics(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'month' => 'required|date_format:Y-m',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $month = $request->get('month');
        $startDate = Carbon::parse($month . '-01')->timezone('Asia/Taipei')->startOfMonth();
        $endDate = Carbon::parse($month . '-01')->timezone('Asia/Taipei')->endOfMonth();

        // Get orders for the month
        $orders = Order::with(['partner', 'scooters'])
            ->whereBetween('appointment_date', [$startDate, $endDate])
            ->get();

        // Calculate statistics by partner
        $partnerStats = [];
        $totalCount = 0;
        $totalAmount = 0;

        foreach ($orders as $order) {
            $partnerName = $order->partner ? $order->partner->name : '無合作商';
            $partnerId = $order->partner_id;
            $scooterCount = $order->scooters->count();
            $amount = (float) $order->payment_amount;

            if (!isset($partnerStats[$partnerName])) {
                $partnerStats[$partnerName] = [
                    'partner_id' => $partnerId,
                    'count' => 0,
                    'amount' => 0,
                ];
            }

            $partnerStats[$partnerName]['count'] += $scooterCount;
            $partnerStats[$partnerName]['amount'] += $amount;

            $totalCount += $scooterCount;
            $totalAmount += $amount;
        }

        return response()->json([
            'data' => [
                'partner_stats' => $partnerStats,
                'total_count' => $totalCount,
                'total_amount' => $totalAmount,
                'month' => $month,
            ],
        ]);
    }

    /**
     * Get all years that have orders with appointment dates
     */
    public function getYears(): JsonResponse
    {
        // 從所有訂單中提取不重複的年份
        $years = Order::whereNotNull('appointment_date')
            ->selectRaw('YEAR(appointment_date) as year')
            ->distinct()
            ->orderBy('year', 'asc')
            ->pluck('year')
            ->toArray();

        return response()->json([
            'data' => $years,
        ]);
    }

    /**
     * Get all months that have orders for a specific year
     */
    public function getMonthsByYear(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'year' => 'required|integer|min:2000|max:2100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $year = $request->get('year');

        // 從指定年份的訂單中提取不重複的月份
        $months = Order::whereNotNull('appointment_date')
            ->whereRaw('YEAR(appointment_date) = ?', [$year])
            ->selectRaw('MONTH(appointment_date) as month')
            ->distinct()
            ->orderBy('month', 'asc')
            ->pluck('month')
            ->toArray();

        return response()->json([
            'data' => $months,
        ]);
    }

    /**
     * Get monthly report for a specific month
     * Returns data grouped by date (only dates with orders) and scooter model
     */
    public function monthlyReport(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'month' => 'required|date_format:Y-m',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $month = $request->get('month');
        $monthStartDate = Carbon::parse($month . '-01')->timezone('Asia/Taipei')->startOfMonth();
        $monthEndDate = Carbon::parse($month . '-01')->timezone('Asia/Taipei')->endOfMonth();

        // Get orders for the month with scooters and partner
        // 以 start_time 的月份為主來篩選訂單
        $orders = Order::with(['partner', 'scooters'])
            ->whereNotNull('start_time')
            ->whereNotNull('end_time')
            ->whereRaw('DATE_FORMAT(start_time, "%Y-%m") = ?', [$month])
            ->get();

        // Group by date (start_time date) and scooter model
        // 格式：按日期分組，每個日期下按車型分組，區分當日租和跨日租
        $reportData = [];
        $models = []; // 收集所有出現的車型

        foreach ($orders as $order) {
            // Use start_time date as the key date
            $keyDate = Carbon::parse($order->start_time)->timezone('Asia/Taipei')->format('Y-m-d');
            $keyDateWeekday = Carbon::parse($order->start_time)->timezone('Asia/Taipei')->format('l');

            // Calculate nights: 開始日期 ~ 結束日期 - 1 的訂單天數
            $startTime = Carbon::parse($order->start_time)->timezone('Asia/Taipei');
            $endTime = Carbon::parse($order->end_time)->timezone('Asia/Taipei');
            $startDate = $startTime->format('Y-m-d');
            $endDate = $endTime->format('Y-m-d');

            // 判斷是當日租還是跨日租
            $isSameDay = ($startDate === $endDate);
            // 天數計算：結束日期 - 開始日期（夜數）
            $nights = $startTime->diffInDays($endTime);

            // Group scooters by model
            $scootersByModel = $order->scooters->groupBy('model');
            $orderAmount = (float) $order->payment_amount;

            foreach ($scootersByModel as $model => $scooters) {
                $scooterCount = $scooters->count();

                // 收集所有出現的車型
                if (!in_array($model, $models)) {
                    $models[] = $model;
                }

                // 初始化日期數據
                if (!isset($reportData[$keyDate])) {
                    $reportData[$keyDate] = [
                        'date' => $keyDate,
                        'weekday' => $keyDateWeekday,
                        'models' => [],
                    ];
                }

                // 初始化該日期的該車型數據
                if (!isset($reportData[$keyDate]['models'][$model])) {
                    $reportData[$keyDate]['models'][$model] = [
                        'same_day_count' => 0,    // 當日租 台數
                        'overnight_count' => 0,    // 跨日租 台數
                        'nights' => 0,             // 天數（所有訂單天數相加）
                        'amount' => 0,             // 金額（所有訂單金額相加）
                    ];
                }

                // 累加數據
                if ($isSameDay) {
                    $reportData[$keyDate]['models'][$model]['same_day_count'] += $scooterCount;
                } else {
                    $reportData[$keyDate]['models'][$model]['overnight_count'] += $scooterCount;
                    // 只有跨日租才累加天數
                    $reportData[$keyDate]['models'][$model]['nights'] += $nights;
                }
                // 金額就是相加（當日租和跨日租都累加）
                $reportData[$keyDate]['models'][$model]['amount'] += $orderAmount;
            }
        }

        // 生成整個月份的日期列表（即使沒有訂單也要顯示）
        $currentDate = $monthStartDate->copy();
        $allDates = [];

        while ($currentDate->lte($monthEndDate)) {
            $dateStr = $currentDate->format('Y-m-d');
            $weekday = $currentDate->format('l');

            if (isset($reportData[$dateStr])) {
                // 有訂單的日期，使用實際數據
                $allDates[] = $reportData[$dateStr];
            } else {
                // 沒有訂單的日期，創建空數據
                $allDates[] = [
                    'date' => $dateStr,
                    'weekday' => $weekday,
                    'models' => [],
                ];
            }

            $currentDate->addDay();
        }

        // 排序車型
        sort($models);

        // 轉換為數組格式
        $result = [
            'dates' => $allDates,
            'models' => $models,
        ];

        return response()->json([
            'data' => $result,
            'month' => $month,
        ]);
    }

    /**
     * Get partner detailed monthly report for a specific month
     * Returns Excel file if partner_id is provided, otherwise returns JSON data
     */
    public function partnerDailyReport(Request $request)
    {
        // Step 1: 驗證請求參數
        $validator = Validator::make($request->all(), [
            'month' => 'required|date_format:Y-m',
            'partner_id' => 'nullable|exists:partners,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $month = $request->get('month');
        $partnerId = $request->get('partner_id');
        $monthStartDate = Carbon::parse($month . '-01')->timezone('Asia/Taipei')->startOfMonth();
        $monthEndDate = Carbon::parse($month . '-01')->timezone('Asia/Taipei')->endOfMonth();

        // dd('Step 1: 參數驗證完成', [
        //     'month' => $month,
        //     'partner_id' => $partnerId,
        //     'monthStartDate' => $monthStartDate,
        //     'monthEndDate' => $monthEndDate,
        // ]);

        // Step 2: 獲取所有機車型號
        $allScooterModels = ScooterModel::orderBy('sort_order', 'desc')->get();
        if ($allScooterModels->isEmpty()) {
            return response()->json(['message' => 'No scooter models found'], 404);
        }

        $allModels = $allScooterModels->map(fn($model) => "{$model->name} {$model->type}")->toArray();

        // dd('Step 2: 機車型號載入完成', [
        //     'allScooterModels_count' => $allScooterModels->count(),
        //     'allModels' => $allModels,
        //     'first_model' => $allScooterModels->first(),
        // ]);

        // Step 3: 預載入所有調車費用
        $transferFeesMap = PartnerScooterModelTransferFee::with('scooterModel')
            ->get()
            ->groupBy('partner_id')
            ->map(function ($fees) {
                return $fees->keyBy(function ($fee) {
                    return $fee->scooterModel
                        ? "{$fee->scooterModel->name} {$fee->scooterModel->type}"
                        : null;
                })->filter();
            });

        // dd('Step 3: 調車費用載入完成', [
        //     'transferFeesMap_count' => $transferFeesMap->count(),
        //     'transferFeesMap_keys' => $transferFeesMap->keys(),
        //     'first_partner_fees' => $transferFeesMap->first(),
        // ]);

        // Step 4: 查詢訂單（只載入基本資訊）
        $orders = Order::with(['partner'])
            ->whereNotNull('start_time')
            ->whereNotNull('end_time')
            ->whereBetween('start_time', [$monthStartDate, $monthEndDate])
            ->when($partnerId, fn($q) => $q->where('partner_id', $partnerId))
            ->get();

        // dd('Step 4: 訂單查詢完成', [
        //     'orders_count' => $orders->count(),
        //     'first_order' => $orders->first(),
        //     'first_order_partner' => $orders->first()?->partner,
        //     'first_order_scooters_count' => $orders->first()?->scooters->count(),
        //     'first_order_scooter_model' => $orders->first()?->scooters->first()?->scooterModel,
        // ]);

        // Step 5: 生成完整月份日期列表
        $allDates = collect();
        $currentDate = $monthStartDate->copy();
        while ($currentDate->lte($monthEndDate)) {
            $allDates->push([
                'date' => $currentDate->format('Y-m-d'),
                'weekday' => $currentDate->format('l'),
            ]);
            $currentDate->addDay();
        }

        // dd('Step 5: 日期列表生成完成', [
        //     'allDates_count' => $allDates->count(),
        //     'first_date' => $allDates->first(),
        //     'last_date' => $allDates->last(),
        // ]);

        // Step 6: 按合作商分組訂單
        $ordersByPartner = $orders->groupBy(function ($order) {
            return $order->partner?->name ?? '無合作商';
        });

        // dd('Step 6: 訂單按合作商分組完成', [
        //     'ordersByPartner_count' => $ordersByPartner->count(),
        //     'ordersByPartner_keys' => $ordersByPartner->keys(),
        //     'first_partner_orders_count' => $ordersByPartner->first()?->count(),
        // ]);

        // Step 7: 處理每個合作商的訂單數據
        $reportData = $ordersByPartner->map(function ($partnerOrders, $partnerName) use ($transferFeesMap, $allDates) {
            $firstOrder = $partnerOrders->first();
            $partnerId = $firstOrder->partner_id;

            // 處理訂單數據
            $datesData = $this->processPartnerOrders($partnerOrders, $transferFeesMap, $partnerId);

            // 合併完整日期列表，將 datesData 轉換為 models 陣列格式
            // 按 order_number 分開顯示，即使型號相同也要分開
            $dates = $allDates->map(function ($dateInfo) use ($datesData) {
                $dateStr = $dateInfo['date'];
                $dateOrders = $datesData->get($dateStr, collect());
                
                // 如果該日期有數據，按 order_number 分組
                $ordersArray = [];
                if ($dateOrders->isNotEmpty()) {
                    // $dateOrders 的 key 就是 order_number，value 是 Collection<model_string, modelData>
                    foreach ($dateOrders as $orderNumber => $orderModels) {
                        // 將該訂單的 models 轉換為陣列
                        $models = $orderModels->map(function ($modelData) {
                            return [
                                'model' => $modelData['model'] ?? '',
                                'type' => $modelData['type'] ?? '',
                                'same_day_count' => ($modelData['same_day_count'] ?? 0) > 0 ? $modelData['same_day_count'] : '',
                                'same_day_days' => ($modelData['same_day_days'] ?? 0) > 0 ? $modelData['same_day_days'] : '',
                                'same_day_amount' => ($modelData['same_day_amount'] ?? 0) > 0 ? $modelData['same_day_amount'] : '',
                                'overnight_count' => ($modelData['overnight_count'] ?? 0) > 0 ? $modelData['overnight_count'] : '',
                                'overnight_days' => ($modelData['overnight_days'] ?? 0) > 0 ? $modelData['overnight_days'] : '',
                                'overnight_amount' => ($modelData['overnight_amount'] ?? 0) > 0 ? $modelData['overnight_amount'] : '',
                            ];
                        })->values()->toArray();
                        
                        $ordersArray[] = [
                            'order_number' => $orderNumber,
                            'models' => $models,
                        ];
                    }
                }
                
                return [
                    'date' => $dateStr,
                    'weekday' => $dateInfo['weekday'],
                    'orders' => $ordersArray, // 改為 orders 陣列，每個元素代表一個訂單
                ];
            })->values();

            return [
                'partner_id' => $partnerId,
                'partner_name' => $partnerName,
                'dates' => $dates,
            ];
        })->values();

        // Step 9: 返回 JSON 數據
        return response()->json([
            'data' => [
                'partners' => $reportData,
                'models' => $allModels,
                'month' => $month,
            ],
        ]);
    }

    /**
     * 前端合作商單月統計 API
     * 分合作商統計，返回 JSON 格式
     * 計算公式：機車型號數量 * 合作商機車型號的金額 * 天數
     */
    public function partnerMonthlyStatistics(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'month' => 'required|date_format:Y-m',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $month = $request->get('month');
        $monthStartDate = Carbon::parse($month . '-01')->timezone('Asia/Taipei')->startOfMonth();
        $monthEndDate = Carbon::parse($month . '-01')->timezone('Asia/Taipei')->endOfMonth();

        // 步驟 1: 獲取所有機車型號（用於 header）
        $allScooterModels = ScooterModel::orderBy('sort_order', 'desc')->get();
        $headers = $allScooterModels->map(fn($model) => "{$model->name} {$model->type}")->toArray();

        // 步驟 2: 預載入所有合作商的調車費用（當日租和跨日租）
        $transferFeesMap = PartnerScooterModelTransferFee::with('scooterModel')
            ->get()
            ->groupBy('partner_id')
            ->map(function ($fees) {
                return $fees->keyBy(function ($fee) {
                    return $fee->scooterModel
                        ? "{$fee->scooterModel->name} {$fee->scooterModel->type}"
                        : null;
                })->filter();
            });

        // 步驟 3: 查詢該月份的所有訂單（必須有 partner_id）
        $orders = Order::whereNotNull('start_time')
            ->whereNotNull('end_time')
            ->whereNotNull('partner_id')
            ->whereBetween('start_time', [$monthStartDate, $monthEndDate])
            ->get();

        // 步驟 4: 生成完整月份日期列表
        $allDates = collect();
        $currentDate = $monthStartDate->copy();
        while ($currentDate->lte($monthEndDate)) {
            $allDates->push($currentDate->format('Y-m-d'));
            $currentDate->addDay();
        }

        // 步驟 5: 按合作商分組處理，並按日期分組
        $partnersData = $orders->groupBy('partner_id')->map(function ($partnerOrders, $partnerId) use ($transferFeesMap, $allDates, $monthStartDate, $monthEndDate) {
            $firstOrder = $partnerOrders->first();
            $partnerName = $firstOrder->partner->name ?? '無合作商';

            // 按日期分組處理每個訂單
            $datesData = collect();
            
            foreach ($partnerOrders as $order) {
                $startTime = Carbon::parse($order->start_time)->timezone('Asia/Taipei');
                $endTime = Carbon::parse($order->end_time)->timezone('Asia/Taipei');
                
                // 判斷是當日租還是跨日租
                $isSameDay = $startTime->isSameDay($endTime);
                
                // 計算天數：
                // - 同一天：1 天（當日租）
                // - 跨日：計算夜數（start_date ~ end_date - 1）
                //   例如：1/1-1/2 = 1 夜（2天1夜）
                //   例如：1/1-1/3 = 2 夜（3天2夜）
                //   例如：1/1-1/4 = 3 夜（4天3夜）
                if ($isSameDay) {
                    $days = 1;
                } else {
                    $days = $startTime->diffInDays($endTime); // 直接使用 diffInDays 作為夜數
                }

                // 查詢該訂單的所有 order_scooter 記錄
                $orderScooters = OrderScooter::where('order_id', $order->id)
                    ->with(['scooter'])
                    ->get();

                // 按機車型號分組
                $orderScooters->groupBy(function ($orderScooter) {
                    return $orderScooter->model_string;
                })->filter(function ($orderScooters, $modelString) {
                    return !empty($modelString);
                })->each(function ($orderScooters, $modelString) use ($datesData, $startTime, $days, $isSameDay, $transferFeesMap, $partnerId) {
                    // 計算該 model 的台數
                    $scooterCount = $orderScooters->count();

                    // 獲取合作商的機車型號單價（當日租或跨日租）
                    $feeKey = $transferFeesMap->get($partnerId)?->get($modelString);
                    $transferFeePerUnit = $feeKey
                        ? ($isSameDay ? ($feeKey->same_day_transfer_fee ?? 0) : ($feeKey->overnight_transfer_fee ?? 0))
                        : 0;

                    // 計算費用：金額 × 天數 × 台數
                    // 例如：2台 = 金額 × 天數 × 2, 3台 = 金額 × 天數 × 3
                    $amount = (int) $transferFeePerUnit * $days * $scooterCount;

                    // 使用 start_time 的日期作為 key
                    $dateKey = $startTime->format('Y-m-d');

                    // 初始化該日期的數據
                    if (!$datesData->has($dateKey)) {
                        $datesData->put($dateKey, collect());
                    }

                    $dateModels = $datesData->get($dateKey);
                    $field = $isSameDay ? 'same_day' : 'overnight';

                    // 累加到該日期該 model 的數據（當日租和跨日租分開計算）
                    if ($dateModels->has($modelString)) {
                        $existing = $dateModels->get($modelString);
                        $dateModels->put($modelString, [
                            'model' => $modelString,
                            // 當日租數據
                            'same_day_count' => ($existing['same_day_count'] ?? 0) + ($isSameDay ? $scooterCount : 0),
                            'same_day_days' => ($existing['same_day_days'] ?? 0) + ($isSameDay ? $days : 0),
                            'same_day_amount' => ($existing['same_day_amount'] ?? 0) + ($isSameDay ? $amount : 0),
                            // 跨日租數據
                            'overnight_count' => ($existing['overnight_count'] ?? 0) + (!$isSameDay ? $scooterCount : 0),
                            'overnight_days' => ($existing['overnight_days'] ?? 0) + (!$isSameDay ? $days : 0),
                            'overnight_amount' => ($existing['overnight_amount'] ?? 0) + (!$isSameDay ? $amount : 0),
                            // 總計
                            'total_count' => ($existing['total_count'] ?? 0) + $scooterCount,
                            'total_days' => ($existing['total_days'] ?? 0) + $days,
                            'total_amount' => ($existing['total_amount'] ?? 0) + $amount,
                        ]);
                    } else {
                        $dateModels->put($modelString, [
                            'model' => $modelString,
                            // 當日租數據
                            'same_day_count' => $isSameDay ? $scooterCount : 0,
                            'same_day_days' => $isSameDay ? $days : 0,
                            'same_day_amount' => $isSameDay ? $amount : 0,
                            // 跨日租數據
                            'overnight_count' => !$isSameDay ? $scooterCount : 0,
                            'overnight_days' => !$isSameDay ? $days : 0,
                            'overnight_amount' => !$isSameDay ? $amount : 0,
                            // 總計
                            'total_count' => $scooterCount,
                            'total_days' => $days,
                            'total_amount' => $amount,
                        ]);
                    }
                });
            }

            // 生成完整日期列表，包含每一天的數據
            $dates = $allDates->map(function ($dateStr) use ($datesData) {
                $dateModels = $datesData->get($dateStr, collect());
                
                return [
                    'date' => $dateStr,
                    'weekday' => Carbon::parse($dateStr)->format('l'),
                    'models' => $dateModels->values()->toArray(),
                ];
            })->toArray();

            return [
                'partner_id' => $partnerId,
                'partner_name' => $partnerName,
                'dates' => $dates,
            ];
        })->values();

        return response()->json([
            'data' => [
                'partners' => $partnersData->toArray(),
                'headers' => $headers,
            ],
            'month' => $month,
        ]);
    }

    /**
     * 處理合作商訂單數據（提取的私有方法，用於簡化 partnerDailyReport）
     * 
     * @param \Illuminate\Support\Collection $partnerOrders
     * @param \Illuminate\Support\Collection $transferFeesMap
     * @param int $partnerId
     * @return \Illuminate\Support\Collection<string, \Illuminate\Support\Collection<string, array>>
     */
    private function processPartnerOrders($partnerOrders, $transferFeesMap, $partnerId): \Illuminate\Support\Collection
    {
        $datesData = collect();
        
        foreach ($partnerOrders as $order) {
            $startTime = Carbon::parse($order->start_time)->timezone('Asia/Taipei');
            $endTime = Carbon::parse($order->end_time)->timezone('Asia/Taipei');
            $keyDate = $startTime->format('Y-m-d');
            
            // 判斷是當日租還是跨日租
            $isSameDay = $startTime->isSameDay($endTime);
            
            // 計算天數：當日租 = 1 天，跨日租 = 夜數
            $days = $isSameDay ? 1 : $startTime->diffInDays($endTime);

            // 查詢該訂單的所有 order_scooter 記錄
            $orderScooters = OrderScooter::where('order_id', $order->id)
                ->with(['scooter'])
                ->get();

            // 按機車型號分組並處理
            $orderScooters->groupBy(function ($orderScooter) {
                return $orderScooter->model_string;
            })->filter(function ($orderScooters, $modelString) {
                return !empty($modelString);
            })->each(function ($orderScooters, $modelString) use ($datesData, $keyDate, $days, $isSameDay, $transferFeesMap, $partnerId, $order) {
                $scooterCount = $orderScooters->count();

                // 獲取合作商的機車型號單價（當日租或跨日租）
                $feeKey = $transferFeesMap->get($partnerId)?->get($modelString);
                $transferFeePerUnit = $feeKey
                    ? ($isSameDay ? ($feeKey->same_day_transfer_fee ?? 0) : ($feeKey->overnight_transfer_fee ?? 0))
                    : 0;

                // 計算費用：金額 × 天數 × 台數
                $amount = (int) $transferFeePerUnit * $days * $scooterCount;

                // 初始化該日期的數據（按 order_number 分組）
                if (!$datesData->has($keyDate)) {
                    $datesData->put($keyDate, collect());
                }

                $dateOrders = $datesData->get($keyDate);
                $orderNumber = $order->order_number ?? $order->id; // 使用 order_number，如果沒有則使用 id
                
                // 初始化該訂單的數據
                if (!$dateOrders->has($orderNumber)) {
                    $dateOrders->put($orderNumber, collect());
                }

                $orderModels = $dateOrders->get($orderNumber);
                $modelParts = explode(' ', $modelString, 2);

                // 按 order_number 分開存儲，即使型號相同也要分開
                // 但如果同一個訂單內同一個型號有多筆記錄，需要累加（參考 partnerMonthlyStatistics）
                if ($orderModels->has($modelString)) {
                    $existing = $orderModels->get($modelString);
                    $orderModels->put($modelString, [
                        'model_string' => $modelString,
                        'model' => $modelParts[0] ?? '',
                        'type' => $modelParts[1] ?? '',
                        'order_number' => $orderNumber,
                        'same_day_count' => ($existing['same_day_count'] ?? 0) + ($isSameDay ? $scooterCount : 0),
                        'same_day_days' => ($existing['same_day_days'] ?? 0) + ($isSameDay ? $days : 0),
                        'same_day_amount' => ($existing['same_day_amount'] ?? 0) + ($isSameDay ? $amount : 0),
                        'overnight_count' => ($existing['overnight_count'] ?? 0) + (!$isSameDay ? $scooterCount : 0),
                        'overnight_days' => ($existing['overnight_days'] ?? 0) + (!$isSameDay ? $days : 0),
                        'overnight_amount' => ($existing['overnight_amount'] ?? 0) + (!$isSameDay ? $amount : 0),
                    ]);
                } else {
                    $orderModels->put($modelString, [
                        'model_string' => $modelString,
                        'model' => $modelParts[0] ?? '',
                        'type' => $modelParts[1] ?? '',
                        'order_number' => $orderNumber,
                        'same_day_count' => $isSameDay ? $scooterCount : 0,
                        'same_day_days' => $isSameDay ? $days : 0,
                        'same_day_amount' => $isSameDay ? $amount : 0,
                        'overnight_count' => !$isSameDay ? $scooterCount : 0,
                        'overnight_days' => !$isSameDay ? $days : 0,
                        'overnight_amount' => !$isSameDay ? $amount : 0,
                    ]);
                }
            });
        }
        
        return $datesData;
    }

    /**
     * 計算訂單金額（根據合作商、機車型號和時間）
     * 
     * @param int|null $partnerId 合作商 ID
     * @param array $scooterIds 機車 ID 陣列
     * @param string|null $startTime 開始時間
     * @param string|null $endTime 結束時間
     * @return float 計算出的總金額
     */
    private function calculateOrderAmount($partnerId, $scooterIds, $startTime, $endTime): float
    {
        // 如果沒有合作商、機車或時間，返回 0
        if (!$partnerId || empty($scooterIds) || !$startTime || !$endTime) {
            return 0;
        }

        // 查詢機車資料
        $scooters = Scooter::whereIn('id', $scooterIds)->get();
        if ($scooters->isEmpty()) {
            return 0;
        }

        // 計算天數
        $startTimeCarbon = Carbon::parse($startTime)->timezone('Asia/Taipei');
        $endTimeCarbon = Carbon::parse($endTime)->timezone('Asia/Taipei');
        $isSameDay = $startTimeCarbon->isSameDay($endTimeCarbon);
        
        if ($isSameDay) {
            $days = 1; // 當日租
        } else {
            $days = $startTimeCarbon->diffInDays($endTimeCarbon); // 跨日租：夜數
        }

        // 預載入合作商的機車型號費用
        $transferFeesMap = PartnerScooterModelTransferFee::with('scooterModel')
            ->where('partner_id', $partnerId)
            ->get()
            ->keyBy(function ($fee) {
                return $fee->scooterModel
                    ? "{$fee->scooterModel->name} {$fee->scooterModel->type}"
                    : null;
            })
            ->filter();

        $totalAmount = 0;

        // 按機車型號分組
        $scootersByModel = $scooters->groupBy(function ($scooter) {
            $model = $scooter->attributes['model'] ?? '';
            $type = $scooter->attributes['type'] ?? '';
            if ($model && $type) {
                return trim("{$model} {$type}");
            }
            if ($model) {
                return $model;
            }
            if ($type) {
                return $type;
            }
            // 如果都沒有，使用車牌號作為 fallback
            return $scooter->plate_number ?? '';
        })->filter(function ($scooters, $modelString) {
            return !empty($modelString);
        });

        // 計算每個機車型號的費用
        foreach ($scootersByModel as $modelString => $modelScooters) {
            $scooterCount = $modelScooters->count();

            // 獲取合作商的機車型號單價（當日租或跨日租）
            $feeKey = $transferFeesMap->get($modelString);
            $transferFeePerUnit = $feeKey
                ? ($isSameDay ? ($feeKey->same_day_transfer_fee ?? 0) : ($feeKey->overnight_transfer_fee ?? 0))
                : 0;

            // 計算費用：金額 × 天數 × 台數
            $amount = (int) $transferFeePerUnit * $days * $scooterCount;
            $totalAmount += $amount;
        }

        return (float) $totalAmount;
    }
}

