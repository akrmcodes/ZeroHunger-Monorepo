<?php

namespace Database\Factories;

use App\Models\Donation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Donation>
 */
class DonationFactory extends Factory
{
    protected $model = Donation::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'donor_id' => User::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'quantity_kg' => fake()->randomFloat(2, 0.5, 50),
            'latitude' => fake()->latitude(29.5, 31.5), // Around Egypt
            'longitude' => fake()->longitude(29.5, 32.5),
            'status' => 'available',
            'pickup_code' => null,
            'expires_at' => fake()->dateTimeBetween('now', '+7 days'),
        ];
    }

    /**
     * Indicate that the donation is available.
     */
    public function available(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'available',
        ]);
    }

    /**
     * Indicate that the donation is reserved.
     */
    public function reserved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'reserved',
            'pickup_code' => str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT),
        ]);
    }
}
