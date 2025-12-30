<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ScooterResource;
use App\Models\Scooter;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ScooterController extends Controller
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
        $query = Scooter::query();

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('plate_number', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%");
            });
        }

        $scooters = $query->with('store')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => ScooterResource::collection($scooters),
        ]);
    }

    /**
     * Get available scooters (status = 待出租)
     */
    public function available(): JsonResponse
    {
        $scooters = Scooter::where('status', '待出租')
            ->with('store')
            ->orderBy('plate_number')
            ->get();

        return response()->json([
            'data' => ScooterResource::collection($scooters),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|exists:stores,id',
            'plate_number' => 'required|string|max:20|unique:scooters,plate_number',
            'model' => 'required|string|max:255',
            'type' => 'required|in:白牌,綠牌,電輔車,三輪車',
            'color' => 'nullable|string|max:50',
            'status' => 'required|in:待出租,出租中,保養中',
        ], [
            'store_id.required' => '請選擇所屬商店',
            'store_id.exists' => '所選擇的商店不存在',
            'plate_number.required' => '請輸入車牌號碼',
            'plate_number.unique' => '此車牌號碼已被使用',
            'model.required' => '請輸入機車型號',
            'type.required' => '請選擇車款類型',
            'type.in' => '車款類型必須為：白牌、綠牌、電輔車或三輪車',
            'status.required' => '請選擇狀態',
            'status.in' => '狀態必須為：待出租、出租中或保養中',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => '驗證錯誤',
                'errors' => $validator->errors(),
            ], 422);
        }

        $scooter = Scooter::create($validator->validated());

        return response()->json([
            'message' => 'Scooter created successfully',
            'data' => new ScooterResource($scooter->load('store')),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Scooter $scooter): JsonResponse
    {
        return response()->json([
            'data' => new ScooterResource($scooter->load('store')),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Scooter $scooter): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|exists:stores,id',
            'plate_number' => 'required|string|max:20|unique:scooters,plate_number,' . $scooter->id,
            'model' => 'required|string|max:255',
            'type' => 'required|in:白牌,綠牌,電輔車,三輪車',
            'color' => 'nullable|string|max:50',
            'status' => 'required|in:待出租,出租中,保養中',
        ], [
            'store_id.required' => '請選擇所屬商店',
            'store_id.exists' => '所選擇的商店不存在',
            'plate_number.required' => '請輸入車牌號碼',
            'plate_number.unique' => '此車牌號碼已被使用',
            'model.required' => '請輸入機車型號',
            'type.required' => '請選擇車款類型',
            'type.in' => '車款類型必須為：白牌、綠牌、電輔車或三輪車',
            'status.required' => '請選擇狀態',
            'status.in' => '狀態必須為：待出租、出租中或保養中',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => '驗證錯誤',
                'errors' => $validator->errors(),
            ], 422);
        }

        $scooter->update($validator->validated());

        return response()->json([
            'message' => 'Scooter updated successfully',
            'data' => new ScooterResource($scooter->load('store')),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Scooter $scooter): JsonResponse
    {
        // Delete photo if exists
        if ($scooter->photo_path) {
            $this->imageService->deleteImage($scooter->photo_path);
        }

        $scooter->delete();

        return response()->json([
            'message' => 'Scooter deleted successfully',
        ]);
    }

    /**
     * Upload scooter photo
     */
    public function uploadPhoto(Request $request, Scooter $scooter): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $photoPath = $this->imageService->uploadImage(
            $request->file('photo'),
            'scooters',
            $scooter->photo_path
        );

        $scooter->update(['photo_path' => $photoPath]);

        return response()->json([
            'message' => 'Photo uploaded successfully',
            'data' => new ScooterResource($scooter->load('store')),
        ]);
    }
}

