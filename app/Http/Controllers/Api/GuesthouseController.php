<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guesthouse;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class GuesthouseController extends Controller
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
        $query = Guesthouse::query();

        // Filter by active status for public API
        if ($request->has('active_only') && $request->get('active_only')) {
            $query->where('is_active', true);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('short_description', 'like', "%{$search}%");
            });
        }

        $guesthouses = $query->orderBy('sort_order', 'asc')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $guesthouses,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:255',
            'link' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $guesthouse = Guesthouse::create($validator->validated());

        return response()->json([
            'message' => 'Guesthouse created successfully',
            'data' => $guesthouse,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Guesthouse $guesthouse): JsonResponse
    {
        // For public access, only return active guesthouses
        if (!$guesthouse->is_active) {
            return response()->json([
                'message' => 'Guesthouse not found',
            ], 404);
        }

        return response()->json([
            'data' => $guesthouse,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Guesthouse $guesthouse): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:255',
            'link' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $guesthouse->update($validator->validated());

        return response()->json([
            'message' => 'Guesthouse updated successfully',
            'data' => $guesthouse,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Guesthouse $guesthouse): JsonResponse
    {
        // Delete image if exists
        if ($guesthouse->image_path) {
            $this->imageService->deleteImage($guesthouse->image_path);
        }

        $guesthouse->delete();

        return response()->json([
            'message' => 'Guesthouse deleted successfully',
        ]);
    }

    /**
     * Upload guesthouse image
     */
    public function uploadImage(Request $request, Guesthouse $guesthouse): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $imagePath = $this->imageService->uploadImage(
            $request->file('image'),
            'guesthouses',
            $guesthouse->image_path
        );

        $guesthouse->update(['image_path' => $imagePath]);

        return response()->json([
            'message' => 'Image uploaded successfully',
            'data' => $guesthouse->fresh(),
        ]);
    }

    /**
     * Upload multiple guesthouse images
     */
    public function uploadImages(Request $request, Guesthouse $guesthouse): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'images' => 'required|array|min:1|max:10',
            'images.*' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $uploadedImages = [];
        foreach ($request->file('images') as $image) {
            $imagePath = $this->imageService->uploadImage(
                $image,
                'guesthouses',
                null
            );
            $uploadedImages[] = $imagePath;
        }

        // Merge with existing images
        $existingImages = $guesthouse->images ?? [];
        $allImages = array_merge($existingImages, $uploadedImages);

        $guesthouse->update(['images' => $allImages]);

        return response()->json([
            'message' => 'Images uploaded successfully',
            'data' => $guesthouse->fresh(),
        ]);
    }

    /**
     * Delete a guesthouse image from images array
     */
    public function deleteImage(Request $request, Guesthouse $guesthouse): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'image_path' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $imagePath = $request->get('image_path');
        $images = $guesthouse->images ?? [];

        // Remove the image from array
        $images = array_values(array_filter($images, function($img) use ($imagePath) {
            return $img !== $imagePath;
        }));

        // Delete the physical file
        $this->imageService->deleteImage($imagePath);

        $guesthouse->update(['images' => $images]);

        return response()->json([
            'message' => 'Image deleted successfully',
            'data' => $guesthouse->fresh(),
        ]);
    }
}
