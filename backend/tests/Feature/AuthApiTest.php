<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_with_invalid_credentials_returns_auth_message(): void
    {
        User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'wrong-password',
        ]);

        $response
            ->assertStatus(401)
            ->assertJsonPath('message', 'Invalid email or password.');
    }

    public function test_register_requires_matching_password_confirmation(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'different-password',
            'phone_country_code' => '+20',
            'phone_number' => '1234567890',
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_register_rejects_invalid_phone_number(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone_country_code' => '+20',
            'phone_number' => 'abc123',
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['phone_number']);
    }

    public function test_register_succeeds_with_valid_payload(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone_country_code' => '+20',
            'phone_number' => '1234567890',
        ]);

        $response
            ->assertCreated()
            ->assertJsonStructure(['access_token', 'token_type', 'user']);
    }

    public function test_authenticated_user_can_access_me_endpoint_with_api_throttle(): void
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/me');

        $response
            ->assertOk()
            ->assertJsonPath('user.email', 'test@example.com');
    }

    public function test_profile_update_persists_name_height_weight_and_conditions(): void
    {
        $user = User::create([
            'name' => 'Old Name',
            'email' => 'test@example.com',
            'password' => 'password123',
            'chronic_conditions' => ['none'],
        ]);

        Sanctum::actingAs($user);

        $response = $this->patchJson('/api/profile', [
            'name' => 'Updated Name',
            'height_cm' => 181,
            'weight_kg' => 83,
            'chronic_conditions' => ['hypertension', 'heart'],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('user.name', 'Updated Name')
            ->assertJsonPath('user.height_cm', 181)
            ->assertJsonPath('user.weight_kg', 83)
            ->assertJsonPath('user.chronic_conditions.0', 'hypertension');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
            'height_cm' => 181,
            'weight_kg' => 83,
        ]);
    }
}
