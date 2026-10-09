import {cache} from "react";
import {serverFetch} from "@/lib/api/server";
import {API_ENDPOINTS} from "@/lib/config";

export const getSiteConfig = cache(async () => {
    try {
        const res = await serverFetch(API_ENDPOINTS.website.config, {
            cache: "force-cache",
            nextOptions: {revalidate: 300},
        });
        return res?.data || res || null;
    } catch (err) {
        console.error("Failed to fetch site config:", err);
        return null;
    }
});