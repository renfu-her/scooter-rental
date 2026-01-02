<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guideline;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class GuidelineController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Guideline::query();

        // Filter by active status for public API
        if ($request->has('active_only') && $request->get('active_only')) {
            $query->where('is_active', true);
        }

        // Filter by category
        if ($request->has('category')) {
            $query->where('category', $request->get('category'));
        }

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('question', 'like', "%{$search}%")
                    ->orWhere('answer', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        $guidelines = $query->orderBy('sort_order', 'asc')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $guidelines,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'category' => 'required|string|max:255',
            'question' => 'required|string',
            'answer' => 'required|string',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $guideline = Guideline::create($validator->validated());

        return response()->json([
            'message' => 'Guideline created successfully',
            'data' => $guideline,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Guideline $guideline): JsonResponse
    {
        return response()->json([
            'data' => $guideline,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Guideline $guideline): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'category' => 'required|string|max:255',
            'question' => 'required|string',
            'answer' => 'required|string',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $guideline->update($validator->validated());

        return response()->json([
            'message' => 'Guideline updated successfully',
            'data' => $guideline,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Guideline $guideline): JsonResponse
    {
        $guideline->delete();

        return response()->json([
            'message' => 'Guideline deleted successfully',
        ]);
    }
}
