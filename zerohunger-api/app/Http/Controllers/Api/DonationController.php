<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DonationResource;
use App\Models\Donation;
use App\Models\Claim;
use App\Notifications\DonationClaimed;
use App\Jobs\ProcessImpactScore;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DonationController extends Controller
{
    /**
     * List all available donations
     */
    public function index(Request $request)
    {
        $query = Donation::with('donor')
            ->where('status', 'available');

        // Filter by expiry
        $query->where(function($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', now());
        });

        // Order by created_at descending
        $donations = $query->latest()->get();

        return DonationResource::collection($donations);
    }

    /**
     * Get single donation
     */
    public function show(Donation $donation)
    {
        $donation->load('donor', 'claim.volunteer');
        
        return new DonationResource($donation);
    }

    /**
     * Create new donation (donors only)
     */
    public function store(Request $request)
    {
        // Check user is donor
        if (!$request->user()->hasRole('donor')) {
            return response()->json([
                'message' => 'Only donors can create donations',
            ], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'quantity_kg' => 'required|numeric|min:0.1|max:1000',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'expires_at' => 'nullable|date|after:now',
        ]);

        $donation = Donation::create([
            'donor_id' => $request->user()->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'quantity_kg' => $validated['quantity_kg'],
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'expires_at' => $validated['expires_at'] ?? null,
            'status' => 'available',
        ]);

        $donation->load('donor');

        return (new DonationResource($donation))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Claim a donation (volunteers only)
     */
    public function claim(Request $request, Donation $donation)
    {
        // Check user is volunteer
        if (!$request->user()->hasRole('volunteer')) {
            return response()->json([
                'message' => 'Only volunteers can claim donations',
            ], 403);
        }

        // Use database transaction with lock for race condition protection
        try {
            DB::beginTransaction();

            // Lock the donation row for update
            $donation = Donation::where('id', $donation->id)
                ->lockForUpdate()
                ->first();

            // Check if donation is available
            if ($donation->status !== 'available') {
                DB::rollBack();
                return response()->json([
                    'message' => 'This donation is no longer available',
                ], 409); // Conflict
            }

            // Check if already claimed by this volunteer
            $existingClaim = Claim::where('donation_id', $donation->id)
                ->where('volunteer_id', $request->user()->id)
                ->first();

            if ($existingClaim) {
                DB::rollBack();
                return response()->json([
                    'message' => 'You have already claimed this donation',
                ], 409);
            }

            // Generate pickup code
            $pickupCode = Donation::generateCode();

            // Update donation status
            $donation->update([
                'status' => 'reserved',
                'pickup_code' => $pickupCode,
            ]);

            // Create claim
            $claim = Claim::create([
                'donation_id' => $donation->id,
                'volunteer_id' => $request->user()->id,
                'status' => 'active',
            ]);

            DB::commit();

            // Send notification to donor
            $donation->donor->notify(new DonationClaimed($donation, $request->user()));

            // Award points to volunteer for claiming
            ProcessImpactScore::dispatch($request->user(), $donation->quantity_kg, 'claim');

            // Load relationships for response
            $donation->load('donor', 'claim.volunteer');

            return response()->json([
                'message' => 'Donation claimed successfully',
                'donation' => new DonationResource($donation),
                'pickup_code' => $pickupCode,
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Failed to claim donation',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get donor's donations
     */
    public function myDonations(Request $request)
    {
        $donations = Donation::with('donor', 'claim.volunteer')
            ->where('donor_id', $request->user()->id)
            ->latest()
            ->get();

        return DonationResource::collection($donations);
    }

    /**
     * Update donation (donor only, cannot update if claimed)
     */
    public function update(Request $request, Donation $donation)
    {
        // Check ownership
        if ($donation->donor_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Cannot update if claimed
        if ($donation->status !== 'available') {
            return response()->json([
                'message' => 'Cannot update donation that has already been claimed',
            ], 409);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'quantity_kg' => 'sometimes|numeric|min:0.1|max:1000',
            'expires_at' => 'sometimes|nullable|date|after:now',
        ]);

        $donation->update($validated);
        $donation->load('donor');

        return new DonationResource($donation);
    }

    /**
     * Delete donation (donor only, cannot delete if claimed)
     */
    public function destroy(Donation $donation)
    {
        // Check ownership
        if ($donation->donor_id !== auth()->id()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Cannot delete if claimed
        if ($donation->status !== 'available') {
            return response()->json([
                'message' => 'Cannot delete donation that has been claimed',
            ], 409);
        }

        $donation->delete();

        return response()->json([
            'message' => 'Donation deleted successfully',
        ], 200);
    }
}
