<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UploadController extends Controller
{
    protected ImageService $imageService;

    public function __construct(ImageService $imageService)
    {
        $this->imageService = $imageService;
    }

    /**
     * Upload image for CKEditor
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'upload' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => [
                    'message' => $validator->errors()->first('upload'),
                ],
            ], 422);
        }

        try {
            $imagePath = $this->imageService->uploadImage(
                $request->file('upload'),
                'editor',
                null
            );

            // Get the public URL
            $url = asset('storage/' . $imagePath);

            // CKEditor expects this format
            return response()->json([
                'url' => $url,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => [
                    'message' => '圖片上傳失敗：' . $e->getMessage(),
                ],
            ], 500);
        }
    }
}
