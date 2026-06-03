<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Validation\ValidationException;

class VitalMonitoringService
{
    public function __construct(
        private readonly HealthAssistantService $healthAssistantService,
        private readonly TelegramBotService $telegramBotService,
    ) {
    }

    public function createReading(User $user, array $validated): array
    {
        $type = $this->healthAssistantService->normalizeType($validated['type']);

        $this->validatePayloadForType($type, $validated);

        $status = $validated['status'] ?? $this->healthAssistantService->inferStatus($type, $validated);

        $vital = $user->vitalSigns()->create([
            'type' => $type,
            'value' => $validated['value'] ?? null,
            'systolic' => $validated['systolic'] ?? null,
            'diastolic' => $validated['diastolic'] ?? null,
            'status' => $status,
            'measured_at' => $validated['measured_at'] ?? now(),
            'source' => $validated['source'] ?? 'manual',
        ]);

        $recommendation = $this->healthAssistantService->recommendationForVital($vital);

        $user->forceFill([
            'latest_recommendation' => $recommendation,
        ])->save();

        $notification = null;

        if (in_array($vital->status, ['elevated', 'critical'], true)) {
            $notification = $user->notifications()->create(
                $this->healthAssistantService->notificationPayload($vital, $recommendation)
            );

            $this->telegramBotService->sendAlert($user->fresh(), $vital, $recommendation);
        }

        $this->telegramBotService->sendRecommendation($user->fresh(), $vital, $recommendation);

        return [
            'vital' => $vital,
            'notification' => $notification,
            'recommendation' => $recommendation,
        ];
    }

    private function validatePayloadForType(string $type, array $validated): void
    {
        $allowedTypes = ['blood_pressure', 'blood_sugar', 'heart_rate', 'oxygen'];

        if (!in_array($type, $allowedTypes, true)) {
            throw ValidationException::withMessages([
                'type' => ['Unsupported vital type.'],
            ]);
        }

        if ($type === 'blood_pressure' && (!isset($validated['systolic']) || !isset($validated['diastolic']))) {
            throw ValidationException::withMessages([
                'blood_pressure' => ['Blood pressure readings require systolic and diastolic values.'],
            ]);
        }

        if ($type !== 'blood_pressure' && !isset($validated['value'])) {
            throw ValidationException::withMessages([
                'value' => ['A numeric value is required for this vital reading.'],
            ]);
        }
    }
}
