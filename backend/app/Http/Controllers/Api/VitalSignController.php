<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VitalSign;
use App\Services\HealthAssistantService;
use App\Services\VitalMonitoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VitalSignController extends Controller
{
    public function __construct(
        private readonly VitalMonitoringService $vitalMonitoringService,
        private readonly HealthAssistantService $healthAssistantService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['nullable', 'string'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = $request->user()
            ->vitalSigns()
            ->latest('measured_at')
            ->latest();

        if (!empty($validated['type'])) {
            $query->where('type', $this->healthAssistantService->normalizeType($validated['type']));
        }

        $items = $query
            ->limit($validated['limit'] ?? 100)
            ->get()
            ->map(fn (VitalSign $vital) => $this->transformVital($vital))
            ->values();

        $current = $request->user()
            ->vitalSigns()
            ->latest('measured_at')
            ->get()
            ->groupBy('type')
            ->map(fn ($group) => $this->transformVital($group->first()))
            ->values();

        return response()->json([
            'items' => $items,
            'current' => $current,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string'],
            'value' => ['nullable', 'numeric'],
            'systolic' => ['nullable', 'integer', 'min:40', 'max:260'],
            'diastolic' => ['nullable', 'integer', 'min:20', 'max:180'],
            'status' => ['nullable', Rule::in(['normal', 'elevated', 'critical'])],
            'measured_at' => ['nullable', 'date'],
            'source' => ['nullable', Rule::in(['manual', 'device'])],
        ]);

        $result = $this->vitalMonitoringService->createReading($request->user(), $validated);
        $vital = $result['vital'];

        return response()->json([
            'message' => 'Vital reading saved successfully.',
            'data' => $this->transformVital($vital),
            'recommendation' => $result['recommendation'],
            'alert_created' => (bool) $result['notification'],
        ], 201);
    }

    public function latestRecommendation(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->healthAssistantService->latestRecommendation($request->user()),
        ]);
    }

    public function todaySummary(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->healthAssistantService->todaySummary($request->user()),
        ]);
    }

    private function transformVital(VitalSign $vital): array
    {
        return [
            'id' => $vital->id,
            'type' => $vital->type,
            'display_type' => $this->healthAssistantService->displayType($vital->type),
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
        ];
    }
}
