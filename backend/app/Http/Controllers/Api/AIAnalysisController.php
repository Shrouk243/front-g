<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AIAnalysis;
use App\Services\TempMockHealthInsightService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIAnalysisController extends Controller
{
    public function __construct(
        private readonly TempMockHealthInsightService $tempMockHealthInsightService
    ) {
    }

    public function analyze(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentVitals = $user->vitalSigns()
            ->latest('measured_at')
            ->get()
            ->groupBy('type')
            ->map(fn ($group) => $group->first())
            ->values();

        if ($currentVitals->isEmpty()) {
            return response()->json($this->tempMockHealthInsightService->buildFromVitals($currentVitals));
        }

        $latestVitalTimestamp = $currentVitals
            ->map(fn ($vital) => $vital->measured_at ?? $vital->created_at)
            ->max();

        $latestAnalysis = $user->aiAnalyses()->latest()->first();

        if ($latestAnalysis && $latestVitalTimestamp && $latestAnalysis->created_at?->greaterThanOrEqualTo($latestVitalTimestamp)) {
            return response()->json($latestAnalysis);
        }

        $payload = $this->tempMockHealthInsightService->buildFromVitals($currentVitals);
        $analysis = new AIAnalysis($payload);
        $analysis->user()->associate($user);
        $analysis->save();

        return response()->json($analysis);
    }
}
