<?php

namespace App\Notifications;

use App\Models\Donation;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DonationClaimed extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Donation $donation,
        public User $volunteer
    ) {}

    public function via($notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your Donation Has Been Claimed')
            ->line("Your donation '{$this->donation->title}' has been claimed!")
            ->line("Volunteer: {$this->volunteer->name}")
            ->line("Pickup Code: {$this->donation->pickup_code}")
            ->line('Please share this code when the volunteer arrives.');
    }

    public function toArray($notifiable): array
    {
        return [
            'donation_id' => $this->donation->id,
            'donation_title' => $this->donation->title,
            'volunteer_name' => $this->volunteer->name,
            'pickup_code' => $this->donation->pickup_code,
            'message' => "Your donation has been claimed by {$this->volunteer->name}",
        ];
    }
}
