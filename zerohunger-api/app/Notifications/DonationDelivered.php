<?php

namespace App\Notifications;

use App\Models\Donation;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DonationDelivered extends Notification implements ShouldQueue
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
            ->subject('Donation Delivered Successfully!')
            ->line("Your donation '{$this->donation->title}' has been delivered!")
            ->line("Volunteer: {$this->volunteer->name}")
            ->line("Thank you for fighting hunger and reducing food waste!");
    }

    public function toArray($notifiable): array
    {
        return [
            'donation_id' => $this->donation->id,
            'donation_title' => $this->donation->title,
            'volunteer_name' => $this->volunteer->name,
            'message' => "Your donation has been delivered by {$this->volunteer->name}",
        ];
    }
}
