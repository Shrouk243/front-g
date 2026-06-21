<?php

namespace App\Services;

use App\Models\TelegramConnectToken;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class TelegramLinkService
{
    public function createConnectLink(User $user): array
    {
        $rawToken = Str::random(64);
        $expiresAt = now()->addMinutes((int) config('services.telegram.connect_token_expiration_minutes', 15));

        $user->telegramConnectTokens()
            ->whereNull('used_at')
            ->delete();

        $token = $user->telegramConnectTokens()->create([
            'token_hash' => hash('sha256', $rawToken),
            'expires_at' => $expiresAt,
        ]);

        $botUsername = ltrim((string) config('services.telegram.bot_username'), '@');

        return [
            'token' => $rawToken,
            'connect_url' => $botUsername ? "https://t.me/{$botUsername}?start={$rawToken}" : null,
            'expires_at' => $token->expires_at?->toISOString(),
            'bot_username' => $botUsername,
        ];
    }

    public function consumeConnectToken(string $rawToken, string $chatId, ?string $username = null): ?User
    {
        $token = TelegramConnectToken::query()
            ->where('token_hash', hash('sha256', $rawToken))
            ->whereNull('used_at')
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$token) {
            return null;
        }

        $user = $token->user;

        $user->forceFill([
            'telegram_chat_id' => $chatId,
            'telegram_username' => $username,
            'telegram_connected_at' => now(),
        ])->save();

        $token->forceFill([
            'used_at' => now(),
        ])->save();

        $user->telegramConnectTokens()
            ->whereKeyNot($token->id)
            ->whereNull('used_at')
            ->delete();

        return $user->fresh();
    }
}
