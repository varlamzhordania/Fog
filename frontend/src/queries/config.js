import {useQuery} from "@tanstack/react-query";
import {API_ENDPOINTS} from "@/lib/config";
import apiClient from "@/lib/api/client";

export const configQueryKey = ["fog_config"];

async function fetchConfig() {
    const response = await apiClient.get(
        API_ENDPOINTS.website.config
    );

    return response.data;
}

export function useConfig() {
    return useQuery({
        queryKey: configQueryKey,
        queryFn: fetchConfig,
        staleTime: 15 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}