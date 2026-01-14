<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Scooter;
use App\Models\PartnerScooterModelTransferFee;
use App\Models\ScooterModel;
use App\Exports\PartnerMonthlyReportExport;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

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
            'payment_amount' => 'required|numeric|min:0',
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
            'payment_amount' => 'required|numeric|min:0',
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
        // Debug: 記錄請求信息
        \Log::info('partnerDailyReport called', [
            'request_all' => $request->all(),
            'request_method' => $request->method(),
            'request_url' => $request->fullUrl(),
            'request_headers' => $request->headers->all(),
        ]);

        
        $validator = Validator::make($request->all(), [
            'month' => 'required|date_format:Y-m',
            'partner_id' => 'nullable|exists:partners,id',
        ]);

        if ($validator->fails()) {
            \Log::warning('partnerDailyReport validation failed', [
                'errors' => $validator->errors()->toArray(),
                'request' => $request->all(),
            ]);
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $month = $request->get('month');
        $partnerId = $request->get('partner_id');
        
        \Log::info('partnerDailyReport processing', [
            'month' => $month,
            'partner_id' => $partnerId,
        ]);
        
        try {
            // 獲取所有機車型號（從機車型號管理）
            $allScooterModels = ScooterModel::orderBy('sort_order', 'desc')->get();
            if ($allScooterModels->isEmpty()) {
                \Log::warning('No scooter models found');
                return response()->json([
                    'message' => 'No scooter models found',
                ], 404);
            }
            
            $allModels = $allScooterModels->map(function ($model) {
                return $model->name . ' ' . $model->type;
            })->toArray();
            
            \Log::info('Scooter models loaded', [
                'count' => count($allModels),
                'models' => $allModels,
            ]);
            
            $monthStartDate = Carbon::parse($month . '-01')->timezone('Asia/Taipei')->startOfMonth();
            $monthEndDate = Carbon::parse($month . '-01')->timezone('Asia/Taipei')->endOfMonth();

            // Get orders for the month with scooters and partner
            $query = Order::with(['partner', 'scooters.scooterModel'])
                ->whereNotNull('start_time')
                ->whereNotNull('end_time')
                ->whereRaw('DATE_FORMAT(start_time, "%Y-%m") = ?', [$month]);

            if ($partnerId) {
                $query->where('partner_id', $partnerId);
            }

            $orders = $query->get();
            
            \Log::info('Orders loaded', [
                'count' => $orders->count(),
                'month' => $month,
                'partner_id' => $partnerId,
            ]);

            // Group by partner, date, and scooter model
            $reportData = [];
            // 注意：$allModels 已經在上面定義為所有機車型號（從資料庫獲取），不需要重新初始化

            foreach ($orders as $order) {
                $partnerName = $order->partner ? $order->partner->name : '無合作商';
                $partnerId = $order->partner_id;

                // Use start_time date as the key date
                $keyDate = Carbon::parse($order->start_time)->timezone('Asia/Taipei')->format('Y-m-d');
                $keyDateWeekday = Carbon::parse($order->start_time)->timezone('Asia/Taipei')->format('l');
                
                // Calculate days
                $startTime = Carbon::parse($order->start_time)->timezone('Asia/Taipei');
                $endTime = Carbon::parse($order->end_time)->timezone('Asia/Taipei');
                $startDate = $startTime->format('Y-m-d');
                $endDate = $endTime->format('Y-m-d');
                
                // 判斷是當日租還是跨日租
                $isSameDay = ($startDate === $endDate);
                // 天數計算：結束日期 - 開始日期（夜數）
                $diffDays = $startTime->diffInDays($endTime);
                $days = $isSameDay ? 1 : $diffDays;

                // Group scooters by model
                $scootersByModel = $order->scooters->groupBy(function ($scooter) {
                    $modelName = $scooter->scooterModel ? $scooter->scooterModel->name : $scooter->model;
                    $modelType = $scooter->scooterModel ? $scooter->scooterModel->type : $scooter->type;
                    return ($modelName ?? '') . ' ' . ($modelType ?? '');
                });

                foreach ($scootersByModel as $modelString => $scooters) {
                $scooterCount = $scooters->count();
                
                // 解析 model 和 type
                $parts = explode(' ', $modelString, 2);
                $model = $parts[0] ?? '';
                $type = $parts[1] ?? '';

                // 獲取該合作商的調車費用
                $transferFee = 0;
                $transferFeePerUnit = 0;

                if ($partnerId && $model && $type) {
                    $scooterModel = ScooterModel::where('name', $model)
                        ->where('type', $type)
                        ->first();

                    if ($scooterModel) {
                        $transferFeeRecord = PartnerScooterModelTransferFee::where('partner_id', $partnerId)
                            ->where('scooter_model_id', $scooterModel->id)
                            ->first();

                        if ($transferFeeRecord) {
                            if ($isSameDay) {
                                $transferFeePerUnit = $transferFeeRecord->same_day_transfer_fee ?? 0;
                            } else {
                                $transferFeePerUnit = $transferFeeRecord->overnight_transfer_fee ?? 0;
                            }
                        }
                    }
                }

                // 計算該型號的總費用：調車費用 × 台數 × 天數
                $transferFee = (int) $transferFeePerUnit * (int) $scooterCount * (int) $days;
                
                \Log::debug('Transfer fee calculation', [
                    'partner_id' => $partnerId,
                    'model' => $model,
                    'type' => $type,
                    'transfer_fee_per_unit' => $transferFeePerUnit,
                    'scooter_count' => $scooterCount,
                    'days' => $days,
                    'transfer_fee' => $transferFee,
                    'is_same_day' => $isSameDay,
                ]);

                // 只記錄有費用的部分
                if ($transferFee > 0) {
                    // 注意：$allModels 已經包含所有機車型號，不需要在這裡收集

                    // 初始化合作商數據
                    if (!isset($reportData[$partnerName])) {
                        $reportData[$partnerName] = [
                            'partner_id' => $partnerId,
                            'partner_name' => $partnerName,
                            'dates' => [],
                        ];
                    }

                    // 初始化日期數據
                    if (!isset($reportData[$partnerName]['dates'][$keyDate])) {
                        $reportData[$partnerName]['dates'][$keyDate] = [
                            'date' => $keyDate,
                            'weekday' => $keyDateWeekday,
                            'models' => [],
                        ];
                    }

                    // 初始化該日期的該車型數據
                    if (!isset($reportData[$partnerName]['dates'][$keyDate]['models'][$modelString])) {
                        $reportData[$partnerName]['dates'][$keyDate]['models'][$modelString] = [
                            'model' => $model,
                            'type' => $type,
                            'same_day_count' => 0,
                            'same_day_days' => 0,
                            'same_day_amount' => 0,
                            'overnight_count' => 0,
                            'overnight_days' => 0,
                            'overnight_amount' => 0,
                        ];
                    }

                    // 累加數據
                    if ($isSameDay) {
                        $reportData[$partnerName]['dates'][$keyDate]['models'][$modelString]['same_day_count'] += $scooterCount;
                        $reportData[$partnerName]['dates'][$keyDate]['models'][$modelString]['same_day_days'] += $days;
                        $reportData[$partnerName]['dates'][$keyDate]['models'][$modelString]['same_day_amount'] += $transferFee;
                    } else {
                        $reportData[$partnerName]['dates'][$keyDate]['models'][$modelString]['overnight_count'] += $scooterCount;
                        $reportData[$partnerName]['dates'][$keyDate]['models'][$modelString]['overnight_days'] += $days;
                        $reportData[$partnerName]['dates'][$keyDate]['models'][$modelString]['overnight_amount'] += $transferFee;
                    }
                }
            }
            }

            // 生成整個月份的日期列表（只包含有費用的日期）
            $currentDate = $monthStartDate->copy();
            $allDates = [];
            
            while ($currentDate->lte($monthEndDate)) {
                $dateStr = $currentDate->format('Y-m-d');
                $weekday = $currentDate->format('l');
                $allDates[] = [
                    'date' => $dateStr,
                    'weekday' => $weekday,
                ];
                $currentDate->addDay();
            }

            // 為每個合作商生成完整的日期列表
            foreach ($reportData as $partnerName => &$partnerData) {
                // 確保 $partnerData 是數組且包含 dates 鍵
                if (!is_array($partnerData)) {
                    \Log::warning('Invalid partnerData structure', [
                        'partner_name' => $partnerName,
                        'partner_data' => $partnerData,
                    ]);
                    continue;
                }
                
                // 確保 dates 鍵存在且為數組
                if (!isset($partnerData['dates']) || !is_array($partnerData['dates'])) {
                    $partnerData['dates'] = [];
                }
                
                $partnerDates = [];
                foreach ($allDates as $dateInfo) {
                    $dateStr = $dateInfo['date'] ?? null;
                    if ($dateStr && isset($partnerData['dates'][$dateStr])) {
                        $partnerDates[] = $partnerData['dates'][$dateStr];
                    } else {
                        // 沒有費用的日期，但為了完整性可以包含（前端可以過濾）
                        $partnerDates[] = [
                            'date' => $dateStr ?? '',
                            'weekday' => $dateInfo['weekday'] ?? '',
                            'models' => [],
                        ];
                    }
                }
                $partnerData['dates'] = $partnerDates;
            }

            // 如果提供了 partner_id，生成並返回 Excel 檔案
            if ($partnerId) {
                \Log::info('Looking for partner data', [
                    'partner_id' => $partnerId,
                    'month' => $month,
                    'report_data_count' => count($reportData),
                    'report_data_keys' => array_keys($reportData),
                ]);
                
                $partnerData = null;
                foreach ($reportData as $pName => $pData) {
                    // 檢查 $pData 是否為數組且包含 partner_id
                    if (is_array($pData) && isset($pData['partner_id']) && $pData['partner_id'] == $partnerId) {
                        $partnerData = $pData;
                        \Log::info('Partner data found', [
                            'partner_name' => $pName,
                            'partner_id' => $pData['partner_id'],
                            'dates_count' => isset($pData['dates']) ? count($pData['dates']) : 0,
                        ]);
                        break;
                    }
                }
            
                if (!$partnerData) {
                    \Log::warning('Partner data not found', [
                        'partner_id' => $partnerId,
                        'month' => $month,
                        'report_data_keys' => array_keys($reportData),
                        'report_data_structure' => array_map(function($pData) {
                            return is_array($pData) && isset($pData['partner_id']) ? $pData['partner_id'] : 'invalid';
                        }, $reportData),
                        'orders_count' => $orders->count(),
                    ]);
                    return response()->json([
                        'message' => 'Partner not found or no data for this month',
                        'debug' => config('app.debug') ? [
                            'partner_id' => $partnerId,
                            'report_data_keys' => array_keys($reportData),
                            'orders_count' => $orders->count(),
                        ] : null,
                    ], 404);
                }
                
                // 獲取合作商名稱
                $partner = \App\Models\Partner::find($partnerId);
                $partnerName = $partner ? $partner->name : '無合作商';
                
                // 生成整個月份的日期列表
                $currentDate = $monthStartDate->copy();
                $allDates = [];
                
                while ($currentDate->lte($monthEndDate)) {
                    $dateStr = $currentDate->format('Y-m-d');
                    $weekday = $currentDate->format('l');
                    // 檢查 partnerData 和 dates 是否存在
                    if (isset($partnerData['dates']) && is_array($partnerData['dates']) && isset($partnerData['dates'][$dateStr])) {
                        $allDates[] = $partnerData['dates'][$dateStr];
                    } else {
                        $allDates[] = [
                            'date' => $dateStr,
                            'weekday' => $weekday,
                            'models' => [],
                        ];
                    }
                    $currentDate->addDay();
                }
                
                [$year, $monthNum] = explode('-', $month);
                
                \Log::info('Generating Excel', [
                    'partner_name' => $partnerName,
                    'year' => $year,
                    'month' => $monthNum,
                    'dates_count' => count($allDates),
                    'models_count' => count($allModels),
                ]);
                
                // 使用 Export 類生成 Excel
                $export = new PartnerMonthlyReportExport($partnerName, $year, $monthNum, $allDates, $allModels);
                $spreadsheet = $export->generate();
                
                $fileName = $partnerName . '-' . $year . str_pad($monthNum, 2, '0', STR_PAD_LEFT) . '.xlsx';
                
                // 使用 PhpSpreadsheet Writer 生成檔案
                $writer = new Xlsx($spreadsheet);
                
                // 創建臨時檔案
                $tempFile = tempnam(sys_get_temp_dir(), 'excel_');
                if ($tempFile === false) {
                    \Log::error('Failed to create temporary file for Excel export');
                    return response()->json([
                        'message' => 'Failed to create temporary file',
                    ], 500);
                }
                
                $writer->save($tempFile);
                
                // 檢查檔案是否成功創建
                if (!file_exists($tempFile)) {
                    \Log::error('Excel file was not created', ['tempFile' => $tempFile]);
                    return response()->json([
                        'message' => 'Failed to generate Excel file',
                    ], 500);
                }
                
                \Log::info('Excel file generated successfully', [
                    'file' => $tempFile,
                    'filename' => $fileName,
                ]);
                
                // 返回檔案下載響應
                return response()->download($tempFile, $fileName, [
                    'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ])->deleteFileAfterSend(true);
            }

            // 如果沒有提供 partner_id，返回 JSON 數據（保持向後兼容）
            // 為每個合作商生成完整的日期列表
            foreach ($reportData as $partnerName => &$partnerData) {
                $partnerDates = [];
                $currentDate = $monthStartDate->copy();
                while ($currentDate->lte($monthEndDate)) {
                    $dateStr = $currentDate->format('Y-m-d');
                    $weekday = $currentDate->format('l');
                    if (isset($partnerData['dates'][$dateStr])) {
                        $partnerDates[] = $partnerData['dates'][$dateStr];
                    } else {
                        $partnerDates[] = [
                            'date' => $dateStr,
                            'weekday' => $weekday,
                            'models' => [],
                        ];
                    }
                    $currentDate->addDay();
                }
                $partnerData['dates'] = $partnerDates;
            }

            // 轉換為數組格式
            $result = [
                'partners' => array_values($reportData),
                'models' => $allModels,
                'month' => $month,
            ];

            return response()->json([
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            \Log::error('partnerDailyReport exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'request' => $request->all(),
            ]);
            
            return response()->json([
                'message' => 'An error occurred while processing the request',
                'error' => config('app.debug') ? [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ] : null,
            ], 500);
        }
    }
}

