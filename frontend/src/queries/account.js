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


export function useSaveAddress() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({id, data}) => (id ? patchAddress(id, data) : createAddress(data)),
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