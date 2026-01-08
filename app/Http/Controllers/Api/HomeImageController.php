<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HomeImage;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class HomeImageController extends Controller
{
    protected ImageService $imageService;

    public function __construct(ImageService $imageService)
    {
        $this->imageService = $imageService;
    }

    /**
     * Display a listing of all home images (public API)
     */
    public function index(): JsonResponse
    {
        $images = HomeImage::all()->keyBy('key');

        return response()->json([
            'data' => $images,
        ]);
    }

    /**
     * Get home image by key
     */
    public function show(string $key): JsonResponse
    {
        $homeImage = HomeImage::where('key', $key)->first();

        if (!$homeImage) {
            return response()->json([
                'message' => 'Home image not found',
            ], 404);
        }

        return response()->json([
            'data' => $homeImage,
        ]);
    }

    /**
     * Update home image information
     */
    public function update(Request $request, string $key): JsonResponse
    {
        $homeImage = HomeImage::where('key', $key)->first();

        if (!$homeImage) {
            return response()->json([
                'message' => 'Home image not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'alt_text' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $homeImage->update($validator->validated());

        return response()->json([
            'message' => 'Home image updated successfully',
            'data' => $homeImage,
        ]);
    }

    /**
     * Upload home image
     */
    public function uploadImage(Request $request, string $key): JsonResponse
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

        $homeImage = HomeImage::where('key', $key)->first();

        if (!$homeImage) {
            return response()->json([
                'message' => 'Home image not found',
            ], 404);
        }

        $imagePath = $this->imageService->uploadImage(
            $request->file('image'),
            'home',
            $homeImage->image_path
        );

        $homeImage->update(['image_path' => $imagePath]);

        return response()->json([
            'message' => 'Image uploaded successfully',
            'data' => $homeImage->fresh(),
        ]);
    }
}
