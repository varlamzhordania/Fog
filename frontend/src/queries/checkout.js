import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    fetchCart, fetchPaymentMethods, createOrder, fetchOrders,
    fetchOrderDetail, payOrder, cancelOrder,
} from "@/lib/api/checkout";
import {useAuthStore} from "@/stores/auth";

export function useCart() {
    return useQuery({queryKey: ["checkout", "cart"], queryFn: () => fetchCart(), retry: false});
}

export function usePaymentMethods() {
    const loggedIn = useAuthStore((s) => s.logged_in);
    return useQuery({
        queryKey: ["checkout", "payment-methods"],
        queryFn: fetchPaymentMethods,
        enabled: loggedIn,
    });
}

export function useOrders(params = {}) {
    return useQuery({queryKey: ["checkout", "orders", params], queryFn: () => fetchOrders(params)});
}

export function useOrder(id) {
    return useQuery({
        queryKey: ["checkout", "order", String(id)],
        queryFn: () => fetchOrderDetail(id),
        enabled: Boolean(id),
        // keep polling while the order is waiting for payment
        refetchInterval: (query) => (query.state.data?.status === "payment" ? 15000 : false),
    });
}

export function useCreateOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createOrder,
        onSuccess: () => qc.invalidateQueries({queryKey: ["checkout", "orders"]}),
    });
}

export function usePayOrder(id) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => payOrder(id, data),
        onSuccess: ({order}) => qc.setQueryData(["checkout", "order", String(id)], order),
    });
}

export function useCancelOrder(id) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => cancelOrder(id),
        onSuccess: ({order}) => {
            qc.setQueryData(["checkout", "order", String(id)], order);
            qc.invalidateQueries({queryKey: ["checkout", "orders"]});
        },
    });
}