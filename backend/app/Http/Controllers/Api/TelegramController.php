<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TelegramBotService;
use App\Services\TelegramLinkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class TelegramController extends Controller
{
    public function __construct(
        private readonly TelegramLinkService $telegramLinkService,
        private readonly TelegramBotService $telegramBotService,
    ) {
    }

    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'connected' => (bool) $user->telegram_chat_id,
            'telegram_username' => $user->telegram_username,
            'telegram_connected_at' => optional($user->telegram_connected_at)->toISOString(),
            'preferences' => [
                'critical_alerts' => (bool) $user->telegram_alerts_enabled,
                'recommendations' => (bool) $user->telegram_recommendations_enabled,
                'daily_summary' => (bool) $user->telegram_daily_summary_enabled,
            ],
            'bot_username' => config('services.telegram.bot_username'),
        ]);
    }

    public function createConnectToken(Request $request): JsonResponse
    {
        if (!config('services.telegram.bot_username')) {
            return response()->json([
                'message' => 'Telegram bot username is not configured.',
            ], 422);
        }

        return response()->json([
            'message' => 'Telegram connection link created successfully.',
            'data' => $this->telegramLinkService->createConnectLink($request->user()),
        ]);
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'critical_alerts' => ['sometimes', 'boolean'],
            'recommendations' => ['sometimes', 'boolean'],
            'daily_summary' => ['sometimes', 'boolean'],
        ]);

        $user = $request->user();

        $user->forceFill([
            'telegram_alerts_enabled' => $validated['critical_alerts'] ?? $user->telegram_alerts_enabled,
            'telegram_recommendations_enabled' => $validated['recommendations'] ?? $user->telegram_recommendations_enabled,
            'telegram_daily_summary_enabled' => $validated['daily_summary'] ?? $user->telegram_daily_summary_enabled,
        ])->save();

        return response()->json([
            'message' => 'Telegram preferences updated successfully.',
        ]);
    }

    public function sendTestMessage(Request $request): JsonResponse
    {
        try {
            $this->telegramBotService->sendTestMessage($request->user());
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'message' => 'Test message sent successfully.',
        ]);
    }

    public function disconnect(Request $request): JsonResponse
    {
        $request->user()->forceFill([
            'telegram_chat_id' => null,
            'telegram_username' => null,
            'telegram_connected_at' => null,
        ])->save();

        return response()->json([
            'message' => 'Telegram disconnected successfully.',
        ]);
    }
}
