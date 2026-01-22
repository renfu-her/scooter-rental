<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Login user and create token.
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
            'captcha_id' => 'required|string',
            'captcha_answer' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        // 驗證驗證碼
        $captchaId = $request->get('captcha_id');
        $userAnswer = strtoupper(trim($request->get('captcha_answer'))); // 強制大寫並去除空格
        $correctAnswer = \Illuminate\Support\Facades\Cache::get("captcha_{$captchaId}");

        if ($correctAnswer === null) {
            return response()->json([
                'message' => '驗證碼已過期，請重新獲取',
            ], 400);
        }

        if ($userAnswer !== $correctAnswer) {
            return response()->json([
                'message' => '驗證碼錯誤',
            ], 400);
        }

        // 驗證成功後刪除驗證碼
        \Illuminate\Support\Facades\Cache::forget("captcha_{$captchaId}");

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email 或密碼錯誤',
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => '帳號已被停用',
            ], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        // 載入 store 關聯
        $user->load('store');

        return response()->json([
            'message' => '登入成功',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
        ]);
    }

    /**
     * Get authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        // 載入 store 關聯
        $user->load('store');
        
        return response()->json([
            'data' => new UserResource($user),
        ]);
    }

    /**
     * Logout user (Revoke the token).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => '登出成功',
        ]);
    }
}
