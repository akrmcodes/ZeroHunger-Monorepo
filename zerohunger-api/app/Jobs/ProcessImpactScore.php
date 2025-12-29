<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessImpactScore implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;

    public function __construct(
        public User $user,
        public float $quantityKg,
        public string $action = 'delivery'
    ) {}

    public function handle(): void
    {
        // Points: 1 per kg for donations, 2 per kg for deliveries
        $multiplier = $this->action === 'delivery' ? 2 : 1;
        $points = (int) ceil($this->quantityKg * $multiplier);

        $this->user->increment('impact_score', $points);

        Log::info('Impact score updated', [
            'user_id' => $this->user->id,
            'action' => $this->action,
            'points_added' => $points,
            'new_total' => $this->user->fresh()->impact_score,
        ]);
    }
}
