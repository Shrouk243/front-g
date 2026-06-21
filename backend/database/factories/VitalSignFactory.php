<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\VitalSign;
use Illuminate\Database\Eloquent\Factories\Factory;

class VitalSignFactory extends Factory
{
    protected $model = VitalSign::class;

    public function definition(): array
    {
        $type = $this->faker->randomElement(['blood_pressure', 'blood_sugar', 'heart_rate', 'oxygen']);

        return [
            'user_id' => User::factory(),
            'type' => $type,
            'value' => $type === 'blood_pressure' ? null : $this->faker->randomFloat(2, 60, 150),
            'systolic' => $type === 'blood_pressure' ? $this->faker->numberBetween(110, 140) : null,
            'diastolic' => $type === 'blood_pressure' ? $this->faker->numberBetween(70, 90) : null,
            'status' => $this->faker->randomElement(['normal', 'elevated', 'critical']),
            'source' => 'manual',
            'measured_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
        ];
    }
}
