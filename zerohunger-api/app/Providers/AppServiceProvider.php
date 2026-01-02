<?php

namespace App\Providers;

use App\Services\GeoService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register GeoService as singleton
        $this->app->singleton(GeoService::class, function ($app) {
            return new GeoService();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
