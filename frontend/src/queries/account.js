import {useQuery} from "@tanstack/react-query";
import {fetchAddresses} from "@/lib/api/account";
import {useAuthStore} from "@/stores/auth";

export function useAddresses() {
    const loggedIn = useAuthStore((s) => s.logged_in);
    return useQuery({
        queryKey: ["account", "addresses"],
        queryFn: () => fetchAddresses({pagination: false}),
        enabled: loggedIn,
    });
}