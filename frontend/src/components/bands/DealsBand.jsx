"use client"
import { Percent } from "lucide-react";
import BaseBand from "@/components/bands/BaseBand";
import {useHome} from "@/queries/inventory";


export default function DealsBand() {
    const { data, isLoading } = useHome();

    const maxDiscount = data?.stats?.max_discount ?? 0;

    return (
        <BaseBand
            isLoading={isLoading}
            darkImage="/banner-deals.jpg"
            lightImage="/banner-deals.jpg"
            objectPosition="right"

            badge={`Save up to ${maxDiscount}%`}
            badgeIcon={Percent}

            title={
                <>
                    quality supplies
                    <br />
                    for real research
                </>
            }

            description="The biggest price drops in the shop right now, while stock lasts."

            href="/products?discounted=true&min_discount=1"
            linkText="See every deal"
        />
    );
}

