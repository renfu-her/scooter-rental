<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ScooterModelResource;
use App\Models\ScooterModel;
use App\Models\ScooterType;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ScooterModelController extends Controller
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
        $query = ScooterModel::query();

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->get('type'));
        }

        $scooterModels = $query->with('scooterType')->orderBy('name')->orderBy('scooter_type_id')->get();

        return response()->json([
            'data' => ScooterModelResource::collection($scooterModels),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:scooter_models,name',
            'scooter_type_id' => 'required|exists:scooter_types,id',
            'image' => 'nullable|image|mimes:jpeg,jpg,png,gif,webp|max:5120',
            'sort_order' => 'nullable|integer|min:0',
        ], [
            'name.required' => '請輸入機車型號名稱',
            'name.unique' => '此機車型號名稱已被使用',
            'scooter_type_id.required' => '請選擇車型類型',
            'scooter_type_id.exists' => '所選擇的車型類型不存在',
            'image.image' => '上傳的檔案必須是圖片',
            'image.max' => '圖片大小不能超過 5MB',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => '驗證錯誤',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = $validator->validated();
            $imagePath = null;

            // Handle image upload
            if ($request->hasFile('image')) {
                $imagePath = $this->imageService->uploadImage(
                    $request->file('image'),
                    'scooter-models'
                );
            }

            $scooterModel = ScooterModel::create([
                'name' => $data['name'],
                'scooter_type_id' => $data['scooter_type_id'],
                'image_path' => $imagePath,
            ]);

            return response()->json([
                'message' => '機車型號已成功新增',
                'data' => new ScooterModelResource($scooterModel),
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Scooter model creation error: ' . $e->getMessage());
            
            return response()->json([
                'message' => '新增機車型號時發生錯誤',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(ScooterModel $scooterModel): JsonResponse
    {
        $scooterModel->load('scooterType');
        return response()->json([
            'data' => new ScooterModelResource($scooterModel),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ScooterModel $scooterModel): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255|unique:scooter_models,name,' . $scooterModel->id,
            'scooter_type_id' => 'sometimes|required|exists:scooter_types,id',
            'image' => 'nullable|image|mimes:jpeg,jpg,png,gif,webp|max:5120',
            'image_path' => 'nullable',
            'sort_order' => 'nullable|integer|min:0',
        ], [
            'name.required' => '請輸入機車型號名稱',
            'name.unique' => '此機車型號名稱已被使用',
            'scooter_type_id.required' => '請選擇車型類型',
            'scooter_type_id.exists' => '所選擇的車型類型不存在',
            'image.image' => '上傳的檔案必須是圖片',
            'image.max' => '圖片大小不能超過 5MB',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => '驗證錯誤',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = $validator->validated();
            $oldImagePath = $scooterModel->image_path;

            // Handle image deletion (if image_path is explicitly set to null)
            if (isset($data['image_path']) && $data['image_path'] === null && $oldImagePath) {
                $this->imageService->deleteImage($oldImagePath);
                $data['image_path'] = null;
            }

            // Handle image upload
            if ($request->hasFile('image')) {
                $data['image_path'] = $this->imageService->uploadImage(
                    $request->file('image'),
                    'scooter-models',
                    $oldImagePath
                );
            }

            // Remove image key from data if it exists (we only need image_path)
            unset($data['image']);

            $scooterModel->update($data);

            return response()->json([
                'message' => '機車型號已成功更新',
                'data' => new ScooterModelResource($scooterModel),
            ]);
        } catch (\Exception $e) {
            \Log::error('Scooter model update error: ' . $e->getMessage());
            
            return response()->json([
                'message' => '更新機車型號時發生錯誤',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ScooterModel $scooterModel): JsonResponse
    {
        // Check if any scooters are using this model
        $scootersCount = $scooterModel->scooters()->count();
        
        if ($scootersCount > 0) {
            return response()->json([
                'message' => "無法刪除此機車型號，因為有 {$scootersCount} 台機車正在使用此型號",
            ], 422);
        }

        try {
            // Delete image if exists
            if ($scooterModel->image_path) {
                \Storage::disk('public')->delete($scooterModel->image_path);
            }

            $scooterModel->delete();

            return response()->json([
                'message' => '機車型號已成功刪除',
            ]);
        } catch (\Exception $e) {
            \Log::error('Scooter model deletion error: ' . $e->getMessage());
            
            return response()->json([
                'message' => '刪除機車型號時發生錯誤',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Upload image for scooter model
     */
    public function uploadImage(Request $request, ScooterModel $scooterModel): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,jpg,png,gif,webp|max:5120',
        ], [
            'image.required' => '請選擇要上傳的圖片',
            'image.image' => '上傳的檔案必須是圖片',
            'image.max' => '圖片大小不能超過 5MB',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => '驗證錯誤',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $oldImagePath = $scooterModel->image_path;
            $imagePath = $this->imageService->uploadImage(
                $request->file('image'),
                'scooter-models',
                $oldImagePath
            );

            $scooterModel->update(['image_path' => $imagePath]);

            return response()->json([
                'message' => '圖片已成功上傳',
                'data' => new ScooterModelResource($scooterModel),
            ]);
        } catch (\Exception $e) {
            \Log::error('Scooter model image upload error: ' . $e->getMessage());
            
            return response()->json([
                'message' => '上傳圖片時發生錯誤',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
