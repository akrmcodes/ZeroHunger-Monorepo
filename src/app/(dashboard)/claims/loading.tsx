import { ClaimsListSkeleton, StatsGridSkeleton } from "@/components/ui/skeletons";
import { Shimmer } from "@/components/ui/motion-system";
import { BreathingContainer } from "@/components/ui/skeletons";

/**
 * Claims Page Loading State
 * 
 * Displays skeleton stats and list matching the claims layout.
 */
export default function ClaimsLoading() {
    return (
        <div className="container py-6 space-y-6">
            {/* Header */}
            <BreathingContainer>
                <Shimmer height="2rem" width="8rem" rounded="md" />
            </BreathingContainer>

            {/* Stats */}
            <StatsGridSkeleton count={4} />

            {/* Tabs skeleton */}
            <div className="flex gap-2 border-b pb-2">
                {["All", "Pending", "In Progress", "Completed"].map((_, i) => (
                    <BreathingContainer key={i} delay={0.3 + i * 0.05}>
                        <Shimmer height="2rem" width="5rem" rounded="md" />
                    </BreathingContainer>
                ))}
            </div>

            {/* Claims list */}
            <ClaimsListSkeleton count={5} />
        </div>
    );
}
