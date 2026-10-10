"use client";

import {create} from "zustand";
import {persist} from "zustand/middleware";
import {useAuthStore} from "@/stores/auth";
import {toast} from "@heroui/react";
import {fetchCart, addItemToCart, deleteCart, deleteCartItem, updateCartItem} from "@/lib/api/checkout";

const isAuthenticated = () => useAuthStore.getState().logged_in;

const sameLine = (i, productId, priceId) =>
    Number(i.product?.id) === Number(productId) && Number(i.price?.id) === Number(priceId);

const unitPrice = (item) => Number(item.price?.store_price ?? item.product?.store_price ?? 0);

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],

            getTotalPrice: () => get().items
                .reduce((sum, item) => sum + unitPrice(item) * Number(item.quantity), 0)
                .toFixed(2),

            getTotalQuantity: () => get().items.reduce((t, i) => t + Number(i.quantity), 0),

            findItem: (productId, priceId) => get().items.find((i) => sameLine(i, productId, priceId)),

            loadCart: async () => {
                if (!isAuthenticated()) return;
                try {
                    const serverCart = await fetchCart();
                    const previousItems = get().items;
                    const syncedItems = serverCart.items.map((item) => ({...item, is_synced: true}));

                    const priceChanged = syncedItems.some((s) => {
                        const local = previousItems.find((i) => sameLine(i, s.product.id, s.price?.id));
                        return local && Number(local.price?.store_price) !== Number(s.price?.store_price);
                    });

                    set({items: syncedItems});
                    if (priceChanged) toast.info("Prices or discounts for items in your cart have been updated.");
                } catch (error) {
                    console.error("Failed to load cart", error);
                }
            },

            syncGuestCart: async () => {
                if (!isAuthenticated()) return;
                const guestItems = get().items.filter((i) => !i.is_synced);
                if (guestItems.length === 0) return await get().loadCart();

                try {
                    for (const item of guestItems) {
                        await addItemToCart({
                            id: item.product.id, quantity: item.quantity, priceId: item.price.id,
                        }).catch(() => null);
                    }
                    await get().loadCart();
                } catch (error) {
                    console.error("Cart sync failed", error);
                }
            },

            addItem: async (product, price) => {
                const productId = Number(product.id);
                const priceId = Number(price.id);
                const existing = get().findItem(productId, priceId);
                const previousQuantity = existing ? Number(existing.quantity) : 0;
                const nextQuantity = previousQuantity + 1;

                get().updateQuantity(productId, priceId, nextQuantity, product, price);

                if (isAuthenticated()) {
                    try {
                        if (existing) await updateCartItem({productId, priceId, quantity: nextQuantity});
                        else await addItemToCart({id: productId, quantity: nextQuantity, priceId});
                        get().loadCart();
                    } catch (error) {
                        if (existing) get().updateQuantity(productId, priceId, previousQuantity);
                        else get().removeItem(productId, priceId, true);
                        throw error;
                    }
                }
            },

            updateQuantity: (productId, priceId, newQuantity, productObj = null, priceObj = null) => {
                newQuantity = Number(newQuantity);
                if (newQuantity <= 0) return get().removeItem(productId, priceId);

                set((state) => {
                    const exists = state.items.find((i) => sameLine(i, productId, priceId));
                    if (exists) {
                        return {
                            items: state.items.map((i) =>
                                sameLine(i, productId, priceId)
                                    ? {...i, quantity: newQuantity, is_synced: isAuthenticated()}
                                    : i
                            ),
                        };
                    }
                    if (productObj && priceObj) {
                        return {
                            items: [...state.items, {
                                product: {...productObj},
                                price: {...priceObj},
                                quantity: newQuantity,
                                is_synced: isAuthenticated(),
                            }],
                        };
                    }
                    return state;
                });
            },

            incrementQuantity: async (productId, priceId) => {
                const item = get().findItem(productId, priceId);
                if (!item) return;
                const previousQuantity = Number(item.quantity);
                const nextQuantity = previousQuantity + 1;

                get().updateQuantity(productId, priceId, nextQuantity);
                if (isAuthenticated()) {
                    try {
                        await updateCartItem({productId, priceId, quantity: nextQuantity});
                    } catch (error) {
                        get().updateQuantity(productId, priceId, previousQuantity);
                        throw error;
                    }
                }
            },

            decrementQuantity: async (productId, priceId) => {
                const item = get().findItem(productId, priceId);
                if (!item) return;
                const previousQuantity = Number(item.quantity);
                if (previousQuantity <= 1) return;
                const nextQuantity = previousQuantity - 1;

                get().updateQuantity(productId, priceId, nextQuantity);
                if (isAuthenticated()) {
                    try {
                        await updateCartItem({productId, priceId, quantity: nextQuantity});
                    } catch (error) {
                        get().updateQuantity(productId, priceId, previousQuantity);
                        throw error;
                    }
                }
            },

            removeItem: async (productId, priceId, skipServer = false) => {
                const item = get().findItem(productId, priceId);
                if (!item) return;
                const previousItems = get().items;

                set({items: previousItems.filter((i) => !sameLine(i, productId, priceId))});

                if (isAuthenticated() && !skipServer) {
                    try {
                        await deleteCartItem(productId, priceId);
                    } catch (error) {
                        set({items: previousItems});
                        throw error;
                    }
                }
            },

            availabilityCheck: () => true,

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

            resetLocalCart: () => set({items: []}),
        }),
        {
            name: "fog_cart",
            version: 1,
            migrate: () => ({items: []}),
            partialize: (state) => ({items: state.items}),
            skipHydration: true,
        }
    )
);