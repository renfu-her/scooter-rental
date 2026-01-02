<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RentalPlan;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class RentalPlanController extends Controller
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
        $query = RentalPlan::query();

        // Filter by active status for public API
        if ($request->has('active_only') && $request->get('active_only')) {
            $query->where('is_active', true);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('model', 'like', "%{$search}%");
        }

        $plans = $query->orderBy('sort_order', 'asc')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $plans,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'model' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $plan = RentalPlan::create($validator->validated());

        return response()->json([
            'message' => 'Rental plan created successfully',
            'data' => $plan,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(RentalPlan $rentalPlan): JsonResponse
    {
        return response()->json([
            'data' => $rentalPlan,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, RentalPlan $rentalPlan): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'model' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $rentalPlan->update($validator->validated());

        return response()->json([
            'message' => 'Rental plan updated successfully',
            'data' => $rentalPlan,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(RentalPlan $rentalPlan): JsonResponse
    {
        // Delete image if exists
        if ($rentalPlan->image_path) {
            $this->imageService->deleteImage($rentalPlan->image_path);
        }

        $rentalPlan->delete();

        return response()->json([
            'message' => 'Rental plan deleted successfully',
        ]);
    }

    /**
     * Upload rental plan image
     */
    public function uploadImage(Request $request, RentalPlan $rentalPlan): JsonResponse
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
            'rental-plans',
            $rentalPlan->image_path
        );

        $rentalPlan->update(['image_path' => $imagePath]);

        return response()->json([
            'message' => 'Image uploaded successfully',
            'data' => $rentalPlan->fresh(),
        ]);
    }
}
