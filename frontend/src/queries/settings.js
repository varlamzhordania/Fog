import {useMutation, useQuery} from "@tanstack/react-query";
import {API_ENDPOINTS} from "@/lib/config";
import apiClient from "@/lib/api/client";
import {createContact} from "@/lib/api/settings";
import {configQueryKey} from "@/lib/queryKeys";


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

export function useCreateContact() {
    return useMutation({
        mutationFn: createContact,
    });
}