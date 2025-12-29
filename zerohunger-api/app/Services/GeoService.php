<?php

namespace App\Services;

use App\Models\Donation;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class GeoService
{
    /**
     * Earth's radius in kilometers
     */
    const EARTH_RADIUS_KM = 6371;

    /**
     * Get donations within a specific radius from a location
     */
    public function getDonationsWithinRadius(
        float $latitude,
        float $longitude,
        int $radiusKm = 10,
        string $status = 'available'
    ): Collection {
        // Haversine formula to calculate distance
        $haversine = sprintf(
            "(%s * acos(
                cos(radians(%f)) 
                * cos(radians(%s)) 
                * cos(radians(%s) - radians(%f)) 
                + sin(radians(%f)) 
                * sin(radians(%s))
            ))",
            self::EARTH_RADIUS_KM,
            $latitude,
            'latitude',
            'longitude',
            $longitude,
            $latitude,
            'latitude'
        );

        return Donation::select('*')
            ->selectRaw("{$haversine} AS distance")
            ->where('status', $status)
            ->having('distance', '<=', $radiusKm)
            ->orderBy('distance', 'asc')
            ->with('donor')
            ->get();
    }

    /**
     * Calculate distance between two coordinates in kilometers
     */
    public function calculateDistance(
        float $lat1,
        float $lon1,
        float $lat2,
        float $lon2
    ): float {
        // Convert to radians
        $latDiff = deg2rad($lat2 - $lat1);
        $lonDiff = deg2rad($lon2 - $lon1);

        // Haversine formula
        $a = sin($latDiff / 2) * sin($latDiff / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($lonDiff / 2) * sin($lonDiff / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return self::EARTH_RADIUS_KM * $c;
    }

    /**
     * Get nearest donations
     */
    public function getNearestDonations(
        float $userLatitude,
        float $userLongitude,
        int $limit = 10
    ): Collection {
        $haversine = sprintf(
            "(%s * acos(
                cos(radians(%f)) 
                * cos(radians(%s)) 
                * cos(radians(%s) - radians(%f)) 
                + sin(radians(%f)) 
                * sin(radians(%s))
            ))",
            self::EARTH_RADIUS_KM,
            $userLatitude,
            'latitude',
            'longitude',
            $userLongitude,
            $userLatitude,
            'latitude'
        );

        return Donation::select('*')
            ->selectRaw("{$haversine} AS distance")
            ->where('status', 'available')
            ->orderBy('distance', 'asc')
            ->limit($limit)
            ->with('donor')
            ->get();
    }
}
