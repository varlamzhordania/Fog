import {create} from "zustand";
import {persist} from "zustand/middleware";
import {
    fetchCart, // deleteCart,
    // addItemToCart,
    // updateCartItem,
    // deleteCartItem,
} from "@/lib/api/checkout";
import {useAuthStore} from "@/stores/auth";


const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + Number(item.product_store_price) * Number(item.quantity), 0).toFixed(2);
};


export const useCartStore = create(persist((set, get) => ({
    items: [], isLoading: false, error: null,

    getTotalPrice: () => {
        return calculateTotal(get().items);
    },

    getTotalQuantity: () => {
        return get().items.reduce(
            (total, item) => total + Number(item.quantity),
            0
        );
    },

    loadCart: async () => {
        const isAuthenticated = useAuthStore.getState().logged_in;

        if (!isAuthenticated) return;

        set({
            isLoading: true, error: null,
        });

        try {
            const data = await fetchCart();

            set({
                items: data.items || [],
            });
        } catch (error) {
            console.error("Failed to load server cart:", error);

            set({
                error: error?.response?.data?.detail || "Failed to load cart",
            });
        } finally {
            set({
                isLoading: false,
            });
        }
    },

    findItem: (productId) => {
        const {items} = get();

        return items.find((item) => item.product_id === productId);
    },

    incrementItem: async (product, quantity = 1) => {
        const {items, findItem} = get();

        const existingItem = findItem(product.id);

        const basePrice = Number(product.base_price).toFixed(2);
        const storePrice = Number(product.store_price).toFixed(2);
        const discountPercentage = Number(product.discount_percentage);

        let newItems;

        if (existingItem) {
            newItems = items.map((item) => item.product_id === product.id ? {
                ...item, quantity: Number(item.quantity) + quantity,
            } : item);
        } else {
            newItems = [...items, {
                id: product.id,
                product_id: product.id,
                product_name: product.name,
                product_slug: product.slug,
                product_base_price: basePrice,
                product_store_price: storePrice,
                product_discount_percentage: discountPercentage,
                quantity,
            },];
        }

        set({
            items: newItems, error: null,
        });

        /*
         * SERVER POST
         * Will be moved to useMutation.
         *
         * if (useAuthStore.getState().logged_in) {
         *     await addItemToCart({
         *         product_id: product.id,
         *         quantity,
         *     });
         * }
         */
    },

    decrementItem: (itemId) => {
        const {items, removeItem} = get();

        const item = items.find(
            (item) => item.id === itemId
        );

        if (!item) return;

        if (item.quantity <= 1) {
            removeItem(itemId);
            return;
        }

        set({
            items: items.map((item) =>
                item.id === itemId
                    ? {
                        ...item,
                        quantity: Number(item.quantity) - 1,
                    }
                    : item
            ),
        });
    },

    updateQuantity: async (itemId, quantity) => {
        if (quantity <= 0) {
            get().removeItem(itemId);
            return;
        }

        const {items} = get();

        const newItems = items.map((item) => item.id === itemId ? {
            ...item, quantity,
        } : item);

        set({
            items: newItems, error: null,
        });

        /*
         * SERVER UPDATE
         * Will be moved to useMutation.
         *
         * if (useAuthStore.getState().logged_in) {
         *     await updateCartItem({
         *         id: itemId,
         *         quantity,
         *     });
         * }
         */
    },


    removeItem: async (itemId) => {
        const {items} = get();

        const newItems = items.filter((item) => item.id !== itemId);

        set({
            items: newItems, error: null,
        });

        /*
         * SERVER DELETE
         * Will be moved to useMutation.
         *
         * if (useAuthStore.getState().logged_in) {
         *     await deleteCartItem(itemId);
         * }
         */
    },

    clearCart: async () => {
        set({
            items: [], error: null,
        });

        /*
         * SERVER DELETE
         * Will be moved to useMutation.
         *
         * if (useAuthStore.getState().logged_in) {
         *     await deleteCart();
         * }
         */
    },
}), {
    name: "fog_cart",

    partialize: (state) => ({
        items: state.items,
    }),
}));