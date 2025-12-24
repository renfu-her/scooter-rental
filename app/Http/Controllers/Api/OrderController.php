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
            $startDate = Carbon::parse($month . '-01')->startOfMonth();
            $endDate = Carbon::parse($month . '-01')->endOfMonth();
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
            'tenant' => 'required|string|max:255',
            'appointment_date' => 'required|date',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'expected_return_time' => 'nullable|date',
            'phone' => 'nullable|string|max:20',
            'shipping_company' => 'nullable|in:泰富,藍白,聯營,大福',
            'ship_arrival_time' => 'nullable|date',
            'ship_return_time' => 'nullable|date',
            'payment_method' => 'nullable|in:現金,月結,日結',
            'payment_amount' => 'required|numeric|min:0',
            'status' => 'required|in:進行中,已完成,已取消,預約中',
            'remark' => 'nullable|string',
            'scooter_ids' => 'required|array|min:1',
            'scooter_ids.*' => 'exists:scooters,id',
        ]);

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
            $order = Order::create($validator->validated());
            $order->scooters()->attach($scooterIds);

            // Update scooter status to 出租中
            Scooter::whereIn('id', $scooterIds)->update(['status' => '出租中']);

            DB::commit();

            return response()->json([
                'message' => 'Order created successfully',
                'data' => new OrderResource($order->load(['partner', 'scooters'])),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create order',
                'error' => $e->getMessage(),
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
            'tenant' => 'required|string|max:255',
            'appointment_date' => 'required|date',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'expected_return_time' => 'nullable|date',
            'phone' => 'nullable|string|max:20',
            'shipping_company' => 'nullable|in:泰富,藍白,聯營,大福',
            'ship_arrival_time' => 'nullable|date',
            'ship_return_time' => 'nullable|date',
            'payment_method' => 'nullable|in:現金,月結,日結',
            'payment_amount' => 'required|numeric|min:0',
            'status' => 'required|in:進行中,已完成,已取消,預約中',
            'remark' => 'nullable|string',
            'scooter_ids' => 'sometimes|array|min:1',
            'scooter_ids.*' => 'exists:scooters,id',
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
            $oldScooterIds = $order->scooters->pluck('id')->toArray();

            $order->update($validator->validated());

            // Update scooters if provided
            if ($request->has('scooter_ids')) {
                $newScooterIds = $request->get('scooter_ids');
                
                // Check if new scooters are available
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

                // Update old scooters status to 待出租
                Scooter::whereIn('id', $oldScooterIds)
                    ->whereNotIn('id', $newScooterIds)
                    ->update(['status' => '待出租']);

                // Update new scooters status to 出租中
                Scooter::whereIn('id', $newScooterIds)
                    ->whereNotIn('id', $oldScooterIds)
                    ->update(['status' => '出租中']);
            }

            // Handle status change: if order is completed or cancelled, set scooters to 待出租
            $newStatus = $order->status;
            if (($oldStatus !== '已完成' && $oldStatus !== '已取消') && 
                ($newStatus === '已完成' || $newStatus === '已取消')) {
                $order->scooters()->update(['status' => '待出租']);
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
        $startDate = Carbon::parse($month . '-01')->startOfMonth();
        $endDate = Carbon::parse($month . '-01')->endOfMonth();

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
}

