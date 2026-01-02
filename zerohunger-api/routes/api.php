<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClaimController;
use App\Http\Controllers\Api\DonationController;
use App\Http\Resources\DonationResource;
use App\Services\GeoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Health check (public)
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'ZeroHunger API is running',
        'timestamp' => now()->toDateTimeString(),
        'version' => '1.0.0',
    ]);
});

// API v1 routes
Route::prefix('v1')->group(function () {
    
    // Public authentication routes
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    
    // Protected routes (require authentication)
    Route::middleware('auth:sanctum')->group(function () {
        
        // Auth endpoints
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        
        // Donation endpoints
        Route::get('/donations', [DonationController::class, 'index']);
        Route::get('/donations/{donation}', [DonationController::class, 'show']);
        Route::post('/donations', [DonationController::class, 'store']);
        Route::put('/donations/{donation}', [DonationController::class, 'update']);
        Route::delete('/donations/{donation}', [DonationController::class, 'destroy']);
        Route::post('/donations/{donation}/claim', [DonationController::class, 'claim']);
        Route::get('/my-donations', [DonationController::class, 'myDonations']);
        
        // Claim endpoints
        Route::get('/claims', [ClaimController::class, 'index']);
        Route::post('/claims/{claim}/pickup', [ClaimController::class, 'markPickedUp']);
        Route::post('/claims/{claim}/deliver', [ClaimController::class, 'markDelivered']);
        Route::delete('/claims/{claim}', [ClaimController::class, 'cancel']);
        
        // GeoLocation endpoint
        Route::get('/donations/nearby', function (GeoService $geoService, Request $request) {
            $latitude = $request->query('latitude');
            $longitude = $request->query('longitude');
            $radius = $request->query('radius', 10);

            if (!$latitude || !$longitude) {
                return response()->json([
                    'message' => 'Latitude and longitude are required',
                ], 400);
            }

            $donations = $geoService->getDonationsWithinRadius(
                (float) $latitude,
                (float) $longitude,
                (int) $radius
            );

            return DonationResource::collection($donations);
        });
        
        // Notification endpoints
        Route::get('/notifications', function (Request $request) {
            return $request->user()
                ->notifications()
                ->latest()
                ->take(20)
                ->get();
        });

        Route::post('/notifications/{id}/read', function (Request $request, $id) {
            $notification = $request->user()->notifications()->findOrFail($id);
            $notification->markAsRead();
            return response()->json(['message' => 'Marked as read']);
        });

        Route::post('/notifications/read-all', function (Request $request) {
            $request->user()->unreadNotifications->markAsRead();
            return response()->json(['message' => 'All notifications marked as read']);
        });
    });
});
