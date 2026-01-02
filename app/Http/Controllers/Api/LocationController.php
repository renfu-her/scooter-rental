<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class LocationController extends Controller
{
    protected ImageService $imageService;

    public function __construct(ImageService $imageService)
    {
        $this->imageService = $imageService;
    }

    /**
     * Display the location resource (single resource).
     */
    public function show(): JsonResponse
    {
        $location = Location::first();

        if (!$location) {
            return response()->json([
                'data' => null,
            ]);
        }

        return response()->json([
            'data' => $location,
        ]);
    }

    /**
     * Update the location resource.
     */
    public function update(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'hours' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'map_url' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $location = Location::first();

        if (!$location) {
            $location = Location::create($validator->validated());
            return response()->json([
                'message' => 'Location created successfully',
                'data' => $location,
            ], 201);
        }

        $location->update($validator->validated());

        return response()->json([
            'message' => 'Location updated successfully',
            'data' => $location,
        ]);
    }

    /**
     * Upload location image
     */
    public function uploadImage(Request $request): JsonResponse
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

        $location = Location::first();

        if (!$location) {
            $location = Location::create([]);
        }

        $imagePath = $this->imageService->uploadImage(
            $request->file('image'),
            'location',
            $location->image_path
        );

        $location->update(['image_path' => $imagePath]);

        return response()->json([
            'message' => 'Image uploaded successfully',
            'data' => $location->fresh(),
        ]);
    }
}
