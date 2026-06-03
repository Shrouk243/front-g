<?php

namespace App\Services;

use App\Models\User;
use App\Models\VitalSign;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class TelegramBotService
{
    public function __construct(
        private readonly TelegramLinkService $telegramLinkService,
        private readonly HealthAssistantService $healthAssistantService,
    ) {
    }

    public function isConfigured(): bool
    {
        return filled(config('services.telegram.bot_token'));
    }

    public function sendTestMessage(User $user): void
    {
        if (!$user->telegram_chat_id) {
            throw new RuntimeException('Telegram is not connected for this account.');
        }

        $this->sendMessage(
            $user->telegram_chat_id,
            'HealthSync test message: Telegram alerts are connected and working.',
            $this->mainKeyboard(),
            true
        );
    }

    public function sendAlert(User $user, VitalSign $vital, string $recommendation): void
    {
        if (!$user->telegram_chat_id || !$user->telegram_alerts_enabled) {
            return;
        }

        $this->sendMessage(
            $user->telegram_chat_id,
            $this->healthAssistantService->telegramAlertMessage($vital, $recommendation),
            $this->mainKeyboard()
        );
    }

    public function sendRecommendation(User $user, VitalSign $vital, string $recommendation): void
    {
        if (!$user->telegram_chat_id || !$user->telegram_recommendations_enabled) {
            return;
        }

        $this->sendMessage(
            $user->telegram_chat_id,
            $this->healthAssistantService->telegramRecommendationMessage($vital, $recommendation),
            $this->mainKeyboard()
        );
    }

    public function getUpdates(?int $offset = null, ?int $timeout = null): array
    {
        if (!$this->isConfigured()) {
            return [];
        }

        $payload = [
            'timeout' => $timeout ?? (int) config('services.telegram.polling_timeout', 10),
        ];

        if ($offset !== null) {
            $payload['offset'] = $offset;
        }

        try {
            $response = $this->request('getUpdates', $payload);
        } catch (Throwable $exception) {
            Log::warning('Telegram polling failed.', [
                'message' => $exception->getMessage(),
            ]);

            return [];
        }

        return $response['result'] ?? [];
    }

    public function handleUpdate(array $update): void
    {
        $message = $update['message'] ?? $update['callback_query']['message'] ?? null;
        $text = trim((string) ($message['text'] ?? ''));
        $chatId = isset($message['chat']['id']) ? (string) $message['chat']['id'] : null;
        $username = $message['from']['username'] ?? null;

        if (!$message || !$chatId || $text === '') {
            return;
        }

        if (str_starts_with($text, '/start')) {
            $token = trim((string) preg_replace('/^\/start\s*/', '', $text));
            $this->handleStartCommand($chatId, $username, $token);

            return;
        }

        $user = User::query()->where('telegram_chat_id', $chatId)->first();

        if (!$user) {
            $this->sendMessage($chatId, 'Please connect Telegram from the HealthSync app first.');

            return;
        }

        $this->handleKeyboardCommand($user, $text);
    }

    private function handleStartCommand(string $chatId, ?string $username, string $token): void
    {
        if ($token !== '') {
            $user = $this->telegramLinkService->consumeConnectToken($token, $chatId, $username);

            if (!$user) {
                $this->sendMessage($chatId, 'This connection link is invalid or has expired. Please reconnect from the app.');

                return;
            }

            $displayUsername = $user->telegram_username ? '@'.$user->telegram_username : 'your Telegram account';

            $this->sendMessage(
                $chatId,
                "HealthSync is now connected to {$displayUsername}. You can use the keyboard below for quick updates.",
                $this->mainKeyboard()
            );

            return;
        }

        $user = User::query()->where('telegram_chat_id', $chatId)->first();

        $message = $user
            ? 'Welcome back to HealthSync. Use the keyboard below to check your latest readings and summary.'
            : 'Welcome to the HealthSync bot. To connect your account, open Telegram Alerts in the app and tap Connect Telegram.';

        $this->sendMessage($chatId, $message, $user ? $this->mainKeyboard() : null);
    }

    private function handleKeyboardCommand(User $user, string $text): void
    {
        $response = match ($text) {
            'Last Blood Pressure' => $this->healthAssistantService->latestReadingMessage($user, 'blood_pressure'),
            'Last Blood Glucose' => $this->healthAssistantService->latestReadingMessage($user, 'blood_sugar'),
            'Last Heart Rate' => $this->healthAssistantService->latestReadingMessage($user, 'heart_rate'),
            'Last Blood Oxygen' => $this->healthAssistantService->latestReadingMessage($user, 'oxygen'),
            'Today Summary' => $this->healthAssistantService->todaySummary($user)['summary'],
            'Latest Recommendation' => $user->latest_recommendation ?: 'No recommendation is available yet.',
            'Open Dashboard' => config('services.telegram.frontend_app_url')
                ? 'Open your dashboard here: '.config('services.telegram.frontend_app_url')
                : 'Dashboard URL is not configured yet.',
            default => 'Use the keyboard buttons to request your latest readings or summary.',
        };

        $this->sendMessage($user->telegram_chat_id, $response, $this->mainKeyboard());
    }

    private function sendMessage(string $chatId, string $text, ?array $replyMarkup = null, bool $throwOnFailure = false): void
    {
        if (!$this->isConfigured()) {
            if ($throwOnFailure) {
                throw new RuntimeException('Telegram bot token is not configured.');
            }

            return;
        }

        $payload = [
            'chat_id' => $chatId,
            'text' => $text,
        ];

        if ($replyMarkup) {
            $payload['reply_markup'] = $replyMarkup;
        }

        try {
            $this->request('sendMessage', $payload);
        } catch (Throwable $exception) {
            $safeMessage = $this->safeTelegramErrorMessage($exception);

            Log::warning('Telegram message delivery failed.', [
                'chat_id' => $chatId,
                'message' => $safeMessage,
            ]);

            if ($throwOnFailure) {
                throw new RuntimeException("Telegram could not deliver the message: {$safeMessage}");
            }
        }
    }

    private function request(string $method, array $payload): array
    {
        $token = config('services.telegram.bot_token');
        $verifySsl = (bool) config('services.telegram.verify_ssl', true);

        if (!$token) {
            return [];
        }

        $response = Http::timeout(15)
            ->withOptions(['verify' => $verifySsl])
            ->post("https://api.telegram.org/bot{$token}/{$method}", $payload)
            ->throw()
            ->json();

        return is_array($response) ? $response : [];
    }

    private function mainKeyboard(): array
    {
        $dashboardUrl = $this->telegramWebAppUrl();

        $keyboard = [
            [['text' => 'Last Blood Pressure'], ['text' => 'Last Blood Glucose']],
            [['text' => 'Last Heart Rate'], ['text' => 'Last Blood Oxygen']],
            [['text' => 'Today Summary'], ['text' => 'Latest Recommendation']],
        ];

        if ($dashboardUrl) {
            $keyboard[] = [[
                'text' => 'Open Dashboard',
                'web_app' => ['url' => $dashboardUrl],
            ]];
        } else {
            $keyboard[] = [['text' => 'Open Dashboard']];
        }

        return [
            'keyboard' => $keyboard,
            'resize_keyboard' => true,
            'is_persistent' => true,
        ];
    }

    private function telegramWebAppUrl(): ?string
    {
        $dashboardUrl = trim((string) config('services.telegram.frontend_app_url'));

        if ($dashboardUrl === '' || !filter_var($dashboardUrl, FILTER_VALIDATE_URL)) {
            return null;
        }

        return str_starts_with($dashboardUrl, 'https://') ? $dashboardUrl : null;
    }

    private function safeTelegramErrorMessage(Throwable $exception): string
    {
        $message = preg_replace('/\s+/', ' ', trim($exception->getMessage())) ?? 'Unknown Telegram error.';

        if (preg_match('/"description":"([^"]+)"/', $message, $matches)) {
            return $matches[1];
        }

        return $message;
    }
}
