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
                    ->orWhere('description', 'like', "%{$search}%");
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
            'guesthouses',
            $guesthouse->image_path
        );

        $guesthouse->update(['image_path' => $imagePath]);

        return response()->json([
            'message' => 'Image uploaded successfully',
            'data' => $guesthouse->fresh(),
        ]);
    }
}
