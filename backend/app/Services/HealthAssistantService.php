<?php

namespace App\Services;

use App\Models\User;
use App\Models\VitalSign;
use Illuminate\Support\Carbon;

class HealthAssistantService
{
    public function normalizeType(string $type): string
    {
        return match ($type) {
            'bloodPressure' => 'blood_pressure',
            'bloodGlucose', 'blood_glucose', 'bloodSugar' => 'blood_sugar',
            'heartRate' => 'heart_rate',
            'bloodOxygen', 'blood_oxygen', 'spo2' => 'oxygen',
            default => $type,
        };
    }

    public function displayType(string $type): string
    {
        return match ($type) {
            'blood_pressure' => 'bloodPressure',
            'blood_sugar' => 'bloodGlucose',
            'heart_rate' => 'heartRate',
            'oxygen' => 'bloodOxygen',
            default => $type,
        };
    }

    public function labelForType(string $type): string
    {
        return match ($type) {
            'blood_pressure' => 'Blood Pressure',
            'blood_sugar' => 'Blood Glucose',
            'heart_rate' => 'Heart Rate',
            'oxygen' => 'Blood Oxygen',
            default => ucwords(str_replace('_', ' ', $type)),
        };
    }

    public function formatValue(VitalSign $vital): string
    {
        return match ($vital->type) {
            'blood_pressure' => "{$vital->systolic}/{$vital->diastolic} mmHg",
            'blood_sugar' => rtrim(rtrim(number_format((float) $vital->value, 2, '.', ''), '0'), '.').' mg/dL',
            'heart_rate' => rtrim(rtrim(number_format((float) $vital->value, 2, '.', ''), '0'), '.').' bpm',
            'oxygen' => rtrim(rtrim(number_format((float) $vital->value, 2, '.', ''), '0'), '.').'%',
            default => (string) $vital->value,
        };
    }

    public function inferStatus(string $type, array $payload): string
    {
        return match ($type) {
            'blood_pressure' => $this->inferBloodPressureStatus(
                (int) ($payload['systolic'] ?? 0),
                (int) ($payload['diastolic'] ?? 0)
            ),
            'blood_sugar' => $this->inferBloodSugarStatus((float) ($payload['value'] ?? 0)),
            'heart_rate' => $this->inferHeartRateStatus((float) ($payload['value'] ?? 0)),
            'oxygen' => $this->inferOxygenStatus((float) ($payload['value'] ?? 0)),
            default => 'normal',
        };
    }

    public function recommendationForVital(VitalSign $vital): string
    {
        if ($vital->status === 'critical') {
            return match ($vital->type) {
                'blood_pressure' => 'This reading is very high. Recheck after resting, and seek urgent medical help if you feel unwell.',
                'blood_sugar' => 'This reading is very high. Recheck soon and seek medical help if you have concerning symptoms.',
                'heart_rate' => 'This reading is far from your usual range. Rest, recheck, and get medical help if symptoms are severe.',
                'oxygen' => 'This reading is very low. Recheck immediately and seek urgent medical help if low oxygen persists or symptoms are present.',
                default => 'This reading needs urgent attention. Recheck soon and seek medical help if symptoms are severe.',
            };
        }

        if ($vital->status === 'elevated') {
            return match ($vital->type) {
                'blood_pressure' => 'This reading is a little high. Rest, reduce salt today, and repeat the check later.',
                'blood_sugar' => 'This reading is above target. Stay hydrated, watch your meals, and recheck later today.',
                'heart_rate' => 'This reading is mildly abnormal. Sit quietly, hydrate, and repeat the reading after a short rest.',
                'oxygen' => 'This reading is slightly low. Warm your hands, sit upright, and repeat the reading in a few minutes.',
                default => 'This reading is mildly abnormal. Recheck later and monitor how you feel.',
            };
        }

        return match ($vital->type) {
            'blood_pressure' => 'Your blood pressure looks steady right now. Keep up your usual routine and regular checks.',
            'blood_sugar' => 'Your glucose reading looks reassuring. Keep following your normal meal and monitoring routine.',
            'heart_rate' => 'Your heart rate looks steady right now. Keep monitoring and stay hydrated.',
            'oxygen' => 'Your oxygen reading looks reassuring. Keep tracking it if you have respiratory symptoms.',
            default => 'Your latest reading looks reassuring. Keep monitoring consistently.',
        };
    }

    public function notificationPayload(VitalSign $vital, string $recommendation): array
    {
        $severityLabel = $vital->status === 'critical' ? 'Critical' : 'Elevated';
        $typeLabel = $this->labelForType($vital->type);
        $value = $this->formatValue($vital);

        return [
            'type' => $vital->status === 'critical' ? 'critical' : 'reminder',
            'title' => "{$severityLabel} {$typeLabel} Alert",
            'message' => "{$typeLabel} reading {$value} was recorded at ".$this->formatTimestamp($vital).". {$recommendation}",
            'action_required' => $vital->status === 'critical',
        ];
    }

    public function telegramAlertMessage(VitalSign $vital, string $recommendation): string
    {
        $severityLabel = $vital->status === 'critical' ? 'Critical' : 'Elevated';

        return implode("\n", [
            "{$severityLabel} alert: ".$this->labelForType($vital->type),
            'Reading: '.$this->formatValue($vital),
            'Time: '.$this->formatTimestamp($vital),
            'Severity: '.$severityLabel,
            'Recommendation: '.$recommendation,
        ]);
    }

    public function telegramRecommendationMessage(VitalSign $vital, string $recommendation): string
    {
        return implode("\n", [
            'New reading saved: '.$this->labelForType($vital->type),
            'Reading: '.$this->formatValue($vital),
            'Time: '.$this->formatTimestamp($vital),
            'Recommendation: '.$recommendation,
        ]);
    }

    public function latestReadingMessage(User $user, string $type): string
    {
        $reading = $user->vitalSigns()
            ->where('type', $this->normalizeType($type))
            ->latest('measured_at')
            ->latest()
            ->first();

        if (!$reading) {
            return 'No reading is available yet for '.$this->labelForType($type).'.';
        }

        return implode("\n", [
            'Latest '.$this->labelForType($reading->type),
            'Reading: '.$this->formatValue($reading),
            'Time: '.$this->formatTimestamp($reading),
            'Status: '.ucfirst($reading->status),
        ]);
    }

    public function todaySummary(User $user): array
    {
        $todayReadings = $user->vitalSigns()
            ->whereBetween('measured_at', [Carbon::today(), Carbon::tomorrow()])
            ->latest('measured_at')
            ->latest()
            ->get();

        if ($todayReadings->isEmpty()) {
            return [
                'date' => Carbon::today()->toDateString(),
                'readings_count' => 0,
                'alerts_count' => 0,
                'latest_readings' => [],
                'summary' => 'No readings have been saved today yet.',
            ];
        }

        $latestReadings = $todayReadings
            ->groupBy('type')
            ->map(fn ($group) => $group->first())
            ->values()
            ->map(fn (VitalSign $reading) => [
                'type' => $reading->type,
                'label' => $this->labelForType($reading->type),
                'value' => $this->formatValue($reading),
                'status' => $reading->status,
                'measured_at' => optional($reading->measured_at)->toISOString(),
            ])
            ->values()
            ->all();

        $alertsCount = $todayReadings->whereIn('status', ['elevated', 'critical'])->count();

        $summaryLines = [
            'Today summary',
            'Readings logged: '.$todayReadings->count(),
            'Readings needing attention: '.$alertsCount,
        ];

        foreach ($latestReadings as $reading) {
            $summaryLines[] = "{$reading['label']}: {$reading['value']} (".ucfirst($reading['status']).')';
        }

        return [
            'date' => Carbon::today()->toDateString(),
            'readings_count' => $todayReadings->count(),
            'alerts_count' => $alertsCount,
            'latest_readings' => $latestReadings,
            'summary' => implode("\n", $summaryLines),
        ];
    }

    public function latestRecommendation(User $user): array
    {
        return [
            'recommendation' => $user->latest_recommendation,
            'connected_to_telegram' => (bool) $user->telegram_chat_id,
        ];
    }

    private function inferBloodPressureStatus(int $systolic, int $diastolic): string
    {
        if ($systolic >= 180 || $diastolic >= 120) {
            return 'critical';
        }

        if ($systolic >= 140 || $diastolic >= 90) {
            return 'elevated';
        }

        return 'normal';
    }

    private function inferBloodSugarStatus(float $value): string
    {
        if ($value >= 250) {
            return 'critical';
        }

        if ($value >= 140) {
            return 'elevated';
        }

        return 'normal';
    }

    private function inferHeartRateStatus(float $value): string
    {
        if ($value <= 40 || $value >= 130) {
            return 'critical';
        }

        if ($value <= 50 || $value >= 100) {
            return 'elevated';
        }

        return 'normal';
    }

    private function inferOxygenStatus(float $value): string
    {
        if ($value < 90) {
            return 'critical';
        }

        if ($value < 95) {
            return 'elevated';
        }

        return 'normal';
    }

    private function formatTimestamp(VitalSign $vital): string
    {
        return optional($vital->measured_at)->timezone(config('app.timezone'))->format('Y-m-d H:i') ?? 'unknown time';
    }
}
