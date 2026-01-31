<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PartnerController;
use App\Http\Controllers\Api\ScooterController;
use App\Http\Controllers\Api\ScooterModelController;
use App\Http\Controllers\Api\ScooterTypeController;
use App\Http\Controllers\Api\ScooterModelColorController;
use App\Http\Controllers\Api\FineController;
use App\Http\Controllers\Api\AccessoryController;
use App\Http\Controllers\Api\StoreController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CaptchaController;
use App\Http\Controllers\Api\BannerController;
use App\Http\Controllers\Api\RentalPlanController;
use App\Http\Controllers\Api\GuidelineController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\GuesthouseController;
use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\HomeImageController;
use App\Http\Controllers\Api\EnvironmentImageController;
use App\Http\Controllers\Api\ShuttleImageController;
use App\Http\Controllers\Api\ContactInfoController;

// Auth Routes (Public)
Route::post('/login', [AuthController::class, 'login']);
Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Captcha Routes (Public)
Route::get('/captcha/generate', [CaptchaController::class, 'generate']);
Route::post('/captcha/verify', [CaptchaController::class, 'verify']);

// Contact Routes (Public)
Route::post('/contact', [ContactController::class, 'send']);
Route::post('/contact/test', [ContactController::class, 'test']); // 測試郵件發送
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/contacts', [ContactController::class, 'index']); // Backend: 列表
    Route::get('/contacts/{contact}', [ContactController::class, 'show'])->where('contact', '[0-9]+'); // Backend: 詳情
    Route::put('/contacts/{contact}', [ContactController::class, 'update'])->where('contact', '[0-9]+'); // Backend: 更新
    Route::patch('/contacts/{contact}/status', [ContactController::class, 'updateStatus'])->where('contact', '[0-9]+'); // Backend: 更新狀態
    Route::delete('/contacts/{contact}', [ContactController::class, 'destroy'])->where('contact', '[0-9]+'); // Backend: 刪除
});

// Booking Routes
Route::post('/booking', [BookingController::class, 'send']); // Public: 前端提交預約
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/bookings', [BookingController::class, 'index']); // Backend: 列表
    Route::get('/bookings/pending', [BookingController::class, 'pending']); // Backend: 未確認預約列表
    Route::get('/bookings/pending/count', [BookingController::class, 'pendingCount']); // Backend: 未確認預約數量
    Route::get('/bookings/{booking}', [BookingController::class, 'show'])->where('booking', '[0-9]+'); // Backend: 詳情
    Route::put('/bookings/{booking}', [BookingController::class, 'update'])->where('booking', '[0-9]+'); // Backend: 更新
    Route::patch('/bookings/{booking}/status', [BookingController::class, 'updateStatus'])->where('booking', '[0-9]+'); // Backend: 更新狀態
    Route::post('/bookings/{booking}/convert-to-order', [BookingController::class, 'convertToOrder'])->where('booking', '[0-9]+'); // Backend: 轉為訂單
    Route::delete('/bookings/{booking}', [BookingController::class, 'destroy'])->where('booking', '[0-9]+'); // Backend: 刪除
});

// Upload Routes (Protected for admin)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/upload/image', [UploadController::class, 'uploadImage']);
});

// Orders API
Route::prefix('orders')->group(function () {
    Route::get('/', [OrderController::class, 'index']);
    Route::post('/', [OrderController::class, 'store']);
    Route::get('/statistics', [OrderController::class, 'statistics']);
    Route::get('/monthly-report', [OrderController::class, 'monthlyReport']);
    Route::get('/partner-daily-report', [OrderController::class, 'partnerDailyReport']);
    Route::get('/partner-monthly-statistics', [OrderController::class, 'partnerMonthlyStatistics']);
    Route::get('/years', [OrderController::class, 'getYears']);
    Route::get('/months', [OrderController::class, 'getMonthsByYear']);
    Route::get('/{order}', [OrderController::class, 'show'])->where('order', '[0-9]+');
    Route::put('/{order}', [OrderController::class, 'update'])->where('order', '[0-9]+');
    Route::patch('/{order}/status', [OrderController::class, 'updateStatus'])->where('order', '[0-9]+');
    Route::delete('/{order}', [OrderController::class, 'destroy'])->where('order', '[0-9]+');
});

// Partners API
Route::prefix('partners')->group(function () {
    Route::get('/', [PartnerController::class, 'index']);
    Route::post('/', [PartnerController::class, 'store']);
    Route::post('/reorder', [PartnerController::class, 'reorder']);
    Route::get('/{partner}', [PartnerController::class, 'show']);
    Route::put('/{partner}', [PartnerController::class, 'update']);
    Route::delete('/{partner}', [PartnerController::class, 'destroy']);
    Route::post('/{partner}/upload-photo', [PartnerController::class, 'uploadPhoto']);
});

// Stores API
Route::prefix('stores')->group(function () {
    Route::get('/', [StoreController::class, 'index']);
    Route::post('/', [StoreController::class, 'store']);
    Route::get('/{store}', [StoreController::class, 'show']);
    Route::put('/{store}', [StoreController::class, 'update']);
    Route::delete('/{store}', [StoreController::class, 'destroy']);
    Route::post('/{store}/upload-photo', [StoreController::class, 'uploadPhoto']);
    Route::post('/{store}/upload-environment-image', [StoreController::class, 'uploadEnvironmentImage']);
    Route::delete('/{store}/environment-images/{environmentImage}', [StoreController::class, 'deleteEnvironmentImage']);
    Route::put('/{store}/environment-images/{environmentImage}/order', [StoreController::class, 'updateEnvironmentImageOrder']);
});

// Scooters API
Route::prefix('scooters')->group(function () {
    Route::get('/models', [ScooterController::class, 'models']); // Public: 獲取機車型號列表（供預約表單使用）
    Route::get('/', [ScooterController::class, 'index']);
    Route::get('/available', [ScooterController::class, 'available']);
    Route::post('/', [ScooterController::class, 'store']);
    Route::get('/{scooter}', [ScooterController::class, 'show']);
    Route::put('/{scooter}', [ScooterController::class, 'update']);
    Route::delete('/{scooter}', [ScooterController::class, 'destroy']);
    Route::post('/{scooter}/upload-photo', [ScooterController::class, 'uploadPhoto']);
});

// Scooter Types API
Route::prefix('scooter-types')->group(function () {
    Route::get('/', [ScooterTypeController::class, 'index']);
    Route::post('/', [ScooterTypeController::class, 'store']);
    Route::get('/{scooterType}', [ScooterTypeController::class, 'show']);
    Route::put('/{scooterType}', [ScooterTypeController::class, 'update']);
    Route::delete('/{scooterType}', [ScooterTypeController::class, 'destroy']);
});

// Scooter Models API
Route::prefix('scooter-models')->group(function () {
    Route::get('/', [ScooterModelController::class, 'index']);
    Route::post('/', [ScooterModelController::class, 'store']);
    Route::get('/{scooterModel}', [ScooterModelController::class, 'show']);
    Route::put('/{scooterModel}', [ScooterModelController::class, 'update']);
    Route::delete('/{scooterModel}', [ScooterModelController::class, 'destroy']);
    Route::post('/{scooterModel}/upload-image', [ScooterModelController::class, 'uploadImage']);
});

// Scooter Model Colors API
Route::prefix('scooter-model-colors')->group(function () {
    Route::get('/', [ScooterModelColorController::class, 'index']);
    Route::post('/get-colors', [ScooterModelColorController::class, 'getColors']);
    Route::get('/{model}', [ScooterModelColorController::class, 'show']);
    Route::put('/{model}', [ScooterModelColorController::class, 'update']);
    Route::delete('/{model}', [ScooterModelColorController::class, 'destroy']);
});

// Fines API
Route::prefix('fines')->group(function () {
    Route::get('/', [FineController::class, 'index']);
    Route::post('/', [FineController::class, 'store']);
    Route::get('/{fine}', [FineController::class, 'show']);
    Route::put('/{fine}', [FineController::class, 'update']);
    Route::delete('/{fine}', [FineController::class, 'destroy']);
    Route::post('/{fine}/upload-photo', [FineController::class, 'uploadPhoto']);
});

// Accessories API
Route::prefix('accessories')->group(function () {
    Route::get('/', [AccessoryController::class, 'index']);
    Route::get('/statistics', [AccessoryController::class, 'statistics']);
    Route::post('/', [AccessoryController::class, 'store']);
    Route::get('/{accessory}', [AccessoryController::class, 'show']);
    Route::put('/{accessory}', [AccessoryController::class, 'update']);
    Route::delete('/{accessory}', [AccessoryController::class, 'destroy']);
});

// Users API
Route::prefix('users')->group(function () {
    Route::get('/', [UserController::class, 'index']);
    Route::post('/', [UserController::class, 'store']);
    Route::get('/{user}', [UserController::class, 'show']);
    Route::put('/{user}', [UserController::class, 'update']);
    Route::delete('/{user}', [UserController::class, 'destroy']);
});

// Banners API (Public for frontend, Protected for admin)
Route::prefix('banners')->group(function () {
    Route::get('/', [BannerController::class, 'index']); // Public
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/', [BannerController::class, 'store']);
        Route::get('/{banner}', [BannerController::class, 'show']);
        Route::put('/{banner}', [BannerController::class, 'update']);
        Route::delete('/{banner}', [BannerController::class, 'destroy']);
        Route::post('/{banner}/upload-image', [BannerController::class, 'uploadImage']);
    });
});

// Rental Plans API (Public for frontend, Protected for admin)
Route::prefix('rental-plans')->group(function () {
    Route::get('/', [RentalPlanController::class, 'index']); // Public
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/', [RentalPlanController::class, 'store']);
        Route::get('/{rentalPlan}', [RentalPlanController::class, 'show']);
        Route::put('/{rentalPlan}', [RentalPlanController::class, 'update']);
        Route::delete('/{rentalPlan}', [RentalPlanController::class, 'destroy']);
        Route::post('/{rentalPlan}/upload-image', [RentalPlanController::class, 'uploadImage']);
    });
});

// Guidelines API (Public for frontend, Protected for admin)
Route::prefix('guidelines')->group(function () {
    Route::get('/', [GuidelineController::class, 'index']); // Public
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/', [GuidelineController::class, 'store']);
        Route::get('/{guideline}', [GuidelineController::class, 'show']);
        Route::put('/{guideline}', [GuidelineController::class, 'update']);
        Route::delete('/{guideline}', [GuidelineController::class, 'destroy']);
    });
});

// Locations API (Public for frontend, Protected for admin)
Route::prefix('locations')->group(function () {
    Route::get('/', [LocationController::class, 'index']); // Public
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/', [LocationController::class, 'store']);
        Route::get('/{location}', [LocationController::class, 'show']);
        Route::put('/{location}', [LocationController::class, 'update']);
        Route::delete('/{location}', [LocationController::class, 'destroy']);
        Route::post('/{location}/upload-image', [LocationController::class, 'uploadImage']);
    });
});

// Guesthouses API (Public for frontend, Protected for admin)
Route::prefix('guesthouses')->group(function () {
    Route::get('/', [GuesthouseController::class, 'index']); // Public
    Route::get('/{guesthouse}', [GuesthouseController::class, 'show']); // Public
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/', [GuesthouseController::class, 'store']);
        Route::put('/{guesthouse}', [GuesthouseController::class, 'update']);
        Route::delete('/{guesthouse}', [GuesthouseController::class, 'destroy']);
        Route::post('/{guesthouse}/upload-image', [GuesthouseController::class, 'uploadImage']);
        Route::post('/{guesthouse}/upload-images', [GuesthouseController::class, 'uploadImages']);
        Route::delete('/{guesthouse}/delete-image', [GuesthouseController::class, 'deleteImage']);
    });
});

// Home Images API (Public for frontend, Protected for admin)
Route::prefix('home-images')->group(function () {
    Route::get('/', [HomeImageController::class, 'index']); // Public
    Route::get('/{key}', [HomeImageController::class, 'show']); // Public
    Route::middleware('auth:sanctum')->group(function () {
        Route::put('/{key}', [HomeImageController::class, 'update']);
        Route::post('/{key}/upload-image', [HomeImageController::class, 'uploadImage']);
    });
});

// Environment Images API (Public for frontend, Protected for admin)
Route::prefix('environment-images')->group(function () {
    Route::get('/', [EnvironmentImageController::class, 'index']); // Public
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/', [EnvironmentImageController::class, 'store']);
        Route::put('/{environmentImage}', [EnvironmentImageController::class, 'update']);
        Route::delete('/{environmentImage}', [EnvironmentImageController::class, 'destroy']);
    });
});

// Shuttle Images API (Public for frontend, Protected for admin)
Route::prefix('shuttle-images')->group(function () {
    Route::get('/', [ShuttleImageController::class, 'index']); // Public
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/', [ShuttleImageController::class, 'store']);
        Route::put('/{shuttleImage}', [ShuttleImageController::class, 'update']);
        Route::delete('/{shuttleImage}', [ShuttleImageController::class, 'destroy']);
    });
});

// Contact Infos API (Public for frontend, Protected for admin)
Route::prefix('contact-infos')->group(function () {
    Route::get('/', [ContactInfoController::class, 'index']); // Public
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/', [ContactInfoController::class, 'store']);
        Route::get('/{contactInfo}', [ContactInfoController::class, 'show']);
        Route::put('/{contactInfo}', [ContactInfoController::class, 'update']);
        Route::delete('/{contactInfo}', [ContactInfoController::class, 'destroy']);
    });
});
