import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    createAddress,
    deleteAddress,
    fetchAccount,
    fetchAddresses,
    patchAddress,
    updateAccount,
} from "@/lib/api/account";
import {useAuthStore} from "@/stores/auth";

const addressesKey = ["account", "addresses"];
const profileKey = ["account", "profile"];

export function useAddresses() {
    const loggedIn = useAuthStore((s) => s.logged_in);
    return useQuery({
        queryKey: addressesKey,
        queryFn: () => fetchAddresses({pagination: false}),
        enabled: loggedIn,
    });
}

/**
 * Creates (no `id`) or partially updates (with `id`) an address.
 * The API does not clear the old default, so we do it here when `data.is_default` is true.
 * `addresses` is the list currently on screen.
 */
export function useSaveAddress() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({id, data, addresses = []}) => {
            if (data.is_default) {
                const others = addresses.filter((a) => a.is_default && a.id !== id);
                await Promise.all(others.map((a) => patchAddress(a.id, {is_default: false})));
            }
            return id ? patchAddress(id, data) : createAddress(data);
        },
        onSuccess: () => qc.invalidateQueries({queryKey: addressesKey}),
    });
}

export function useDeleteAddress() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => deleteAddress(id),
        onSuccess: () => qc.invalidateQueries({queryKey: addressesKey}),
    });
}

export function useAccount() {
    const loggedIn = useAuthStore((s) => s.logged_in);
    return useQuery({
        queryKey: profileKey,
        queryFn: fetchAccount,
        enabled: loggedIn,
    });
}

export function useUpdateAccount() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: updateAccount,
        onSuccess: (data) => {
            qc.setQueryData(profileKey, (old) => ({...old, ...data}));
            useAuthStore.setState((state) => ({user: {...state.user, ...data}}));
        },
    });
}