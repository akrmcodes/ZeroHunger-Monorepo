<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('donations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('donor_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('quantity_kg', 8, 2);
            $table->enum('status', [
                'available',
                'reserved',
                'picked_up',
                'delivered',
                'expired',
                'cancelled'
            ])->default('available');
            $table->string('pickup_code', 6)->nullable();
            $table->string('delivery_code', 6)->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            // Indexes for API performance
            $table->index('donor_id');
            $table->index('status');
            $table->index(['latitude', 'longitude']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('donations');
    }
};
