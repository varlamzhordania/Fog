import { create } from 'zustand';
import {
  fetchBasketData,
  postBasketData,
} from '@/lib/api/checkout';
import { useAuthStore } from '@/stores/auth';
import { useConfigStore } from '@/stores/config';

const LOCAL_NAME = 'cart';

export const useCartStore = create((set, get) => ({
  items: [],
  taxRate: 0.18,

  init: async () => {
    await get().load();
  },

  add: async (product, quantity = 1) => {
    const { items } = get();

    const existing = items.find(
      (item) => item.product.id === product.id
    );

    let newItems;

    if (existing) {
      newItems = items.map((item) =>
        item.product.id === product.id
          ? {
              ...item,
              quantity: item.quantity + quantity,
            }
          : item
      );
    } else {
      newItems = [
        ...items,
        {
          product,
          quantity,
        },
      ];
    }

    set({ items: newItems });

    await get().save();
  },

  increment: async (productId, quantity = 1) => {
    const { items } = get();

    const existing = items.find(
      (item) => item.product.id === productId
    );

    if (!existing) return;

    const newItems = items.map((item) =>
      item.product.id === productId
        ? {
            ...item,
            quantity: item.quantity + quantity,
          }
        : item
    );

    set({ items: newItems });

    await get().save();
  },

  decrement: async (productId, quantity = 1) => {
    const { items } = get();

    const existing = items.find(
      (item) => item.product.id === productId
    );

    if (!existing) return;

    const newQuantity = existing.quantity - quantity;

    if (newQuantity <= 0) {
      await get().remove(productId);
      return;
    }

    const newItems = items.map((item) =>
      item.product.id === productId
        ? {
            ...item,
            quantity: newQuantity,
          }
        : item
    );

    set({ items: newItems });

    await get().save();
  },

  updateQuantity: async (productId, quantity) => {
    if (quantity <= 0) {
      await get().remove(productId);
      return;
    }

    const newItems = get().items.map((item) =>
      item.product.id === productId
        ? {
            ...item,
            quantity,
          }
        : item
    );

    set({ items: newItems });

    await get().save();
  },

  remove: async (productId) => {
    const newItems = get().items.filter(
      (item) => item.product.id !== productId
    );

    set({ items: newItems });

    await get().save(false);
  },

  clear: async () => {
    set({ items: [] });

    await get().save();
  },

  save: async (forceDB = true) => {
    const { items } = get();

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        LOCAL_NAME,
        JSON.stringify(items)
      );
    }

    const loggedIn =
      useAuthStore.getState().logged_in;

    if (loggedIn && forceDB) {
      try {
        await get().saveDB();
      } catch (error) {
        console.error(
          'Failed to save cart to DB:',
          error
        );
      }
    }
  },

  load: async (forceDB = false) => {
    if (typeof window !== 'undefined') {
      try {
        const storedItems =
          localStorage.getItem(LOCAL_NAME);

        const localItems = storedItems
          ? JSON.parse(storedItems)
          : [];

        set({ items: localItems });
      } catch (error) {
        console.error(
          'Failed to load cart from localStorage:',
          error
        );

        set({ items: [] });
      }
    }

    const loggedIn =
      useAuthStore.getState().logged_in;

    if (loggedIn || forceDB) {
      await get().loadDB();
    }
  },

  saveDB: async () => {
    await postBasketData(get().items);
  },

  loadDB: async () => {
    try {
      const currency =
        useConfigStore
          .getState()
          .get('currency');

      const data = await fetchBasketData(currency);

      if (data?.items) {
        const parsedItems = data.items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
        }));

        set({
          items: parsedItems,
        });

        await get().save(false);
      }
    } catch (error) {
      console.error(
        'Failed to load cart from DB:',
        error
      );
    }
  },

  // Number of different products in cart
  getItemCount: () => {
    return get().items.length;
  },

  // Total number of units
  getQuantity: () => {
    return get().items.reduce(
      (total, item) =>
        total + Number(item.quantity),
      0
    );
  },

  getSubtotal: () => {
    return get().items.reduce(
      (total, item) => {
        const price = Number(
          item.product.price ??
            item.product.base_price ??
            0
        );

        const quantity = Number(
          item.quantity
        );

        if (
          Number.isNaN(price) ||
          Number.isNaN(quantity)
        ) {
          return total;
        }

        return total + price * quantity;
      },
      0
    );
  },

  getTax: () => {
    return get().taxRate;
  },

  getTaxAmount: () => {
    return (
      get().getSubtotal() *
      get().taxRate
    );
  },

  getTotal: () => {
    return (
      get().getSubtotal() +
      get().getTaxAmount()
    );
  },
}));