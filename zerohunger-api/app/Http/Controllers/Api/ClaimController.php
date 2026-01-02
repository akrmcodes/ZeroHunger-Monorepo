<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClaimResource;
use App\Models\Claim;
use App\Notifications\DonationDelivered;
use App\Jobs\ProcessImpactScore;
use Illuminate\Http\Request;

class ClaimController extends Controller
{
    /**
     * Get volunteer's claims
     */
    public function index(Request $request)
    {
        $claims = Claim::with('donation.donor', 'volunteer')
            ->where('volunteer_id', $request->user()->id)
            ->latest()
            ->get();

        return ClaimResource::collection($claims);
    }

    /**
     * Mark claim as picked up (requires pickup code)
     */
    public function markPickedUp(Request $request, Claim $claim)
    {
        // Verify ownership
        if ($claim->volunteer_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Verify claim status
        if ($claim->status !== 'active') {
            return response()->json([
                'message' => 'This claim cannot be marked as picked up',
            ], 409);
        }

        // Validate pickup code
        $validated = $request->validate([
            'pickup_code' => 'required|string|size:6',
        ]);

        // Verify pickup code matches
        if ($claim->donation->pickup_code !== $validated['pickup_code']) {
            return response()->json([
                'message' => 'Invalid pickup code',
            ], 422);
        }

        // Mark as picked up
        $claim->markAsPickedUp();
        $claim->load('donation.donor', 'volunteer');

        return response()->json([
            'message' => 'Marked as picked up successfully',
            'claim' => new ClaimResource($claim),
        ], 200);
    }

    /**
     * Mark claim as delivered
     */
    public function markDelivered(Request $request, Claim $claim)
    {
        // Verify ownership
        if ($claim->volunteer_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Verify claim status
        if ($claim->status !== 'picked_up') {
            return response()->json([
                'message' => 'Donation must be picked up before marking as delivered',
            ], 409);
        }

        // Optional: Add notes
        $validated = $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        if (isset($validated['notes'])) {
            $claim->notes = $validated['notes'];
            $claim->save();
        }

        // Mark as delivered
        $claim->markAsDelivered();
        $claim->load('donation.donor', 'volunteer');

        // Send notification to donor
        $claim->donation->donor->notify(
            new DonationDelivered($claim->donation, $request->user())
        );

        // Award points for delivery (volunteer gets 2x, donor gets 1x)
        ProcessImpactScore::dispatch(
            $request->user(),
            $claim->donation->quantity_kg,
            'delivery'
        );

        ProcessImpactScore::dispatch(
            $claim->donation->donor,
            $claim->donation->quantity_kg,
            'donation'
        );

        return response()->json([
            'message' => 'Marked as delivered successfully! Thank you for your service.',
            'claim' => new ClaimResource($claim),
        ], 200);
    }

    /**
     * Cancel claim
     */
    public function cancel(Request $request, Claim $claim)
    {
        // Verify ownership
        if ($claim->volunteer_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Can only cancel active or picked_up claims
        if (!in_array($claim->status, ['active', 'picked_up'])) {
            return response()->json([
                'message' => 'This claim cannot be cancelled',
            ], 409);
        }

        $claim->cancel();

        return response()->json([
            'message' => 'Claim cancelled successfully',
        ], 200);
    }
}
