import { ProfileSkeleton } from "@/components/ui/skeletons";

/**
 * Profile Page Loading State
 * 
 * Displays skeleton matching the profile layout.
 */
export default function ProfileLoading() {
    return (
        <div className="container py-6">
            <ProfileSkeleton />
        </div>
    );
}
