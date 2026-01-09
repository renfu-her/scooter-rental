<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EnvironmentImage;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class EnvironmentImageController extends Controller
{
    protected ImageService $imageService;

    public function __construct(ImageService $imageService)
    {
        $this->imageService = $imageService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $images = EnvironmentImage::orderBy('sort_order', 'asc')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $images,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:10240',
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
            'environment'
        );

        $image = EnvironmentImage::create([
            'image_path' => $imagePath,
            'sort_order' => $request->input('sort_order', 0),
        ]);

        return response()->json([
            'message' => 'Environment image created successfully',
            'data' => $image,
        ], 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, EnvironmentImage $environmentImage): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'sort_order' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $environmentImage->update($validator->validated());

        return response()->json([
            'message' => 'Environment image updated successfully',
            'data' => $environmentImage,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(EnvironmentImage $environmentImage): JsonResponse
    {
        // Delete image file
        if ($environmentImage->image_path) {
            $this->imageService->deleteImage($environmentImage->image_path);
        }

        $environmentImage->delete();

        return response()->json([
            'message' => 'Environment image deleted successfully',
        ]);
    }
}
