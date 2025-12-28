import { DonationGridSkeleton, StatsGridSkeleton } from "@/components/ui/skeletons";
import { Shimmer } from "@/components/ui/motion-system";
import { BreathingContainer } from "@/components/ui/skeletons";

/**
 * Donations Page Loading State
 * 
 * Displays skeleton for the donor's donations management page.
 */
export default function DonationsLoading() {
    return (
        <div className="container py-6 space-y-6">
            {/* Header with action button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <BreathingContainer>
                    <Shimmer height="2rem" width="10rem" rounded="md" />
                </BreathingContainer>
                <BreathingContainer delay={0.1}>
                    <Shimmer height="2.5rem" width="10rem" rounded="md" />
                </BreathingContainer>
            </div>

            {/* Stats */}
            <StatsGridSkeleton count={4} />

            {/* Tabs */}
            <div className="flex gap-2 border-b pb-2">
                {["Active", "Claimed", "Completed", "Expired"].map((_, i) => (
                    <BreathingContainer key={i} delay={0.3 + i * 0.05}>
                        <Shimmer height="2rem" width="5rem" rounded="md" />
                    </BreathingContainer>
                ))}
            </div>

            {/* Donations grid */}
            <DonationGridSkeleton count={6} />
        </div>
    );
}
