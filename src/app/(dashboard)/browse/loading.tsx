import { DonationGridSkeleton } from "@/components/ui/skeletons";
import { Shimmer } from "@/components/ui/motion-system";
import { BreathingContainer } from "@/components/ui/skeletons";

/**
 * Browse Page Loading State
 * 
 * Displays a skeleton grid matching the browse donations layout.
 */
export default function BrowseLoading() {
    return (
        <div className="container py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <BreathingContainer>
                    <Shimmer height="2rem" width="10rem" rounded="md" />
                </BreathingContainer>
                <BreathingContainer delay={0.1}>
                    <Shimmer height="2.5rem" width="12rem" rounded="md" />
                </BreathingContainer>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                {Array.from({ length: 4 }).map((_, i) => (
                    <BreathingContainer key={i} delay={0.15 + i * 0.05}>
                        <Shimmer height="2.25rem" width="6rem" rounded="full" />
                    </BreathingContainer>
                ))}
            </div>

            {/* Grid */}
            <DonationGridSkeleton count={9} />
        </div>
    );
}
