<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\{User, Donation};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

class DonationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::create(['name' => 'donor', 'guard_name' => 'web']);
        Role::create(['name' => 'volunteer', 'guard_name' => 'web']);
    }

    public function test_can_list_donations(): void
    {
        $donor = User::factory()->create();
        $donor->assignRole('donor');
        Donation::factory()->count(3)->create(['donor_id' => $donor->id]);

        $volunteer = User::factory()->create();
        $volunteer->assignRole('volunteer');
        $token = $volunteer->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
                         ->getJson('/api/v1/donations');

        $response->assertStatus(200)
                 ->assertJsonCount(3, 'data');
    }

    public function test_donor_can_create_donation(): void
    {
        $donor = User::factory()->create();
        $donor->assignRole('donor');
        $token = $donor->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
                         ->postJson('/api/v1/donations', [
                             'title' => 'Test Donation',
                             'description' => 'Test Description',
                             'quantity_kg' => 10.5,
                             'latitude' => 30.0444,
                             'longitude' => 31.2357,
                         ]);

        $response->assertStatus(201)
                 ->assertJsonFragment(['title' => 'Test Donation']);

        $this->assertDatabaseHas('donations', [
            'title' => 'Test Donation',
            'donor_id' => $donor->id,
        ]);
    }

    public function test_volunteer_cannot_create_donation(): void
    {
        $volunteer = User::factory()->create();
        $volunteer->assignRole('volunteer');
        $token = $volunteer->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
                         ->postJson('/api/v1/donations', [
                             'title' => 'Test Donation',
                             'quantity_kg' => 10.5,
                             'latitude' => 30.0444,
                             'longitude' => 31.2357,
                         ]);

        $response->assertStatus(403);
    }

    public function test_volunteer_can_claim_donation(): void
    {
        $donor = User::factory()->create();
        $donor->assignRole('donor');
        $donation = Donation::factory()->create([
            'donor_id' => $donor->id,
            'status' => 'available'
        ]);
        
        $volunteer = User::factory()->create();
        $volunteer->assignRole('volunteer');
        $token = $volunteer->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
                         ->postJson("/api/v1/donations/{$donation->id}/claim");

        $response->assertStatus(200)
                 ->assertJsonStructure(['message', 'donation', 'pickup_code']);

        $donation->refresh();
        $this->assertEquals('reserved', $donation->status);
        $this->assertNotNull($donation->pickup_code);
    }

    public function test_donation_cannot_be_claimed_twice(): void
    {
        $donor = User::factory()->create();
        $donor->assignRole('donor');
        $donation = Donation::factory()->create([
            'donor_id' => $donor->id,
            'status' => 'reserved' // Already claimed
        ]);
        
        $volunteer = User::factory()->create();
        $volunteer->assignRole('volunteer');
        $token = $volunteer->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
                         ->postJson("/api/v1/donations/{$donation->id}/claim");

        $response->assertStatus(409); // Conflict
    }
}
