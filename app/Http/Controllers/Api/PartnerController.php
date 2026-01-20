<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PartnerResource;
use App\Models\Partner;
use App\Models\PartnerScooterModelTransferFee;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class PartnerController extends Controller
{
    protected ImageService $imageService;

    public function __construct(ImageService $imageService)
    {
        $this->imageService = $imageService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Partner::with('store');

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('tax_id', 'like', "%{$search}%");
            });
        }

        // Filter by store_id
        if ($request->has('store_id')) {
            $query->where('store_id', $request->get('store_id'));
        }

        $partners = $query->with('scooterModelTransferFees.scooterModel')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => PartnerResource::collection($partners),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'tax_id' => 'nullable|string|max:20',
            'manager' => 'nullable|string|max:255',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'is_default_for_booking' => 'nullable|boolean',
            'default_shipping_company' => 'nullable|in:泰富,藍白,聯營,大福,公船',
            'store_id' => 'nullable|exists:stores,id',
            'transfer_fees' => 'nullable|array',
            'transfer_fees.*.scooter_model_id' => 'required_with:transfer_fees|exists:scooter_models,id',
            'transfer_fees.*.same_day_transfer_fee' => 'nullable|integer|min:0',
            'transfer_fees.*.overnight_transfer_fee' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $transferFees = $data['transfer_fees'] ?? [];
        unset($data['transfer_fees']);
        
        // 如果設置為預設，取消同一 store_id 下其他合作商的預設狀態
        if (isset($data['is_default_for_booking']) && $data['is_default_for_booking']) {
            $storeId = $data['store_id'] ?? null;
            if ($storeId) {
                // 只取消同一 store_id 下其他合作商的預設狀態
                Partner::where('store_id', $storeId)
                    ->where('id', '!=', 0)
                    ->update(['is_default_for_booking' => false]);
            } else {
                // 如果沒有 store_id，取消所有沒有 store_id 的合作商的預設狀態
                Partner::whereNull('store_id')
                    ->where('id', '!=', 0)
                    ->update(['is_default_for_booking' => false]);
            }
        }

        DB::beginTransaction();
        try {
            $partner = Partner::create($data);
            
            // 儲存調車費用
            foreach ($transferFees as $fee) {
                PartnerScooterModelTransferFee::updateOrCreate(
                    [
                        'partner_id' => $partner->id,
                        'scooter_model_id' => $fee['scooter_model_id'],
                    ],
                    [
                        'same_day_transfer_fee' => $fee['same_day_transfer_fee'] ?? null,
                        'overnight_transfer_fee' => $fee['overnight_transfer_fee'] ?? null,
                    ]
                );
            }
            
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return response()->json([
            'message' => 'Partner created successfully',
            'data' => new PartnerResource($partner),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Partner $partner): JsonResponse
    {
        $partner->load('scooterModelTransferFees.scooterModel');
        return response()->json([
            'data' => new PartnerResource($partner),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Partner $partner): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'tax_id' => 'nullable|string|max:20',
            'manager' => 'nullable|string|max:255',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'is_default_for_booking' => 'nullable|boolean',
            'default_shipping_company' => 'nullable|in:泰富,藍白,聯營,大福,公船',
            'store_id' => 'nullable|exists:stores,id',
            'transfer_fees' => 'nullable|array',
            'transfer_fees.*.scooter_model_id' => 'required_with:transfer_fees|exists:scooter_models,id',
            'transfer_fees.*.same_day_transfer_fee' => 'nullable|integer|min:0',
            'transfer_fees.*.overnight_transfer_fee' => 'nullable|integer|min:0',
            'photo_path' => 'nullable',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $transferFees = $data['transfer_fees'] ?? null;
        unset($data['transfer_fees']);
        
        // 如果設置為預設，取消同一 store_id 下其他合作商的預設狀態
        if (isset($data['is_default_for_booking']) && $data['is_default_for_booking']) {
            $storeId = $data['store_id'] ?? $partner->store_id;
            if ($storeId) {
                // 只取消同一 store_id 下其他合作商的預設狀態
                Partner::where('store_id', $storeId)
                    ->where('id', '!=', $partner->id)
                    ->update(['is_default_for_booking' => false]);
            } else {
                // 如果沒有 store_id，取消所有沒有 store_id 的合作商的預設狀態
                Partner::whereNull('store_id')
                    ->where('id', '!=', $partner->id)
                    ->update(['is_default_for_booking' => false]);
            }
        }

        DB::beginTransaction();
        try {
            // Handle photo deletion (if photo_path is explicitly set to null)
            if (isset($data['photo_path']) && $data['photo_path'] === null && $partner->photo_path) {
                $this->imageService->deleteImage($partner->photo_path);
            }
            
            $partner->update($data);
            
            // 如果有提供 transfer_fees，更新調車費用
            if ($transferFees !== null) {
                // 刪除現有的調車費用
                PartnerScooterModelTransferFee::where('partner_id', $partner->id)->delete();
                
                // 儲存新的調車費用
                foreach ($transferFees as $fee) {
                    PartnerScooterModelTransferFee::create([
                        'partner_id' => $partner->id,
                        'scooter_model_id' => $fee['scooter_model_id'],
                        'same_day_transfer_fee' => $fee['same_day_transfer_fee'] ?? null,
                        'overnight_transfer_fee' => $fee['overnight_transfer_fee'] ?? null,
                    ]);
                }
            }
            
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return response()->json([
            'message' => 'Partner updated successfully',
            'data' => new PartnerResource($partner),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Partner $partner): JsonResponse
    {
        // Delete photo if exists
        if ($partner->photo_path) {
            $this->imageService->deleteImage($partner->photo_path);
        }

        $partner->delete();

        return response()->json([
            'message' => 'Partner deleted successfully',
        ]);
    }

    /**
     * Upload partner photo
     */
    public function uploadPhoto(Request $request, Partner $partner): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $photoPath = $this->imageService->uploadImage(
            $request->file('photo'),
            'partners',
            $partner->photo_path
        );

        $partner->update(['photo_path' => $photoPath]);

        return response()->json([
            'message' => 'Photo uploaded successfully',
            'data' => new PartnerResource($partner),
        ]);
    }
}

