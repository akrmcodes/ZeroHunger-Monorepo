<?php

namespace Database\Seeders;

use App\Models\Donation;
use App\Models\User;
use Illuminate\Database\Seeder;

class DonationSeeder extends Seeder
{
    public function run(): void
    {
        $donors = User::role('donor')->get();

        if ($donors->isEmpty()) {
            $this->command->warn('No donors found. Run UserSeeder first.');
            return;
        }

        $donations = [
            [
                'title' => 'Fresh Bread from Bakery',
                'description' => '20 loaves of fresh whole wheat bread, baked this morning',
                'quantity_kg' => 5.0,
                'latitude' => 30.0444,
                'longitude' => 31.2357,
                'expires_at' => now()->addHours(6),
            ],
            [
                'title' => 'Restaurant Surplus Meals',
                'description' => 'Cooked rice and vegetables, properly packaged',
                'quantity_kg' => 15.5,
                'latitude' => 30.0500,
                'longitude' => 31.2400,
                'expires_at' => now()->addHours(4),
            ],
            [
                'title' => 'Fresh Fruits and Vegetables',
                'description' => 'Apples, oranges, tomatoes, and cucumbers',
                'quantity_kg' => 12.0,
                'latitude' => 30.0600,
                'longitude' => 31.2500,
                'expires_at' => now()->addDays(2),
            ],
            [
                'title' => 'Canned Goods',
                'description' => 'Assorted canned beans, soup, and vegetables',
                'quantity_kg' => 8.0,
                'latitude' => 30.0400,
                'longitude' => 31.2300,
                'expires_at' => null,
            ],
            [
                'title' => 'Dairy Products',
                'description' => 'Milk, cheese, and yogurt from supermarket',
                'quantity_kg' => 6.5,
                'latitude' => 30.0550,
                'longitude' => 31.2450,
                'expires_at' => now()->addHours(12),
            ],
            [
                'title' => 'Pastries and Desserts',
                'description' => 'Cakes and pastries from bakery closing',
                'quantity_kg' => 4.0,
                'latitude' => 30.0350,
                'longitude' => 31.2250,
                'expires_at' => now()->addHours(8),
            ],
            [
                'title' => 'Packaged Snacks',
                'description' => 'Chips, crackers, and cookies - all sealed',
                'quantity_kg' => 10.0,
                'latitude' => 30.0650,
                'longitude' => 31.2550,
                'expires_at' => now()->addMonth(),
            ],
            [
                'title' => 'Prepared Sandwiches',
                'description' => 'Fresh sandwiches from cafe',
                'quantity_kg' => 3.5,
                'latitude' => 30.0250,
                'longitude' => 31.2150,
                'expires_at' => now()->addHours(3),
            ],
        ];

        foreach ($donations as $donationData) {
            Donation::create(array_merge($donationData, [
                'donor_id' => $donors->random()->id,
                'status' => 'available',
            ]));
        }

        $this->command->info('Sample donations created successfully!');
    }
}
