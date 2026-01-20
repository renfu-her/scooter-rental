<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\BookingMail;
use App\Mail\BookingRejectedMail;
use App\Mail\BookingConfirmedMail;
use App\Models\Booking;
use App\Models\Order;
use App\Models\Partner;
use App\Models\PartnerScooterModelTransferFee;
use App\Models\Scooter;
use App\Models\ScooterModel;
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
            'email' => 'required|email|max:255',
            'lineId' => 'nullable|string|max:255', // 改為可選
            'phone' => 'required|string|max:20',
            'storeId' => 'required|exists:stores,id',
            'appointmentDate' => 'required|date',
            'endDate' => 'required|date|after_or_equal:appointmentDate',
            'shippingCompany' => 'nullable|in:泰富,藍白,聯營,大福,公船', // 改為可選，如果沒有提供會使用預設值
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
            
            // 確保 lineId 和 email 存在於郵件資料中（即使為空）
            $mailData = $data;
            $mailData['lineId'] = $data['lineId'] ?? null;
            $mailData['email'] = $data['email'] ?? null;
            
            // 將 scooters 陣列轉換為資料庫格式（model + type 組合）
            $scooters = array_map(function($item) {
                return [
                    'model' => $item['model'] . ' ' . $item['type'],
                    'count' => $item['count'],
                ];
            }, $data['scooters']);
            
            // 獲取預設線上預約合作商（根據 store_id）
            $storeId = $data['storeId'] ?? null;
            $defaultPartner = null;
            if ($storeId) {
                // 查找該商店的預設合作商
                $defaultPartner = Partner::where('store_id', $storeId)
                    ->where('is_default_for_booking', true)
                    ->first();
            }
            // 如果該商店沒有預設合作商，嘗試使用全局預設合作商（沒有 store_id 的）
            if (!$defaultPartner) {
                $defaultPartner = Partner::whereNull('store_id')
                    ->where('is_default_for_booking', true)
                    ->first();
            }

            // 計算租期天數與調車費用總金額（只算調車費用）
            $bookingDateCarbon = Carbon::parse($data['appointmentDate'])->startOfDay();
            $endDateCarbon = Carbon::parse($data['endDate'])->startOfDay();

            // 計算天數差（夜數）
            $diffDays = $bookingDateCarbon->diffInDays($endDateCarbon);
            
            // 判斷租期類型和計算天數：
            // 1 天（同日租）：天數 = 1，使用當日調車費用
            // 2 天（1 夜）：天數 = 1，使用跨日調車費用
            // 3 天（2 夜）：天數 = 2，使用跨日調車費用
            // 以此類推：天數 = diffDays（夜數）
            if ($diffDays == 0) {
                // 同日租：1 天，天數 = 1
                $days = 1;
                $isSameDayRental = true;
            } else {
                // 跨日租：天數 = diffDays（夜數）
                $days = $diffDays;
                $isSameDayRental = false;
            }

            $totalTransferFee = 0;

            // 針對每個車型計算：合作商的機車型號單價 × 天數 × 台數
            foreach ($data['scooters'] as $scooterItem) {
                $model = $scooterItem['model'] ?? null; // 機車型號名稱，如 "ES-1000"
                $type = $scooterItem['type'] ?? null; // 白牌 / 綠牌 / 電輔車 / 三輪車
                $count = $scooterItem['count'] ?? 0;

                if ($count <= 0) {
                    continue;
                }

                // 獲取合作商的機車型號單價（當日租或跨日租）
                $transferFeePerUnit = 0;

                if ($defaultPartner && $model && $type) {
                    // 從 model + type 查找對應的 ScooterModel
                    $scooterModel = ScooterModel::where('name', $model)
                        ->where('type', $type)
                        ->first();

                    if ($scooterModel) {
                        // 從 partner_scooter_model_transfer_fees 表查找調車費用
                        $transferFeeRecord = PartnerScooterModelTransferFee::where('partner_id', $defaultPartner->id)
                            ->where('scooter_model_id', $scooterModel->id)
                            ->first();

                        if ($transferFeeRecord) {
                            if ($isSameDayRental) {
                                $transferFeePerUnit = $transferFeeRecord->same_day_transfer_fee ?? 0;
                            } else {
                                $transferFeePerUnit = $transferFeeRecord->overnight_transfer_fee ?? 0;
                            }
                        }
                    }
                }

                // 計算調車費用：合作商的機車型號單價 × 天數 × 台數
                $totalTransferFee += (int) $transferFeePerUnit * (int) $days * (int) $count;
            }
            
            // 如果沒有提供船運公司，使用預設合作商的預設船運公司
            $shippingCompany = $data['shippingCompany'] ?? null;
            if (!$shippingCompany && $defaultPartner && $defaultPartner->default_shipping_company) {
                $shippingCompany = $defaultPartner->default_shipping_company;
            }
            
            // 確定 store_id：優先使用請求中的 storeId，如果沒有則使用合作商的 store_id
            $storeId = $data['storeId'] ?? null;
            if (!$storeId && $defaultPartner && $defaultPartner->store_id) {
                $storeId = $defaultPartner->store_id;
            }
            
            // 儲存到資料庫
            $booking = Booking::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'line_id' => $data['lineId'] ?? null,
                'phone' => $data['phone'],
                'store_id' => $storeId,
                'booking_date' => $data['appointmentDate'],
                'end_date' => $data['endDate'],
                'shipping_company' => $shippingCompany,
                'ship_arrival_time' => $data['shipArrivalTime'],
                'adults' => $data['adults'] ?? null,
                'children' => $data['children'] ?? null,
                'scooters' => $scooters,
                'note' => $data['note'] ?? null,
                'status' => '預約中', // 預設狀態為「預約中」
                'partner_id' => $defaultPartner ? $defaultPartner->id : null,
                'total_amount' => $totalTransferFee,
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
        $query = Booking::with('store');

        // Filter by store_id
        if ($request->has('store_id')) {
            $query->where('store_id', $request->get('store_id'));
        }

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
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
            'name' => 'sometimes|required|string|max:255',
            'line_id' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'scooter_type' => 'nullable|string|max:50',
            'booking_date' => 'sometimes|required|date',
            'end_date' => 'nullable|date|after_or_equal:booking_date',
            'rental_days' => 'nullable|string|max:20',
            'shipping_company' => 'nullable|in:泰富,藍白,聯營,大福,公船',
            'ship_arrival_time' => 'nullable|date',
            'adults' => 'nullable|integer|min:0',
            'children' => 'nullable|integer|min:0',
            'scooters' => 'nullable|array',
            'scooters.*.model' => 'required_with:scooters|string|max:255',
            'scooters.*.count' => 'required_with:scooters|integer|min:1',
            'note' => 'nullable|string|max:1000',
            'status' => 'sometimes|required|in:預約中,執行中,已經回覆,取消,已轉訂單',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        // 只更新提供的欄位
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

        $status = $request->get('status');

        // 如果是拒絕（狀態改為「取消」），需要檢查 email 並發送郵件
        if ($status === '取消') {
            if (!$booking->email) {
                return response()->json([
                    'message' => '此預約沒有填寫 email，無法拒絕。請先編輯預約資料添加 email。',
                ], 422);
            }

            $booking->update(['status' => $status]);

            // 發送拒絕郵件
            try {
                Mail::to($booking->email)->send(new BookingRejectedMail($booking));
            } catch (\Exception $e) {
                \Log::error('Failed to send rejection email: ' . $e->getMessage());
                // 即使郵件發送失敗，狀態更新仍然成功
            }
        } else {
            $booking->update(['status' => $status]);
        }

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
    public function pendingCount(Request $request): JsonResponse
    {
        $query = Booking::where('status', '預約中');
        
        // Filter by store_id
        if ($request->has('store_id')) {
            $query->where('store_id', $request->get('store_id'));
        }
        
        $count = $query->count();

        return response()->json([
            'count' => $count,
        ]);
    }

    /**
     * Get list of pending bookings (status = '預約中')
     */
    public function pending(Request $request): JsonResponse
    {
        $query = Booking::with('store')
            ->where('status', '預約中');
        
        // Filter by store_id
        if ($request->has('store_id')) {
            $query->where('store_id', $request->get('store_id'));
        }
        
        $bookings = $query->orderBy('created_at', 'desc')->get();

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

        // 檢查 email
        if (!$booking->email) {
            return response()->json([
                'message' => '此預約沒有填寫 email，無法確認轉為訂單。請先編輯預約資料添加 email。',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'partner_id' => 'nullable|exists:partners,id',
            'payment_method' => 'sometimes|required|in:現金,月結,日結,匯款,刷卡,行動支付',
            'payment_amount' => 'nullable|numeric|min:0',
            'scooter_ids' => 'sometimes|required|array|min:1',
            'scooter_ids.*' => 'required_with:scooter_ids|exists:scooters,id',
            'store_id' => 'nullable|exists:stores,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        // 如果沒有提供參數，使用預設值
        $paymentMethod = $request->get('payment_method') ?: '現金';
        // payment_amount 將在計算調車費用後決定（如果沒有提供則使用調車費用）
        $requestedPaymentAmount = $request->has('payment_amount') ? (float) $request->get('payment_amount') : null;
        $scooterIds = $request->get('scooter_ids');
        
        // 獲取合作商（如果提供了 partner_id）
        $partnerId = $request->get('partner_id');
        $partner = $partnerId ? Partner::find($partnerId) : ($booking->partner_id ? Partner::find($booking->partner_id) : null);
        
        // 如果沒有合作商，根據 booking 的 store_id 查找該商店的預設線上預約合作商
        if (!$partner) {
            $storeId = $booking->store_id;
            if ($storeId) {
                // 查找該商店的預設合作商
                $partner = Partner::where('store_id', $storeId)
                    ->where('is_default_for_booking', true)
                    ->first();
            }
            // 如果該商店沒有預設合作商，嘗試使用全局預設合作商（沒有 store_id 的）
            if (!$partner) {
                $partner = Partner::whereNull('store_id')
                    ->where('is_default_for_booking', true)
                    ->first();
            }
        }

        // 計算租期天數與調車費用總金額（只算調車費用）
        $bookingDateCarbon = $booking->booking_date instanceof Carbon 
            ? $booking->booking_date->copy()->startOfDay()
            : Carbon::parse($booking->booking_date)->startOfDay();
        $endDateCarbon = $booking->end_date 
            ? ($booking->end_date instanceof Carbon 
                ? $booking->end_date->copy()->startOfDay()
                : Carbon::parse($booking->end_date)->startOfDay())
            : $bookingDateCarbon->copy();

        // 計算天數差（夜數）
        $diffDays = $bookingDateCarbon->diffInDays($endDateCarbon);
        
        // 判斷租期類型和計算天數：
        // 1 天（同日租）：天數 = 1，使用當日調車費用
        // 2 天（1 夜）：天數 = 1，使用跨日調車費用
        // 3 天（2 夜）：天數 = 2，使用跨日調車費用
        // 以此類推：天數 = diffDays（夜數）
        if ($diffDays == 0) {
            // 同日租：1 天，天數 = 1
            $days = 1;
            $isSameDayRental = true;
        } else {
            // 跨日租：天數 = diffDays（夜數）
            $days = $diffDays;
            $isSameDayRental = false;
        }

        $totalTransferFee = 0;

        // 針對每個車型計算：合作商的機車型號單價 × 天數 × 台數
        if ($booking->scooters && is_array($booking->scooters) && count($booking->scooters) > 0) {
            foreach ($booking->scooters as $scooterItem) {
                $modelString = $scooterItem['model'] ?? null; // 例如 "ES-1000 綠牌"
                $count = $scooterItem['count'] ?? 0;

                if (!$modelString || $count <= 0) {
                    continue;
                }

                // 解析 model 和 type（格式：model + " " + type）
                $parts = explode(' ', $modelString, 2);
                $model = $parts[0] ?? ''; // 例如 "ES-1000"
                $type = $parts[1] ?? '';  // 例如 "綠牌"

                // 獲取合作商的機車型號單價（當日租或跨日租）
                $transferFeePerUnit = 0;

                if ($partner && $model && $type) {
                    // 從 model + type 查找對應的 ScooterModel
                    $scooterModel = ScooterModel::where('name', $model)
                        ->where('type', $type)
                        ->first();

                    if ($scooterModel) {
                        // 從 partner_scooter_model_transfer_fees 表查找調車費用
                        $transferFeeRecord = PartnerScooterModelTransferFee::where('partner_id', $partner->id)
                            ->where('scooter_model_id', $scooterModel->id)
                            ->first();

                        if ($transferFeeRecord) {
                            if ($isSameDayRental) {
                                $transferFeePerUnit = $transferFeeRecord->same_day_transfer_fee ?? 0;
                            } else {
                                $transferFeePerUnit = $transferFeeRecord->overnight_transfer_fee ?? 0;
                            }
                        }
                    }
                }

                // 計算調車費用：合作商的機車型號單價 × 天數 × 台數
                $totalTransferFee += (int) $transferFeePerUnit * (int) $days * (int) $count;
            }
        }

        // 決定最終的 payment_amount：如果提供了則使用，否則使用計算出的調車費用
        $paymentAmount = $requestedPaymentAmount !== null ? $requestedPaymentAmount : $totalTransferFee;

        // 計算開始和結束時間（只使用日期，不需要時間）
        $bookingDate = $booking->booking_date instanceof Carbon 
            ? $booking->booking_date->format('Y-m-d') 
            : $booking->booking_date;
        
        $endDate = $booking->end_date 
            ? ($booking->end_date instanceof Carbon 
                ? $booking->end_date->format('Y-m-d') 
                : $booking->end_date)
            : null;

        // 開始時間和結束時間只使用日期格式（預約日期 = 租借開始）
        $startTime = $bookingDate;
        $endTime = $endDate ? $endDate : $bookingDate;

        // 如果沒有提供機車 ID，自動選擇可用機車
        if (!$scooterIds || count($scooterIds) === 0) {
            $allSelectedScooterIds = [];

            // 根據預約的車型需求，選擇對應的可用機車
            if ($booking->scooters && is_array($booking->scooters) && count($booking->scooters) > 0) {
                foreach ($booking->scooters as $scooterItem) {
                    $modelString = $scooterItem['model']; // 例如 "EB-500 電輔車"
                    $requiredCount = $scooterItem['count'];

                    // 解析 model 和 type（格式：model + " " + type）
                    $parts = explode(' ', $modelString, 2);
                    $model = $parts[0] ?? '';
                    $type = $parts[1] ?? '';

                    // 根據 model 和 type 匹配可用機車
                    $query = Scooter::where('status', '待出租');
                    if ($model) {
                        $query->where('model', $model);
                    }
                    if ($type) {
                        $query->where('type', $type);
                    }

                    $availableScooters = $query->limit($requiredCount)->pluck('id')->toArray();

                    if (count($availableScooters) < $requiredCount) {
                        return response()->json([
                            'message' => "{$modelString} 可用機車數量不足（需要 {$requiredCount} 台，僅有 " . count($availableScooters) . " 台），無法自動轉換訂單。請手動選擇機車。",
                        ], 422);
                    }

                    $selectedScooterIds = array_slice($availableScooters, 0, $requiredCount);
                    $allSelectedScooterIds = array_merge($allSelectedScooterIds, $selectedScooterIds);
                }
            } elseif ($booking->scooter_type) {
                // 舊格式：只有 scooter_type
                $availableScooters = Scooter::where('status', '待出租')
                    ->limit(1)
                    ->pluck('id')
                    ->toArray();

                if (count($availableScooters) < 1) {
                    return response()->json([
                        'message' => '可用機車數量不足，無法自動轉換訂單。請手動選擇機車。',
                    ], 422);
                }

                $allSelectedScooterIds = $availableScooters;
            } else {
                return response()->json([
                    'message' => '無法確定需要的機車數量，請手動選擇機車。',
                ], 422);
            }

            $scooterIds = $allSelectedScooterIds;
        }

        try {
            DB::beginTransaction();

            // 確定 store_id：優先使用請求中的 store_id，其次使用 booking 的 store_id，最後使用 partner 的 store_id
            // 確保預約的 store_id 被正確帶入訂單
            $storeId = $request->get('store_id');
            if (!$storeId) {
                // 如果請求中沒有 store_id，優先使用 booking 的 store_id
                $storeId = $booking->store_id;
            }
            // 如果還是沒有 store_id，嘗試從 partner 獲取（但這不應該發生，因為預約應該有 store_id）
            if (!$storeId && $request->get('partner_id')) {
                $partner = Partner::find($request->get('partner_id'));
                if ($partner && $partner->store_id) {
                    $storeId = $partner->store_id;
                }
            }
            
            // 創建單一訂單，包含所有需要的機車
            $order = Order::create([
                'partner_id' => $request->get('partner_id') ?: null,
                'store_id' => $storeId,
                'tenant' => $booking->name,
                'appointment_date' => $bookingDate,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'expected_return_time' => $endDate ? ($endDate . ' 18:00:00') : null,
                'phone' => $booking->phone,
                'shipping_company' => $booking->shipping_company,
                'ship_arrival_time' => $booking->ship_arrival_time,
                'ship_return_time' => null,
                'payment_method' => $paymentMethod,
                'payment_amount' => $paymentAmount,
                'status' => '已預訂',
                'remark' => $booking->note,
            ]);

            // 關聯所有機車
            $order->scooters()->sync($scooterIds);

            // 更新預約狀態為「已轉訂單」
            $booking->update(['status' => '已轉訂單']);

            DB::commit();

            // 發送確認郵件
            try {
                Mail::to($booking->email)->send(new BookingConfirmedMail($booking));
            } catch (\Exception $e) {
                \Log::error('Failed to send confirmation email: ' . $e->getMessage());
                // 即使郵件發送失敗，訂單轉換仍然成功
            }

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
