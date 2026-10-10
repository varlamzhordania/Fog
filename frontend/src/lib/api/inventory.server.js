import {cache} from "react";
import {serverFetch} from "@/lib/api/server";
import {API_ENDPOINTS} from "@/lib/config";

export const getProduct = cache((slug) =>
    serverFetch(API_ENDPOINTS.inventory.productDetail(slug), {
        cache: "force-cache",
        nextOptions: {revalidate: 30},
    })
);