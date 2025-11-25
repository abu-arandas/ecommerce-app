import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../store';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('CartStore', () => {
    beforeEach(() => {
        useCartStore.getState().clearCart();
        localStorageMock.clear();
    });

    it('should start with empty cart', () => {
        const items = useCartStore.getState().items;
        expect(items).toEqual([]);
    });

    it('should add items to cart', async () => {
        const item = {
            id: '1',
            productId: 'prod-1',
            name: 'Test Product',
            price: 100,
            image: 'test.jpg',
            quantity: 1
        };

        await useCartStore.getState().addItem(item);
        const items = useCartStore.getState().items;

        expect(items).toHaveLength(1);
        expect(items[0].quantity).toBe(1);
        expect(items[0].productId).toBe('prod-1');
        expect(items[0].name).toBe('Test Product');
    });

    it('should increment quantity when adding existing item', async () => {
        const item = {
            id: '1',
            productId: 'prod-1',
            name: 'Test Product',
            price: 100,
            image: 'test.jpg',
            quantity: 1
        };

        await useCartStore.getState().addItem(item);
        await useCartStore.getState().addItem(item); // Add again

        const items = useCartStore.getState().items;
        expect(items).toHaveLength(1); // Still one item
        expect(items[0].quantity).toBe(2); // Quantity increased
    });

    it('should remove items from cart', async () => {
        const item = {
            id: '1',
            productId: 'prod-1',
            name: 'Test Product',
            price: 100,
            image: 'test.jpg',
            quantity: 1
        };

        await useCartStore.getState().addItem(item);
        await useCartStore.getState().removeItem('prod-1');

        const items = useCartStore.getState().items;
        expect(items).toHaveLength(0);
    });

    it('should update quantity of cart item', async () => {
        const item = {
            id: '1',
            productId: 'prod-1',
            name: 'Test Product',
            price: 100,
            image: 'test.jpg',
            quantity: 1
        };

        await useCartStore.getState().addItem(item);
        await useCartStore.getState().updateQuantity('prod-1', 5);

        const items = useCartStore.getState().items;
        expect(items[0].quantity).toBe(5);
    });

    it('should calculate total correctly', async () => {
        const items = [
            { id: '1', productId: 'prod-1', name: 'Item 1', price: 100, image: 'i1.jpg', quantity: 2 },
            { id: '2', productId: 'prod-2', name: 'Item 2', price: 50, image: 'i2.jpg', quantity: 3 }
        ];

        for (const item of items) {
            await useCartStore.getState().addItem(item);
        }

        const total = useCartStore.getState().total();
        expect(total).toBe(350); // (100 * 2) + (50 * 3) = 350
    });

    it('should clear entire cart', async () => {
        const items = [
            { id: '1', productId: 'prod-1', name: 'Item 1', price: 100, image: 'i1.jpg', quantity: 1 },
            { id: '2', productId: 'prod-2', name: 'Item 2', price: 50, image: 'i2.jpg', quantity: 2 }
        ];

        for (const item of items) {
            await useCartStore.getState().addItem(item);
        }

        await useCartStore.getState().clearCart();

        const cartItems = useCartStore.getState().items;
        expect(cartItems).toHaveLength(0);
        expect(useCartStore.getState().total()).toBe(0);
    });

    it('should persist cart to localStorage', async () => {
        const item = {
            id: '1',
            productId: 'prod-1',
            name: 'Test Product',
            price: 100,
            image: 'test.jpg',
            quantity: 1
        };

        await useCartStore.getState().addItem(item);

        const stored = localStorageMock.getItem('cart');
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].productId).toBe('prod-1');
    });

    it('should handle multiple different items', async () => {
        const items = [
            { id: '1', productId: 'prod-1', name: 'Lipstick', price: 29.99, image: 'l.jpg', quantity: 1 },
            { id: '2', productId: 'prod-2', name: 'Mascara', price: 24.99, image: 'm.jpg', quantity: 1 },
            { id: '3', productId: 'prod-3', name: 'Foundation', price: 39.99, image: 'f.jpg', quantity: 1 }
        ];

        for (const item of items) {
            await useCartStore.getState().addItem(item);
        }

        const cartItems = useCartStore.getState().items;
        expect(cartItems).toHaveLength(3);
    });

    it('should return 0 total for empty cart', () => {
        const total = useCartStore.getState().total();
        expect(total).toBe(0);
    });
});

