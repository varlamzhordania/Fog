import {Microscope} from "lucide-react";

import BaseBand from "@/components/bands/BaseBand";


export default function ResearchBand() {
    const RESEARCH_URL = process.env.NEXT_PUBLIC_RESEARCH_URL;

    return (
        <BaseBand
            darkImage="/banner-research.jpg"
            lightImage="/banner-research.jpg"
            objectPosition="right"

            badge="FOG Research"
            badgeIcon={Microscope}

            title={
                <>
                    explore the
                    <br/>
                    hidden intelligence
                </>
            }

            description="Discover experiments, observations, and research exploring the hidden intelligence of fungi."

            href={RESEARCH_URL}
            linkText="Explore research"
        />
    );
}
