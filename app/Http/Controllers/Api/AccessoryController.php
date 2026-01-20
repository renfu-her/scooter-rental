<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AccessoryResource;
use App\Models\Accessory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class AccessoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Accessory::with('store');

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('name', 'like', "%{$search}%");
        }

        // Filter by category
        if ($request->has('category')) {
            $query->where('category', $request->get('category'));
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        // Filter by store_id
        if ($request->has('store_id')) {
            $query->where('store_id', $request->get('store_id'));
        }

        $accessories = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => AccessoryResource::collection($accessories),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'category' => 'required|in:防護,配件,雨具,其他',
            'stock' => 'required|integer|min:0',
            'rent_price' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        
        // Determine status based on stock
        if ($data['stock'] === 0) {
            $data['status'] = '缺貨';
        } elseif ($data['stock'] < 10) {
            $data['status'] = '低庫存';
        } else {
            $data['status'] = '充足';
        }

        $accessory = Accessory::create($data);

        return response()->json([
            'message' => 'Accessory created successfully',
            'data' => new AccessoryResource($accessory),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Accessory $accessory): JsonResponse
    {
        return response()->json([
            'data' => new AccessoryResource($accessory),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Accessory $accessory): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'category' => 'required|in:防護,配件,雨具,其他',
            'stock' => 'required|integer|min:0',
            'rent_price' => 'required|numeric|min:0',
            'store_id' => 'nullable|exists:stores,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        
        // Determine status based on stock
        if ($data['stock'] === 0) {
            $data['status'] = '缺貨';
        } elseif ($data['stock'] < 10) {
            $data['status'] = '低庫存';
        } else {
            $data['status'] = '充足';
        }

        $accessory->update($data);

        return response()->json([
            'message' => 'Accessory updated successfully',
            'data' => new AccessoryResource($accessory),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Accessory $accessory): JsonResponse
    {
        $accessory->delete();

        return response()->json([
            'message' => 'Accessory deleted successfully',
        ]);
    }

    /**
     * Get statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        $query = Accessory::query();

        // Filter by store_id if provided
        if ($request->has('store_id')) {
            $query->where('store_id', $request->get('store_id'));
        }

        $total = $query->count();
        $categories = (clone $query)->selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->pluck('count', 'category')
            ->toArray();
        $totalStock = (clone $query)->sum('stock');
        $outOfStock = (clone $query)->where('status', '缺貨')->count();
        $lowStock = (clone $query)->where('status', '低庫存')->count();

        return response()->json([
            'data' => [
                'total_categories' => count($categories),
                'total_items' => $total,
                'total_stock' => $totalStock,
                'out_of_stock' => $outOfStock,
                'low_stock' => $lowStock,
                'categories' => $categories,
            ],
        ]);
    }
}

