"use client";
import {Toast} from "@heroui/react";
import {useState} from "react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";

const RootProvider = ({children}) => {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000,
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );
    return <>
        <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools/>
            <Toast.Provider/>
            {children}
        </QueryClientProvider>
    </>
}

export default RootProvider
