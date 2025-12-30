<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PartnerController;
use App\Http\Controllers\Api\ScooterController;
use App\Http\Controllers\Api\ScooterModelColorController;
use App\Http\Controllers\Api\FineController;
use App\Http\Controllers\Api\AccessoryController;
use App\Http\Controllers\Api\StoreController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CaptchaController;

// Auth Routes (Public)
Route::post('/login', [AuthController::class, 'login']);
Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Captcha Routes (Public)
Route::get('/captcha/generate', [CaptchaController::class, 'generate']);
Route::post('/captcha/verify', [CaptchaController::class, 'verify']);

// Orders API
Route::prefix('orders')->group(function () {
    Route::get('/', [OrderController::class, 'index']);
    Route::post('/', [OrderController::class, 'store']);
    Route::get('/statistics', [OrderController::class, 'statistics']);
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
});

// Scooters API
Route::prefix('scooters')->group(function () {
    Route::get('/', [ScooterController::class, 'index']);
    Route::get('/available', [ScooterController::class, 'available']);
    Route::post('/', [ScooterController::class, 'store']);
    Route::get('/{scooter}', [ScooterController::class, 'show']);
    Route::put('/{scooter}', [ScooterController::class, 'update']);
    Route::delete('/{scooter}', [ScooterController::class, 'destroy']);
    Route::post('/{scooter}/upload-photo', [ScooterController::class, 'uploadPhoto']);
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
