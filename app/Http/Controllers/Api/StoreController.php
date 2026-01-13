<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StoreResource;
use App\Models\Store;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

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

        $stores = $query->orderBy('created_at', 'desc')->get();

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
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $store = Store::create($validator->validated());

        return response()->json([
            'message' => 'Store created successfully',
            'data' => new StoreResource($store),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Store $store): JsonResponse
    {
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
            'data' => new StoreResource($store),
        ]);
    }
}

