import { cn } from "@/lib/utils";

type ActivityItem = {
    title: string;
    time: string;
};

type Tone = "emerald" | "blue" | "orange" | "slate";

type ActivityListProps = {
    items: ActivityItem[];
    emptyMessage?: string;
    tone?: Tone;
    className?: string;
};

const toneClasses: Record<Tone, string> = {
    emerald: "border-emerald-50 bg-emerald-50/60",
    blue: "border-blue-50 bg-blue-50/60",
    orange: "border-orange-50 bg-orange-50/60",
    slate: "border-slate-100 bg-slate-50",
};

export function ActivityList({ items, emptyMessage = "No activity yet.", tone = "slate", className }: ActivityListProps) {
    if (items.length === 0) {
        return <p className="text-sm text-slate-500">{emptyMessage}</p>;
    }

    const toneClass = toneClasses[tone];

    return (
        <div className={cn("space-y-3", className)}>
            {items.map((activity) => (
                <div
                    key={activity.title}
                    className={cn(
                        "flex items-center justify-between rounded-lg border px-3 py-2 text-sm",
                        toneClass,
                        "text-slate-800",
                    )}
                >
                    <p className="font-medium">{activity.title}</p>
                    <span className="text-xs text-slate-500">{activity.time}</span>
                </div>
            ))}
        </div>
    );
}

export default ActivityList;
