<?php

namespace Database\Seeders;

use App\Models\AIAnalysis;
use App\Models\Notification;
use App\Models\User;
use App\Models\VitalSign;
use App\Services\TempMockHealthInsightService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'demo@healthsync.app'],
            [
                'name' => 'Demo Patient',
                'password' => Hash::make('Password123!'),
                'date_of_birth' => '2000-01-01',
                'gender' => 'female',
                'chronic_conditions' => ['hypertension'],
            ]
        );

        $vitals = [
            ['type' => 'blood_pressure', 'systolic' => 145, 'diastolic' => 92, 'status' => 'elevated', 'measured_at' => now()->subHours(2)],
            ['type' => 'blood_sugar', 'value' => 118, 'status' => 'normal', 'measured_at' => now()->subHours(3)],
            ['type' => 'heart_rate', 'value' => 78, 'status' => 'normal', 'measured_at' => now()->subHours(1)],
            ['type' => 'oxygen', 'value' => 97, 'status' => 'normal', 'measured_at' => now()->subMinutes(45)],
        ];

        foreach ($vitals as $payload) {
            VitalSign::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'type' => $payload['type'],
                    'measured_at' => $payload['measured_at'],
                ],
                array_merge($payload, [
                    'user_id' => $user->id,
                    'source' => 'manual',
                ])
            );
        }

        Notification::updateOrCreate(
            [
                'user_id' => $user->id,
                'title' => 'Welcome to Health Sync',
            ],
            [
                'type' => 'system',
                'message' => 'Demo data was added successfully. You can now test the dashboard and history screens.',
                'read' => false,
                'action_required' => false,
            ]
        );

        $analysisPayload = app(TempMockHealthInsightService::class)
            ->buildFromVitals($user->vitalSigns()->latest('measured_at')->get()->groupBy('type')->map->first()->values());

        AIAnalysis::updateOrCreate(
            ['user_id' => $user->id],
            $analysisPayload
        );
    }
}
