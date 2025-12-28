import { DashboardPageSkeleton } from "@/components/ui/skeletons";

/**
 * Dashboard Loading State
 * 
 * This component is automatically rendered by Next.js App Router
 * while the dashboard page is loading.
 * 
 * Uses the motion-system's physics for smooth entrance animations.
 */
export default function DashboardLoading() {
    return (
        <div className="container py-6">
            <DashboardPageSkeleton />
        </div>
    );
}
