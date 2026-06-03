<?php

namespace App\Services;

use App\Models\VitalSign;
use Illuminate\Support\Collection;

class TempMockHealthInsightService
{
    /**
     * TEMP MOCK
     * TODO: Replace with real AI integration.
     */
    public function buildFromVitals(Collection $currentVitals): array
    {
        if ($currentVitals->isEmpty()) {
            return [
                'risk_level' => 'low',
                'summary' => 'Not enough readings yet. Add a few measurements to generate a better health summary.',
                'recommendations' => [
                    'Add your first blood pressure or glucose reading.',
                    'Record at least one measurement per day.',
                    'Review the dashboard again after saving new data.',
                ],
                'explanation' => 'This temporary fallback analysis is shown because there is not enough recent data to generate a stronger insight yet.',
                'health_score' => 75,
            ];
        }

        $highestRisk = 'low';
        $highestRank = 1;
        $score = 96;
        $summaryParts = [];
        $recommendations = [];
        $explanations = [];

        foreach ($currentVitals as $vital) {
            $analysis = $this->analyzeVital($vital);

            if ($analysis['rank'] > $highestRank) {
                $highestRank = $analysis['rank'];
                $highestRisk = $analysis['risk_level'];
            }

            $score = min($score, $analysis['suggested_score']);
            $summaryParts[] = $analysis['summary'];
            $recommendations = array_merge($recommendations, $analysis['recommendations']);
            $explanations[] = $analysis['explanation'];
        }

        return [
            'risk_level' => $highestRisk,
            'summary' => implode(' ', array_unique($summaryParts)),
            'recommendations' => array_values(array_slice(array_unique($recommendations), 0, 4)),
            'explanation' => implode(' ', array_unique($explanations)),
            'health_score' => max(35, min($score, 98)),
        ];
    }

    private function analyzeVital(VitalSign $vital): array
    {
        return match ($vital->type) {
            'blood_pressure' => $this->analyzeBloodPressure($vital),
            'blood_sugar' => $this->analyzeBloodSugar($vital),
            'heart_rate' => $this->analyzeHeartRate($vital),
            'oxygen' => $this->analyzeOxygen($vital),
            default => $this->buildLowRiskResponse('Latest health readings look stable.'),
        };
    }

    private function analyzeBloodPressure(VitalSign $vital): array
    {
        $systolic = (int) $vital->systolic;
        $diastolic = (int) $vital->diastolic;

        if ($vital->status === 'critical' || $systolic >= 180 || $diastolic >= 120) {
            return $this->buildHighRiskResponse(
                'Blood pressure is in a dangerous range.',
                'Blood pressure is severely elevated, which may require urgent medical attention.',
                ['Seek urgent medical advice.', 'Retake the blood pressure reading after resting.', 'Avoid physical exertion until reviewed.'],
                40
            );
        }

        if ($vital->status === 'elevated' || $systolic >= 140 || $diastolic >= 90) {
            return $this->buildMediumRiskResponse(
                'Blood pressure is above the desired range.',
                'The latest blood pressure reading is elevated and should be monitored closely.',
                ['Reduce salt intake.', 'Retake the measurement later today.', 'Keep daily blood pressure logs.'],
                68
            );
        }

        return $this->buildLowRiskResponse(
            'Blood pressure is currently within a stable range.',
            'Blood pressure readings look stable right now.',
            ['Keep measuring at the same time each day.'],
            92
        );
    }

    private function analyzeBloodSugar(VitalSign $vital): array
    {
        $value = (float) $vital->value;

        if ($vital->status === 'critical' || $value >= 250) {
            return $this->buildHighRiskResponse(
                'Blood glucose is critically high.',
                'The latest glucose reading is significantly above the safe range.',
                ['Contact your clinician if symptoms continue.', 'Recheck glucose after following your care plan.', 'Stay hydrated.'],
                45
            );
        }

        if ($vital->status === 'elevated' || $value >= 140) {
            return $this->buildMediumRiskResponse(
                'Blood glucose is mildly elevated.',
                'The current glucose reading suggests additional monitoring is needed.',
                ['Watch meal timing and portions.', 'Add another glucose reading later today.'],
                72
            );
        }

        return $this->buildLowRiskResponse(
            'Blood glucose is currently in a healthy range.',
            'Glucose readings appear stable.',
            ['Keep a regular meal schedule.'],
            91
        );
    }

    private function analyzeHeartRate(VitalSign $vital): array
    {
        $value = (float) $vital->value;

        if ($vital->status === 'critical' || $value >= 130 || $value <= 40) {
            return $this->buildHighRiskResponse(
                'Heart rate is outside the safe range.',
                'The latest heart rate reading may need quick review depending on symptoms.',
                ['Rest and repeat the reading.', 'Seek medical advice if symptoms persist.', 'Avoid intense activity for now.'],
                50
            );
        }

        if ($vital->status === 'elevated' || $value >= 100) {
            return $this->buildMediumRiskResponse(
                'Heart rate is slightly elevated.',
                'The current heart rate is higher than ideal and deserves follow-up.',
                ['Focus on hydration and rest.', 'Repeat the reading after sitting quietly for a few minutes.'],
                76
            );
        }

        return $this->buildLowRiskResponse(
            'Heart rate is in a healthy range.',
            'The heart rate pattern looks stable.',
            ['Maintain sleep and hydration habits.'],
            93
        );
    }

    private function analyzeOxygen(VitalSign $vital): array
    {
        $value = (float) $vital->value;

        if ($vital->status === 'critical' || $value < 90) {
            return $this->buildHighRiskResponse(
                'Oxygen saturation is critically low.',
                'The latest oxygen reading is below the safe range and may require urgent review.',
                ['Retake the reading immediately.', 'Seek urgent medical help if low oxygen is confirmed.', 'Sit upright and remain calm.'],
                35
            );
        }

        if ($vital->status === 'elevated' || $value < 95) {
            return $this->buildMediumRiskResponse(
                'Oxygen saturation is slightly below normal.',
                'The current oxygen reading is mildly reduced and should be rechecked.',
                ['Repeat the reading in a few minutes.', 'Practice slow deep breathing if advised by your doctor.'],
                70
            );
        }

        return $this->buildLowRiskResponse(
            'Oxygen saturation looks stable.',
            'Oxygen readings are currently in a reassuring range.',
            ['Keep monitoring if you have respiratory symptoms.'],
            95
        );
    }

    private function buildLowRiskResponse(
        string $summary,
        string $explanation = 'Recent readings look stable.',
        array $recommendations = ['Keep tracking your readings regularly.'],
        int $score = 90
    ): array {
        return [
            'rank' => 1,
            'risk_level' => 'low',
            'summary' => $summary,
            'explanation' => $explanation,
            'recommendations' => $recommendations,
            'suggested_score' => $score,
        ];
    }

    private function buildMediumRiskResponse(
        string $summary,
        string $explanation,
        array $recommendations,
        int $score
    ): array {
        return [
            'rank' => 2,
            'risk_level' => 'medium',
            'summary' => $summary,
            'explanation' => $explanation,
            'recommendations' => $recommendations,
            'suggested_score' => $score,
        ];
    }

    private function buildHighRiskResponse(
        string $summary,
        string $explanation,
        array $recommendations,
        int $score
    ): array {
        return [
            'rank' => 3,
            'risk_level' => 'high',
            'summary' => $summary,
            'explanation' => $explanation,
            'recommendations' => $recommendations,
            'suggested_score' => $score,
        ];
    }
}
