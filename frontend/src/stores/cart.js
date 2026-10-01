"use client";

import {create} from "zustand";
import {persist} from "zustand/middleware";

import {
    fetchCart,
    deleteCart,
    addItemToCart,
    updateCartItem,
    deleteCartItem,
} from "@/lib/api/checkout";

import {useAuthStore} from "@/stores/auth";


const isAuthenticated = () => {
    return useAuthStore.getState().logged_in;
};


const calculateTotal = (items) => {
    return items
        .reduce(
            (sum, item) =>
                sum +
                Number(
                    item.product?.store_price ??
                    item.product_price ??
                    0
                ) *
                Number(item.quantity),
            0
        )
        .toFixed(2);
};


const normalizeServerCart = (cart) => ({
    id: cart?.id ?? null,
    items: (cart?.items ?? []).map((item) => ({
        id: item.id,
        product: item.product,
        quantity: Number(item.quantity),
        total_price: item.total_price,
    })),
    total_price: cart?.total_price ?? "0.00",
});


export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            cartId: null,

            isLoading: false,
            isAdding: false,
            isUpdating: false,
            isRemoving: false,
            isClearing: false,

            /*
             * Used after login.
             */
            isSyncing: false,

            /*
             * Product IDs currently being modified.
             *
             * Example:
             *
             * {
             *     12: true,
             *     24: true
             * }
             *
             * This lets the UI disable only the affected
             * product instead of the entire cart.
             */
            pendingItems: {},

            error: null,


            getTotalPrice: () => {
                return calculateTotal(get().items);
            },


            getTotalQuantity: () => {
                return get().items.reduce(
                    (total, item) =>
                        total + Number(item.quantity),
                    0
                );
            },


            findItem: (productId) => {
                return get().items.find(
                    (item) =>
                        Number(item.product?.id) ===
                        Number(productId)
                );
            },


            findItemById: (cartItemId) => {
                return get().items.find(
                    (item) =>
                        Number(item.id) ===
                        Number(cartItemId)
                );
            },


            isItemPending: (productId) => {
                return Boolean(
                    get().pendingItems[productId]
                );
            },


            setItemPending: (productId, pending) => {
                set((state) => {
                    const pendingItems = {
                        ...state.pendingItems,
                    };

                    if (pending) {
                        pendingItems[productId] = true;
                    } else {
                        delete pendingItems[productId];
                    }

                    return {
                        pendingItems,
                    };
                });
            },


            /* =========================================================
             * LOAD SERVER CART
             * ========================================================= */

            loadCart: async () => {
                if (!isAuthenticated()) {
                    return;
                }

                set({
                    isLoading: true,
                    error: null,
                });

                try {
                    const data = await fetchCart();

                    const cart =
                        normalizeServerCart(data);

                    set({
                        cartId: cart.id,
                        items: cart.items,
                        error: null,
                    });

                    return cart;
                } catch (error) {
                    console.error(
                        "Failed to load server cart:",
                        error
                    );

                    const message =
                        error?.response?.data?.detail ||
                        "Failed to load cart";

                    set({
                        error: message,
                    });

                    throw error;
                } finally {
                    set({
                        isLoading: false,
                    });
                }
            },


            /* =========================================================
             * SYNC GUEST CART AFTER LOGIN
             * ========================================================= */

            syncGuestCart: async () => {
                const {
                    items,
                    isSyncing,
                } = get();

                /*
                 * Prevent duplicate synchronization.
                 */
                if (isSyncing) {
                    return;
                }

                /*
                 * Only synchronize items that don't have
                 * a server ShoppingCartItem ID yet.
                 */
                const guestItems = items.filter(
                    (item) => !item.id
                );

                set({
                    isSyncing: true,
                    error: null,
                });

                try {
                    for (const item of guestItems) {
                        await addItemToCart({
                            product_id: Number(item.product.id),
                            quantity: Number(item.quantity),
                        });
                    }

                    /*
                     * Always replace the local cart with the
                     * authoritative server cart.
                     */
                    const data = await fetchCart();

                    const cart = normalizeServerCart(data);

                    set({
                        cartId: cart.id,
                        items: cart.items,
                        error: null,
                    });

                    return cart;
                } catch (error) {
                    console.error(
                        "Failed to synchronize cart:",
                        error
                    );

                    set({
                        error:
                            error?.response?.data?.detail ||
                            "Failed to synchronize cart.",
                    });

                    throw error;
                } finally {
                    set({
                        isSyncing: false,
                    });
                }
            },


            /* =========================================================
             * ADD ITEM
             * ========================================================= */

            incrementItem: async (
                product,
                quantity = 1
            ) => {
                if (quantity <= 0) {
                    return;
                }

                const {
                    items,
                    findItem,
                    setItemPending,
                } = get();

                const productId =
                    Number(product.id);

                const existingItem =
                    findItem(productId);

                const previousItems = items;

                let optimisticItems;

                if (existingItem) {
                    optimisticItems =
                        items.map(
                            (item) =>
                                Number(
                                    item.product.id
                                ) === productId
                                    ? {
                                        ...item,
                                        quantity:
                                            Number(
                                                item.quantity
                                            ) +
                                            quantity,
                                    }
                                    : item
                        );
                } else {
                    optimisticItems = [
                        ...items,
                        {
                            id: null,

                            product: {
                                id: product.id,
                                name: product.name,
                                slug: product.slug,
                                primary_image:
                                product.primary_image,
                                product_type:
                                product.product_type,
                                available_stock:
                                product.available_stock,

                                base_price:
                                    Number(
                                        product.base_price
                                    ).toFixed(2),

                                store_price:
                                    Number(
                                        product.store_price
                                    ).toFixed(2),

                                discount_percentage:
                                    Number(
                                        product.discount_percentage
                                    ),
                            },

                            quantity,
                        },
                    ];
                }

                /*
                 * Update UI immediately.
                 */
                set({
                    items: optimisticItems,
                    isAdding: true,
                    error: null,
                });

                /*
                 * Mark this product as busy.
                 */
                setItemPending(productId, true);

                /*
                 * Guest cart stays local.
                 */
                if (!isAuthenticated()) {
                    setItemPending(
                        productId,
                        false
                    );

                    set({
                        isAdding: false,
                    });

                    return;
                }

                try {
                    const data =
                        await addItemToCart({
                            product_id: productId,
                            quantity,
                        });

                    const cart =
                        normalizeServerCart(data);

                    set({
                        cartId: cart.id,
                        items: cart.items,
                        error: null,
                    });
                } catch (error) {
                    console.error(
                        "Failed to add item to cart:",
                        error
                    );

                    set({
                        items: previousItems,
                        error:
                            error?.response?.data
                                ?.detail ||
                            "Failed to add item to cart",
                    });

                    throw error;
                } finally {
                    setItemPending(
                        productId,
                        false
                    );

                    set({
                        isAdding: false,
                    });
                }
            },


            /* =========================================================
             * DECREMENT
             * ========================================================= */

            decrementItem: async (productId) => {
                const {
                    findItem,
                    isItemPending,
                } = get();

                if (isItemPending(productId)) {
                    return;
                }

                const item =
                    findItem(productId);

                if (!item) {
                    return;
                }

                if (
                    Number(item.quantity) <= 1
                ) {
                    await get().removeItem(
                        productId
                    );

                    return;
                }

                await get().updateQuantity(
                    productId,
                    Number(item.quantity) - 1
                );
            },


            /* =========================================================
             * UPDATE QUANTITY
             * ========================================================= */

            updateQuantity: async (
                productId,
                quantity
            ) => {
                productId = Number(productId);
                quantity = Number(quantity);

                if (quantity <= 0) {
                    await get().removeItem(
                        productId
                    );

                    return;
                }

                const {
                    items,
                    findItem,
                    setItemPending,
                    isItemPending,
                } = get();

                /*
                 * Prevent multiple simultaneous requests
                 * for the same cart item.
                 */
                if (isItemPending(productId)) {
                    return;
                }

                const item =
                    findItem(productId);

                if (!item) {
                    return;
                }

                const previousItems = items;

                const newItems =
                    items.map(
                        (cartItem) =>
                            Number(
                                cartItem.product.id
                            ) === productId
                                ? {
                                    ...cartItem,
                                    quantity,
                                }
                                : cartItem
                    );

                /*
                 * Optimistic UI.
                 */
                set({
                    items: newItems,
                    isUpdating: true,
                    error: null,
                });

                setItemPending(
                    productId,
                    true
                );


                /*
                 * Guest cart.
                 */
                if (!isAuthenticated()) {
                    setItemPending(
                        productId,
                        false
                    );

                    set({
                        isUpdating: false,
                    });

                    return;
                }


                try {
                    /*
                     * item.id is ShoppingCartItem.id.
                     */
                    const data =
                        await updateCartItem({
                            id: item.id,
                            quantity,
                        });

                    const cart =
                        normalizeServerCart(data);

                    set({
                        cartId: cart.id,
                        items: cart.items,
                        error: null,
                    });
                } catch (error) {
                    console.error(
                        "Failed to update cart item:",
                        error
                    );

                    set({
                        items: previousItems,
                        error:
                            error?.response?.data
                                ?.detail ||
                            "Failed to update cart item",
                    });

                    throw error;
                } finally {
                    setItemPending(
                        productId,
                        false
                    );

                    set({
                        isUpdating: false,
                    });
                }
            },


            /* =========================================================
             * REMOVE ITEM
             * ========================================================= */

            removeItem: async (productId) => {
                productId = Number(productId);

                const {
                    items,
                    findItem,
                    setItemPending,
                    isItemPending,
                } = get();

                if (isItemPending(productId)) {
                    return;
                }

                const item =
                    findItem(productId);

                if (!item) {
                    return;
                }

                const previousItems = items;

                const newItems =
                    items.filter(
                        (cartItem) =>
                            Number(
                                cartItem.product.id
                            ) !== productId
                    );

                /*
                 * Optimistic UI.
                 */
                set({
                    items: newItems,
                    isRemoving: true,
                    error: null,
                });

                setItemPending(
                    productId,
                    true
                );


                /*
                 * Guest cart.
                 */
                if (!isAuthenticated()) {
                    setItemPending(
                        productId,
                        false
                    );

                    set({
                        isRemoving: false,
                    });

                    return;
                }


                try {
                    /*
                     * A guest item can have id=null.
                     *
                     * Normally this won't happen because
                     * syncGuestCart() runs after login.
                     *
                     * This guard prevents a bad request
                     * if something happens during auth transition.
                     */
                    if (!item.id) {
                        await get().syncGuestCart();

                        return;
                    }

                    const data =
                        await deleteCartItem(
                            item.id
                        );

                    const cart =
                        normalizeServerCart(data);

                    set({
                        cartId: cart.id,
                        items: cart.items,
                        error: null,
                    });
                } catch (error) {
                    console.error(
                        "Failed to remove cart item:",
                        error
                    );

                    set({
                        items: previousItems,
                        error:
                            error?.response?.data
                                ?.detail ||
                            "Failed to remove cart item",
                    });

                    throw error;
                } finally {
                    setItemPending(
                        productId,
                        false
                    );

                    set({
                        isRemoving: false,
                    });
                }
            },


            /* =========================================================
             * CLEAR CART
             * ========================================================= */

            clearCart: async () => {
                const previousItems =
                    get().items;

                set({
                    items: [],
                    error: null,
                    isClearing: true,
                });

                if (!isAuthenticated()) {
                    set({
                        isClearing: false,
                    });

                    return;
                }

                try {
                    await deleteCart();

                    set({
                        items: [],
                        cartId: null,
                        error: null,
                    });
                } catch (error) {
                    console.error(
                        "Failed to clear cart:",
                        error
                    );

                    set({
                        items: previousItems,
                        error:
                            error?.response?.data
                                ?.detail ||
                            "Failed to clear cart",
                    });

                    throw error;
                } finally {
                    set({
                        isClearing: false,
                    });
                }
            },


            /* =========================================================
             * RESET
             * ========================================================= */

            resetLocalCart: () => {
                set({
                    items: [],
                    cartId: null,
                    pendingItems: {},
                    error: null,
                });
            },

            incrementQuantity: async (productId) => {
                productId = Number(productId);

                const {
                    findItem,
                    isItemPending,
                } = get();

                if (isItemPending(productId)) {
                    return;
                }

                const item = findItem(productId);

                if (!item) {
                    return;
                }

                const currentQuantity = Number(item.quantity);
                const stock = Number(item.product?.available_stock ?? 0);

                if (
                    stock > 0 &&
                    currentQuantity >= stock
                ) {
                    return;
                }

                await get().updateQuantity(
                    productId,
                    currentQuantity + 1
                );
            },


            decrementQuantity: async (productId) => {
                productId = Number(productId);

                const {
                    findItem,
                    isItemPending,
                } = get();

                if (isItemPending(productId)) {
                    return;
                }

                const item = findItem(productId);

                if (!item) {
                    return;
                }

                const currentQuantity = Number(item.quantity);

                if (currentQuantity <= 1) {
                    await get().removeItem(productId);
                    return;
                }

                await get().updateQuantity(
                    productId,
                    currentQuantity - 1
                );
            },
        }),
        {
            name: "fog_cart",

            partialize: (state) => ({
                items: state.items,
            }),
        }
    )
);