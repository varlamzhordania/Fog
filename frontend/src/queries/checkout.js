import {useMutation, useQuery} from "@tanstack/react-query";
import {fetchCart} from "@/lib/api/checkout";
import {useAuthStore} from "@/stores/auth";
import {authFetch} from "@/queries/auth";

export function useCart() {
    return useQuery({
        queryKey: ["checkout", "cart"],
        queryFn: () => fetchCart(),
        retry: false,
    });
}

export function useAddItem() {
    const setAuth = useAuthStore((s) => s.setAuth);

    return useMutation({
        mutationFn: ({email, password}) =>
            authFetch("/api/auth/login", {email, password}),

        onSuccess: ({access_token, user}) => {
            setAuth({access_token, user});
        },
    });
}
