<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class BannerController extends Controller
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
        $query = Banner::query();

        // Filter by active status for public API
        if ($request->has('active_only') && $request->get('active_only')) {
            $query->where('is_active', true);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('subtitle', 'like', "%{$search}%");
            });
        }

        $banners = $query->orderBy('sort_order', 'asc')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $banners,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'link' => 'nullable|string|max:255',
            'button_text' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $banner = Banner::create($validator->validated());

        return response()->json([
            'message' => 'Banner created successfully',
            'data' => $banner,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Banner $banner): JsonResponse
    {
        return response()->json([
            'data' => $banner,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Banner $banner): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'link' => 'nullable|string|max:255',
            'button_text' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $banner->update($validator->validated());

        return response()->json([
            'message' => 'Banner updated successfully',
            'data' => $banner,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Banner $banner): JsonResponse
    {
        // Delete image if exists
        if ($banner->image_path) {
            $this->imageService->deleteImage($banner->image_path);
        }

        $banner->delete();

        return response()->json([
            'message' => 'Banner deleted successfully',
        ]);
    }

    /**
     * Upload banner image
     */
    public function uploadImage(Request $request, Banner $banner): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $imagePath = $this->imageService->uploadImage(
            $request->file('image'),
            'banners',
            $banner->image_path
        );

        $banner->update(['image_path' => $imagePath]);

        return response()->json([
            'message' => 'Image uploaded successfully',
            'data' => $banner->fresh(),
        ]);
    }
}
