import dynamic from "next/dynamic";

import { DonationMapSkeleton } from "./MapSkeleton";
import type { DonationMapProps } from "./DonationMapClient";

const DonationMapClient = dynamic<DonationMapProps>(
    () => import("./DonationMapClient").then((mod) => mod.DonationMapClient),
    {
        ssr: false,
        loading: () => <DonationMapSkeleton height="500px" />,
    }
);

export function DonationMap(props: DonationMapProps) {
    return <DonationMapClient {...props} />;
}

export type { DonationMapProps } from "./DonationMapClient";

export default DonationMap;
