<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AIAnalysisController;
use App\Http\Controllers\Api\VitalSignController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\TelegramBotController;
use App\Http\Controllers\Api\TelegramController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/telegram/webhook', [TelegramBotController::class, 'webhook']);

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/update', [ProfileController::class, 'update']);

    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::post('/vitals', [VitalSignController::class, 'store']);
    Route::get('/vitals', [VitalSignController::class, 'index']);
    Route::get('/recommendations/latest', [VitalSignController::class, 'latestRecommendation']);
    Route::get('/summary/today', [VitalSignController::class, 'todaySummary']);
    Route::get('/ai-analysis', [AIAnalysisController::class, 'analyze']);
    Route::get('/alerts', [NotificationController::class, 'index']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::get('/telegram/status', [TelegramController::class, 'status']);
    Route::post('/telegram/connect-token', [TelegramController::class, 'createConnectToken']);
    Route::patch('/telegram/preferences', [TelegramController::class, 'updatePreferences']);
    Route::post('/telegram/test-message', [TelegramController::class, 'sendTestMessage']);
    Route::delete('/telegram/disconnect', [TelegramController::class, 'disconnect']);
});
