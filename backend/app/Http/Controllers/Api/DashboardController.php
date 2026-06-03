<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TempMockHealthInsightService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private readonly TempMockHealthInsightService $tempMockHealthInsightService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $recentVitals = $user->vitalSigns()
            ->latest('measured_at')
            ->latest()
            ->limit(20)
            ->get();

        $currentVitals = $recentVitals
            ->groupBy('type')
            ->map(fn ($group) => $group->first())
            ->values();

        $latestAnalysis = $user->aiAnalyses()->latest()->first();

        if (!$latestAnalysis) {
            $latestAnalysis = $this->tempMockHealthInsightService->buildFromVitals($currentVitals);
        }

        return response()->json([
            'user' => $user,
            'current_vitals' => $currentVitals->map(fn ($vital) => [
                'id' => $vital->id,
                'type' => $vital->type,
                'display_type' => match ($vital->type) {
                    'blood_pressure' => 'bloodPressure',
                    'blood_sugar' => 'bloodSugar',
                    'heart_rate' => 'heartRate',
                    default => $vital->type,
                },
                'value' => $vital->type === 'blood_pressure'
                    ? "{$vital->systolic}/{$vital->diastolic}"
                    : (string) $vital->value,
                'numeric_value' => $vital->value,
                'systolic' => $vital->systolic,
                'diastolic' => $vital->diastolic,
                'status' => $vital->status,
                'source' => $vital->source ?? 'manual',
                'measured_at' => optional($vital->measured_at)->toISOString(),
                'created_at' => optional($vital->created_at)->toISOString(),
            ])->values(),
            'recent_vitals' => $recentVitals->map(fn ($vital) => [
                'id' => $vital->id,
                'display_type' => match ($vital->type) {
                    'blood_pressure' => 'bloodPressure',
                    'blood_sugar' => 'bloodSugar',
                    'heart_rate' => 'heartRate',
                    default => $vital->type,
                },
                'type' => $vital->type,
                'value' => $vital->type === 'blood_pressure'
                    ? "{$vital->systolic}/{$vital->diastolic}"
                    : (string) $vital->value,
                'numeric_value' => $vital->value,
                'systolic' => $vital->systolic,
                'diastolic' => $vital->diastolic,
                'status' => $vital->status,
                'source' => $vital->source ?? 'manual',
                'measured_at' => optional($vital->measured_at)->toISOString(),
                'created_at' => optional($vital->created_at)->toISOString(),
            ])->values(),
            'latest_analysis' => $latestAnalysis,
            'analysis_preview' => $latestAnalysis,
            'notifications_count' => $user->notifications()->where('read', false)->count(),
            'recent_notifications' => $user->notifications()->latest()->take(5)->get(),
        ]);
    }
}
