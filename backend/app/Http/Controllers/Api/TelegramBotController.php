<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TelegramBotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TelegramBotController extends Controller
{
    public function __construct(
        private readonly TelegramBotService $telegramBotService,
    ) {
    }

    public function webhook(Request $request): JsonResponse
    {
        $this->telegramBotService->handleUpdate($request->all());

        return response()->json([
            'ok' => true,
        ]);
    }
}
