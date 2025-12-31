<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\GeoService;

class GeoServiceTest extends TestCase
{
    protected GeoService $geoService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->geoService = new GeoService();
    }

    public function test_calculate_distance_between_two_points(): void
    {
        // Cairo to Alexandria ≈ 179 km
        $distance = $this->geoService->calculateDistance(
            30.0444, 31.2357,
            31.2001, 29.9187
        );

        $this->assertGreaterThan(175, $distance);
        $this->assertLessThan(185, $distance);
    }

    public function test_same_point_distance_is_zero(): void
    {
        $distance = $this->geoService->calculateDistance(
            30.0444, 31.2357,
            30.0444, 31.2357
        );

        $this->assertEquals(0, $distance);
    }

    public function test_earth_radius_constant(): void
    {
        $this->assertEquals(GeoService::EARTH_RADIUS_KM, 6371.0);
    }
}
