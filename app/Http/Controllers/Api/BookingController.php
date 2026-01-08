<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\BookingMail;
use App\Models\Booking;
use App\Models\Order;
use App\Models\Scooter;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BookingController extends Controller
{
    /**
     * Send booking form email
     */
    public function send(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'lineId' => 'nullable|string|max:255', // 改為可選
            'phone' => 'required|string|max:20',
            'appointmentDate' => 'required|date',
            'endDate' => 'required|date|after_or_equal:appointmentDate',
            'shippingCompany' => 'required|in:泰富,藍白,聯營,大福',
            'shipArrivalTime' => 'required|date',
            'adults' => 'nullable|integer|min:0',
            'children' => 'nullable|integer|min:0',
            'scooters' => 'required|array|min:1',
            'scooters.*.model' => 'required|string|max:255',
            'scooters.*.type' => 'required|in:白牌,綠牌,電輔車,三輪車',
            'scooters.*.count' => 'required|integer|min:1',
            'note' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => '驗證錯誤',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = $validator->validated();
            
            // 確保 lineId 存在於郵件資料中（即使為空）
            $mailData = $data;
            $mailData['lineId'] = $data['lineId'] ?? null;
            
            // 將 scooters 陣列轉換為資料庫格式（model + type 組合）
            $scooters = array_map(function($item) {
                return [
                    'model' => $item['model'] . ' ' . $item['type'],
                    'count' => $item['count'],
                ];
            }, $data['scooters']);
            
            // 儲存到資料庫
            $booking = Booking::create([
                'name' => $data['name'],
                'line_id' => $data['lineId'] ?? null,
                'phone' => $data['phone'],
                'booking_date' => $data['appointmentDate'],
                'end_date' => $data['endDate'],
                'shipping_company' => $data['shippingCompany'],
                'ship_arrival_time' => $data['shipArrivalTime'],
                'adults' => $data['adults'] ?? null,
                'children' => $data['children'] ?? null,
                'scooters' => $scooters,
                'note' => $data['note'] ?? null,
                'status' => '預約中', // 預設狀態為「預約中」
            ]);
            
            // 發送郵件給管理員（因為沒有 email，無法發送給用戶）
            Mail::to('zau1110216@gmail.com')->send(new BookingMail($mailData));

            return response()->json([
                'message' => '預約已成功提交，我們會盡快與您聯繫確認詳情！',
            ]);
        } catch (\Exception $e) {
            \Log::error('Booking form error: ' . $e->getMessage());
            
            return response()->json([
                'message' => '發送郵件時發生錯誤，請稍後再試。',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Display a listing of bookings (for backend admin)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Booking::query();

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('line_id', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        // Order by created_at desc
        $bookings = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $bookings,
        ]);
    }

    /**
     * Display the specified booking.
     */
    public function show(Booking $booking): JsonResponse
    {
        return response()->json([
            'data' => $booking,
        ]);
    }

    /**
     * Update the specified booking in storage.
     */
    public function update(Request $request, Booking $booking): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'line_id' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'scooter_type' => 'nullable|string|max:50',
            'booking_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:booking_date',
            'rental_days' => 'nullable|string|max:20',
            'shipping_company' => 'nullable|in:泰富,藍白,聯營,大福',
            'ship_arrival_time' => 'nullable|date',
            'adults' => 'nullable|integer|min:0',
            'children' => 'nullable|integer|min:0',
            'scooters' => 'nullable|array',
            'scooters.*.model' => 'required_with:scooters|string|max:255',
            'scooters.*.count' => 'required_with:scooters|integer|min:1',
            'note' => 'nullable|string|max:1000',
            'status' => 'required|in:預約中,執行中,已經回覆,取消,已轉訂單',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $booking->update($validator->validated());

        return response()->json([
            'message' => 'Booking updated successfully',
            'data' => $booking,
        ]);
    }

    /**
     * Update booking status.
     */
    public function updateStatus(Request $request, Booking $booking): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:預約中,執行中,已經回覆,取消,已轉訂單',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $booking->update(['status' => $request->get('status')]);

        return response()->json([
            'message' => 'Booking status updated successfully',
            'data' => $booking,
        ]);
    }

    /**
     * Remove the specified booking from storage.
     */
    public function destroy(Booking $booking): JsonResponse
    {
        $booking->delete();

        return response()->json([
            'message' => 'Booking deleted successfully',
        ]);
    }

    /**
     * Get count of pending bookings (status = '預約中')
     */
    public function pendingCount(): JsonResponse
    {
        $count = Booking::where('status', '預約中')->count();

        return response()->json([
            'count' => $count,
        ]);
    }

    /**
     * Get list of pending bookings (status = '預約中')
     */
    public function pending(): JsonResponse
    {
        $bookings = Booking::where('status', '預約中')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $bookings,
        ]);
    }

    /**
     * Convert booking to order
     */
    public function convertToOrder(Request $request, Booking $booking): JsonResponse
    {
        if ($booking->status !== '預約中') {
            return response()->json([
                'message' => '只能將「預約中」的預約轉為訂單',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'partner_id' => 'nullable|exists:partners,id',
            'payment_method' => 'required|in:現金,月結,日結,匯款,刷卡,行動支付',
            'payment_amount' => 'required|numeric|min:0',
            'scooter_ids' => 'required|array|min:1',
            'scooter_ids.*' => 'exists:scooters,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            DB::beginTransaction();

            // 計算開始和結束時間
            // 確保日期格式正確（只取日期部分，不包含時間）
            $bookingDate = $booking->booking_date instanceof Carbon 
                ? $booking->booking_date->format('Y-m-d') 
                : $booking->booking_date;
            
            $endDate = $booking->end_date 
                ? ($booking->end_date instanceof Carbon 
                    ? $booking->end_date->format('Y-m-d') 
                    : $booking->end_date)
                : null;

            $startTime = $booking->ship_arrival_time 
                ? $booking->ship_arrival_time 
                : ($bookingDate . ' 08:00:00');
            
            $endTime = $endDate 
                ? ($endDate . ' 18:00:00') 
                : ($bookingDate . ' 18:00:00');

            $scooterIds = $request->get('scooter_ids');

            // 創建訂單（訂單編號會由 Order 模型的 boot 方法自動生成）
            $order = Order::create([
                'partner_id' => $request->get('partner_id') ?: null,
                'tenant' => $booking->name,
                'appointment_date' => $bookingDate,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'expected_return_time' => $endDate ? ($endDate . ' 18:00:00') : null,
                'phone' => $booking->phone,
                'shipping_company' => $booking->shipping_company,
                'ship_arrival_time' => $booking->ship_arrival_time,
                'ship_return_time' => null,
                'payment_method' => $request->get('payment_method'),
                'payment_amount' => $request->get('payment_amount'),
                'status' => '已預訂',
                'remark' => $booking->note,
            ]);

            // 關聯機車
            $order->scooters()->sync($scooterIds);

            // 更新預約狀態為「已轉訂單」
            $booking->update(['status' => '已轉訂單']);

            DB::commit();

            return response()->json([
                'message' => '預約已成功轉為訂單',
                'data' => $order,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Convert booking to order error: ' . $e->getMessage());

            return response()->json([
                'message' => '轉換訂單時發生錯誤',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
