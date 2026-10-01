"use client";

import {create} from "zustand";
import {persist} from "zustand/middleware";
import {useAuthStore} from "@/stores/auth";
import {toast} from "@heroui/react";
import {
    fetchCart,
    addItemToCart,
    deleteCart,
    deleteCartItem,
    updateCartItem
} from "@/lib/api/checkout";

const isAuthenticated = () => useAuthStore.getState().logged_in;

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],

            getTotalPrice: () => get().items.reduce(
                (sum, item) => sum + Number(item.product?.store_price ?? 0) * Number(item.quantity), 0
            ).toFixed(2),

            getTotalQuantity: () => get().items.reduce((t, i) => t + Number(i.quantity), 0),

            findItem: (productId) => get().items.find((i) => Number(i.product?.id) === Number(productId)),


            loadCart: async () => {
                if (!isAuthenticated()) return;
                try {
                    const serverCart = await fetchCart();

                    // 1. Grab the old local items before we overwrite them
                    const previousItems = get().items;

                    // 2. Mark all items fresh from the server as synced
                    const syncedItems = serverCart.items.map(item => ({
                        ...item,
                        is_synced: true
                    }));

                    // 3. Check for price changes (UX Enhancement)
                    let priceChanged = false;

                    syncedItems.forEach((serverItem) => {
                        const localItem = previousItems.find(
                            (i) => Number(i.product.id) === Number(serverItem.product.id)
                        );

                        if (localItem) {
                            const oldPrice = Number(localItem.product.store_price);
                            const newPrice = Number(serverItem.product.store_price);

                            if (oldPrice !== newPrice) {
                                priceChanged = true;
                            }
                        }
                    });

                    // 4. Update the store with the fresh server data
                    set({items: syncedItems});

                    // 5. Notify the user if prices shifted
                    if (priceChanged) {
                        toast.info("Prices or discounts for items in your cart have been updated.");
                    }

                } catch (error) {
                    console.error("Failed to load cart", error);
                }
            },

            syncGuestCart: async () => {
                if (!isAuthenticated()) return;

                // FLAG: Only grab items that haven't been synced to the server yet
                const guestItems = get().items.filter(i => !i.is_synced);

                if (guestItems.length === 0) {
                    // Just a normal page refresh! Fetch the server cart and exit.
                    return await get().loadCart();
                }

                try {
                    // Merge local offline items into the server cart
                    for (const item of guestItems) {
                        await addItemToCart({
                            id: item.product.id,
                            quantity: item.quantity
                        }).catch(() => null);
                    }

                    // Fetch the newly merged cart to guarantee exact synchronization
                    await get().loadCart();
                } catch (error) {
                    console.error("Cart sync failed", error);
                }
            },


            addItem: async (product) => {
                const productId = Number(product.id);
                const existing = get().findItem(productId);
                const previousQuantity = existing ? Number(existing.quantity) : 0;
                const nextQuantity = previousQuantity + 1;

                get().updateQuantity(productId, nextQuantity, product);

                if (isAuthenticated()) {
                    try {
                        if (existing) {
                            await updateCartItem({productId, quantity: nextQuantity});
                        } else {
                            await addItemToCart({id: productId, quantity: nextQuantity});
                        }

                        // Force a background refresh to ensure sync status is perfect
                        get().loadCart();
                    } catch (error) {
                        if (existing) get().updateQuantity(productId, previousQuantity);
                        else get().removeItem(productId, true);
                        throw error;
                    }
                }
            },

            updateQuantity: (productId, newQuantity, productObj = null) => {
                productId = Number(productId);
                newQuantity = Number(newQuantity);

                if (newQuantity <= 0) return get().removeItem(productId);

                set((state) => {
                    const exists = state.items.find(i => Number(i.product.id) === productId);

                    if (exists) {
                        return {
                            items: state.items.map((i) =>
                                Number(i.product.id) === productId
                                    // FLAG: Mark as synced if the user is authenticated (because we instantly push to API)
                                    ? {...i, quantity: newQuantity, is_synced: isAuthenticated()}
                                    : i
                            ),
                        };
                    } else if (productObj) {
                        return {
                            items: [
                                ...state.items,
                                {
                                    product: {...productObj},
                                    quantity: newQuantity,
                                    is_synced: isAuthenticated() // FLAG
                                }
                            ]
                        };
                    }
                    return state;
                });
            },

            incrementQuantity: async (productId) => {
                const item = get().findItem(productId);
                if (!item) return;

                const previousQuantity = Number(item.quantity);
                const nextQuantity = previousQuantity + 1;

                get().updateQuantity(productId, nextQuantity);

                if (isAuthenticated()) {
                    try {
                        await updateCartItem({productId, quantity: nextQuantity});
                    } catch (error) {
                        get().updateQuantity(productId, previousQuantity);
                        throw error;
                    }
                }
            },

            decrementQuantity: async (productId) => {
                const item = get().findItem(productId);
                if (!item) return;

                const previousQuantity = Number(item.quantity);
                if (previousQuantity <= 1) return;
                const nextQuantity = previousQuantity - 1;

                get().updateQuantity(productId, nextQuantity);

                if (isAuthenticated()) {
                    try {
                        await updateCartItem({productId, quantity: nextQuantity});
                    } catch (error) {
                        get().updateQuantity(productId, previousQuantity);
                        throw error;
                    }
                }
            },

            removeItem: async (productId, skipServer = false) => {
                const item = get().findItem(productId);
                if (!item) return;

                const previousItems = get().items;

                set({items: previousItems.filter((i) => Number(i.product.id) !== Number(productId))});

                if (isAuthenticated() && !skipServer) {
                    try {
                        await deleteCartItem(productId);
                    } catch (error) {
                        set({items: previousItems});
                        throw error;
                    }
                }
            },

            clearCart: async () => {
                const previousItems = get().items;
                if (previousItems.length === 0) return;

                set({items: []});

                if (isAuthenticated()) {
                    try {
                        await deleteCart();
                    } catch (error) {
                        set({items: previousItems});
                        throw error;
                    }
                }
            },

            // Helper to clear the local cart when a user logs out
            resetLocalCart: () => {
                set({items: []});
            }
        }),
        {
            name: "fog_cart",
            partialize: (state) => ({items: state.items}),
        }
    )
);