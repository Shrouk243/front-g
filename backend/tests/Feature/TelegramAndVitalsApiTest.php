<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TelegramAndVitalsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_manual_vital_reading_creates_alert_and_recommendation(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/vitals', [
            'type' => 'blood_pressure',
            'systolic' => 182,
            'diastolic' => 121,
            'measured_at' => now()->toISOString(),
            'source' => 'manual',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.type', 'blood_pressure')
            ->assertJsonPath('data.status', 'critical')
            ->assertJsonPath('alert_created', true);

        $this->assertDatabaseCount('vital_signs', 1);
        $this->assertDatabaseCount('notifications', 1);
        $this->assertNotNull($user->fresh()->latest_recommendation);

        $summaryResponse = $this->getJson('/api/summary/today');

        $summaryResponse
            ->assertOk()
            ->assertJsonPath('data.readings_count', 1)
            ->assertJsonPath('data.alerts_count', 1);
    }

    public function test_dashboard_returns_blood_pressure_fields_needed_by_vital_cards(): void
    {
        $user = User::factory()->create();

        $user->vitalSigns()->create([
            'type' => 'blood_pressure',
            'systolic' => 182,
            'diastolic' => 121,
            'status' => 'critical',
            'measured_at' => now(),
            'source' => 'manual',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/dashboard');

        $response
            ->assertOk()
            ->assertJsonPath('current_vitals.0.value', '182/121')
            ->assertJsonPath('current_vitals.0.systolic', 182)
            ->assertJsonPath('current_vitals.0.diastolic', 121)
            ->assertJsonPath('recent_vitals.0.systolic', 182)
            ->assertJsonPath('recent_vitals.0.diastolic', 121);
    }

    public function test_manual_vital_reading_still_succeeds_when_telegram_delivery_fails(): void
    {
        config([
            'services.telegram.bot_token' => 'test-token',
        ]);

        Http::fake([
            'https://api.telegram.org/*' => Http::response(['ok' => false], 500),
        ]);

        $user = User::factory()->create([
            'telegram_chat_id' => '998877',
            'telegram_alerts_enabled' => true,
            'telegram_recommendations_enabled' => true,
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/vitals', [
            'type' => 'blood_pressure',
            'systolic' => 182,
            'diastolic' => 121,
            'measured_at' => now()->toISOString(),
            'source' => 'manual',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.type', 'blood_pressure')
            ->assertJsonPath('alert_created', true);

        $this->assertDatabaseCount('vital_signs', 1);
        $this->assertDatabaseCount('notifications', 1);
        Http::assertSentCount(2);
    }

    public function test_connect_token_links_user_when_bot_receives_start_command(): void
    {
        config([
            'services.telegram.bot_token' => 'test-token',
            'services.telegram.bot_username' => 'healthsync_test_bot',
            'services.telegram.frontend_app_url' => 'http://localhost:5173',
        ]);

        Http::fake([
            'https://api.telegram.org/*' => Http::response(['ok' => true, 'result' => []], 200),
        ]);

        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $tokenResponse = $this->postJson('/api/telegram/connect-token');
        $token = $tokenResponse->json('data.token');

        $this->postJson('/api/telegram/webhook', [
            'update_id' => 1,
            'message' => [
                'message_id' => 11,
                'text' => '/start '.$token,
                'chat' => ['id' => 998877],
                'from' => ['id' => 998877, 'username' => 'linked_user'],
            ],
        ])->assertOk();

        $this->assertSame('998877', $user->fresh()->telegram_chat_id);
        $this->assertSame('linked_user', $user->fresh()->telegram_username);
        Http::assertSentCount(1);
    }

    public function test_test_message_succeeds_without_invalid_web_app_button(): void
    {
        config([
            'services.telegram.bot_token' => 'test-token',
            'services.telegram.frontend_app_url' => 'http://localhost:5000',
        ]);

        Http::fake([
            'https://api.telegram.org/*' => Http::response(['ok' => true, 'result' => []], 200),
        ]);

        $user = User::factory()->create([
            'telegram_chat_id' => '998877',
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/telegram/test-message');

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Test message sent successfully.');

        Http::assertSent(function ($request) {
            $replyMarkup = $request['reply_markup'];

            foreach ($replyMarkup['keyboard'] as $row) {
                foreach ($row as $button) {
                    if (isset($button['web_app'])) {
                        return false;
                    }
                }
            }

            return Str::endsWith($request->url(), '/sendMessage');
        });
    }

    public function test_test_message_returns_failure_when_telegram_rejects_delivery(): void
    {
        config([
            'services.telegram.bot_token' => 'test-token',
            'services.telegram.frontend_app_url' => 'https://example.com',
        ]);

        Http::fake([
            'https://api.telegram.org/*' => Http::response([
                'ok' => false,
                'error_code' => 400,
                'description' => 'Bad Request: chat not found',
            ], 400),
        ]);

        $user = User::factory()->create([
            'telegram_chat_id' => '998877',
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/telegram/test-message');

        $response
            ->assertStatus(422)
            ->assertJsonPath('message', 'Telegram could not deliver the message: Bad Request: chat not found');
    }

    public function test_bot_quick_commands_return_latest_values_for_linked_user(): void
    {
        config([
            'services.telegram.bot_token' => 'test-token',
            'services.telegram.frontend_app_url' => 'http://localhost:5000',
        ]);

        Http::fake([
            'https://api.telegram.org/*' => Http::response(['ok' => true, 'result' => []], 200),
        ]);

        $user = User::factory()->create([
            'telegram_chat_id' => '998877',
            'latest_recommendation' => 'Drink more water today.',
        ]);

        $user->vitalSigns()->create([
            'type' => 'heart_rate',
            'value' => 88,
            'status' => 'normal',
            'measured_at' => now(),
            'source' => 'manual',
        ]);

        $this->postJson('/api/telegram/webhook', [
            'update_id' => 2,
            'message' => [
                'message_id' => 12,
                'text' => 'Last Heart Rate',
                'chat' => ['id' => 998877],
                'from' => ['id' => 998877, 'username' => 'linked_user'],
            ],
        ])->assertOk();

        Http::assertSent(function ($request) {
            return Str::endsWith($request->url(), '/sendMessage')
                && str_contains((string) $request['text'], 'Latest Heart Rate')
                && str_contains((string) $request['text'], '88 bpm');
        });
    }

    public function test_poll_command_runs_one_batch_of_updates(): void
    {
        config([
            'services.telegram.bot_token' => 'test-token',
        ]);

        Http::fake([
            'https://api.telegram.org/*' => Http::response(['ok' => true, 'result' => []], 200),
        ]);

        $this->artisan('telegram:poll --once')
            ->assertExitCode(0);
    }
}
