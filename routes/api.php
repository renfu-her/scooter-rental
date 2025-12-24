<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PartnerController;
use App\Http\Controllers\Api\ScooterController;
use App\Http\Controllers\Api\FineController;
use App\Http\Controllers\Api\AccessoryController;
use App\Http\Controllers\Api\StoreController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Orders API
Route::prefix('orders')->group(function () {
    Route::get('/', [OrderController::class, 'index']);
    Route::post('/', [OrderController::class, 'store']);
    Route::get('/statistics', [OrderController::class, 'statistics']);
    Route::get('/{order}', [OrderController::class, 'show']);
    Route::put('/{order}', [OrderController::class, 'update']);
    Route::delete('/{order}', [OrderController::class, 'destroy']);
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
