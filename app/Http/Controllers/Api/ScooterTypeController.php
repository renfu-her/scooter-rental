<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ScooterTypeResource;
use App\Models\ScooterType;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ScooterTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ScooterType::query();

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('name', 'like', "%{$search}%");
        }

        $scooterTypes = $query->orderBy('name')->get();

        return response()->json([
            'data' => ScooterTypeResource::collection($scooterTypes),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:scooter_types,name',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ], [
            'name.required' => '請輸入機車類型名稱',
            'name.unique' => '此機車類型名稱已被使用',
            'color.regex' => '顏色格式不正確，請使用 hex 格式（例如：#FF5733）',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => '驗證錯誤',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $scooterType = ScooterType::create($validator->validated());

            return response()->json([
                'message' => '機車類型已成功新增',
                'data' => new ScooterTypeResource($scooterType),
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Scooter type creation error: ' . $e->getMessage());
            
            return response()->json([
                'message' => '新增機車類型時發生錯誤',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(ScooterType $scooterType): JsonResponse
    {
        return response()->json([
            'data' => new ScooterTypeResource($scooterType),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ScooterType $scooterType): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255|unique:scooter_types,name,' . $scooterType->id,
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ], [
            'name.required' => '請輸入機車類型名稱',
            'name.unique' => '此機車類型名稱已被使用',
            'color.regex' => '顏色格式不正確，請使用 hex 格式（例如：#FF5733）',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => '驗證錯誤',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $scooterType->update($validator->validated());

            return response()->json([
                'message' => '機車類型已成功更新',
                'data' => new ScooterTypeResource($scooterType),
            ]);
        } catch (\Exception $e) {
            \Log::error('Scooter type update error: ' . $e->getMessage());
            
            return response()->json([
                'message' => '更新機車類型時發生錯誤',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ScooterType $scooterType): JsonResponse
    {
        // Check if any scooter models are using this type
        $modelsCount = $scooterType->scooterModels()->count();
        
        if ($modelsCount > 0) {
            return response()->json([
                'message' => "無法刪除此機車類型，因為有 {$modelsCount} 個機車型號正在使用此類型",
            ], 422);
        }

        try {
            $scooterType->delete();

            return response()->json([
                'message' => '機車類型已成功刪除',
            ]);
        } catch (\Exception $e) {
            \Log::error('Scooter type deletion error: ' . $e->getMessage());
            
            return response()->json([
                'message' => '刪除機車類型時發生錯誤',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
