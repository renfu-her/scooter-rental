<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StoreResource;
use App\Models\Store;
use App\Models\Partner;
use App\Models\StoreEnvironmentImage;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class StoreController extends Controller
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
        $query = Store::query();

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $stores = $query->with('environmentImages')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => StoreResource::collection($stores),
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
            'manager' => 'required|string|max:255',
            'notice' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $store = Store::create($validator->validated());
            
            // 檢查是否已有預設線上預約合作商
            $hasDefaultPartner = Partner::where('is_default_for_booking', true)->exists();
            
            // 自動創建一個名為「蘭光智能」的合作商，關聯到新創建的商店
            // 如果系統中沒有其他預設合作商，則將此合作商設為預設（用於線上預約）
            $partner = Partner::create([
                'name' => '蘭光智能',
                'address' => $store->address,
                'phone' => $store->phone,
                'manager' => $store->manager,
                'store_id' => $store->id,
                'is_default_for_booking' => !$hasDefaultPartner, // 如果沒有其他預設合作商，則設為預設
            ]);
            
            DB::commit();
            
            return response()->json([
                'message' => 'Store created successfully',
                'data' => new StoreResource($store),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create store',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Store $store): JsonResponse
    {
        $store->load('environmentImages');
        return response()->json([
            'data' => new StoreResource($store),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Store $store): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'manager' => 'required|string|max:255',
            'photo_path' => 'nullable',
            'notice' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        
        // Handle photo deletion (if photo_path is explicitly set to null)
        if (isset($data['photo_path']) && $data['photo_path'] === null && $store->photo_path) {
            $this->imageService->deleteImage($store->photo_path);
        }
        
        $store->update($data);

        return response()->json([
            'message' => 'Store updated successfully',
            'data' => new StoreResource($store),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Store $store): JsonResponse
    {
        // Delete photo if exists
        if ($store->photo_path) {
            Storage::disk('public')->delete($store->photo_path);
        }

        // Delete environment images
        foreach ($store->environmentImages as $environmentImage) {
            if ($environmentImage->image_path) {
                $this->imageService->deleteImage($environmentImage->image_path);
            }
            $environmentImage->delete();
        }

        $store->delete();

        return response()->json([
            'message' => 'Store deleted successfully',
        ]);
    }

    /**
     * Upload photo for the store.
     */
    public function uploadPhoto(Request $request, Store $store): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'photo' => 'required|image|max:5120', // 5MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Process and save new photo (ImageService will handle old photo deletion)
        $photoPath = $this->imageService->uploadImage(
            $request->file('photo'),
            'stores',
            $store->photo_path
        );

        $store->update(['photo_path' => $photoPath]);

        return response()->json([
            'message' => 'Photo uploaded successfully',
            'data' => new StoreResource($store->load('environmentImages')),
        ]);
    }

    /**
     * Upload environment image for the store.
     */
    public function uploadEnvironmentImage(Request $request, Store $store): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:10240', // 10MB max
            'sort_order' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $imagePath = $this->imageService->uploadImage(
            $request->file('image'),
            'store-environment'
        );

        $environmentImage = StoreEnvironmentImage::create([
            'store_id' => $store->id,
            'image_path' => $imagePath,
            'sort_order' => $request->input('sort_order', 0),
        ]);

        return response()->json([
            'message' => 'Environment image uploaded successfully',
            'data' => [
                'id' => $environmentImage->id,
                'image_path' => asset('storage/' . $environmentImage->image_path),
                'sort_order' => $environmentImage->sort_order,
            ],
        ], 201);
    }

    /**
     * Delete environment image for the store.
     */
    public function deleteEnvironmentImage(Store $store, StoreEnvironmentImage $environmentImage): JsonResponse
    {
        // Verify the environment image belongs to the store
        if ($environmentImage->store_id !== $store->id) {
            return response()->json([
                'message' => 'Environment image does not belong to this store',
            ], 403);
        }

        // Delete image file
        if ($environmentImage->image_path) {
            $this->imageService->deleteImage($environmentImage->image_path);
        }

        $environmentImage->delete();

        return response()->json([
            'message' => 'Environment image deleted successfully',
        ]);
    }

    /**
     * Update environment image sort order.
     */
    public function updateEnvironmentImageOrder(Request $request, Store $store, StoreEnvironmentImage $environmentImage): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'sort_order' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Verify the environment image belongs to the store
        if ($environmentImage->store_id !== $store->id) {
            return response()->json([
                'message' => 'Environment image does not belong to this store',
            ], 403);
        }

        $environmentImage->update(['sort_order' => $request->input('sort_order')]);

        return response()->json([
            'message' => 'Environment image order updated successfully',
            'data' => [
                'id' => $environmentImage->id,
                'image_path' => asset('storage/' . $environmentImage->image_path),
                'sort_order' => $environmentImage->sort_order,
            ],
        ]);
    }
}

