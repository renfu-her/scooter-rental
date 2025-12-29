<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Scooter;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

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
            'start_time' => 'required|date',
            'end_time' => 'required|date',
            'expected_return_time' => 'nullable|date',
            'phone' => 'nullable|string|max:20',
            'shipping_company' => 'nullable|in:泰富,藍白,聯營,大福',
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
            'appointment_date' => 'nullable|date',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date',
            'expected_return_time' => 'nullable|date',
            'phone' => 'nullable|string|max:20',
            'shipping_company' => 'nullable|in:泰富,藍白,聯營,大福',
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
            $scooterCount = $order->scooters->count();
            $amount = (float) $order->payment_amount;

            if (!isset($partnerStats[$partnerName])) {
                $partnerStats[$partnerName] = [
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
}

