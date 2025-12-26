<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DonationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'quantity_kg' => (float) $this->quantity_kg,
            'status' => $this->status,
            'pickup_code' => $this->when(
                $request->user()?->id === $this->donor_id || 
                $request->user()?->id === $this->claim?->volunteer_id,
                $this->pickup_code
            ),
            'latitude' => (float) $this->latitude,
            'longitude' => (float) $this->longitude,
            'expires_at' => $this->expires_at?->toISOString(),
            'is_expired' => $this->isExpired(),
            'is_available' => $this->isAvailable(),
            
            // Relationships
            'donor' => new UserResource($this->whenLoaded('donor')),
            'claim' => new ClaimResource($this->whenLoaded('claim')),
            
            // Distance (if calculated)
            'distance' => $this->when(isset($this->distance), $this->distance),
            
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
