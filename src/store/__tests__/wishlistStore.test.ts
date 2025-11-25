import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWishlistStore } from '../store';

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

describe('WishlistStore', () => {
    beforeEach(() => {
        // Clear store and localStorage before each test
        useWishlistStore.setState({ items: [] });
        localStorageMock.clear();
    });

    it('should start with empty wishlist', () => {
        const items = useWishlistStore.getState().items;
        expect(items).toEqual([]);
    });

    it('should add item to wishlist', async () => {
        const item = {
            productId: '1',
            name: 'Lipstick',
            price: 29.99,
            image: 'lipstick.jpg'
        };

        await useWishlistStore.getState().addItem(item);
        const items = useWishlistStore.getState().items;

        expect(items).toHaveLength(1);
        expect(items[0]).toEqual(item);
    });

    it('should prevent duplicate items in wishlist', async () => {
        const item = {
            productId: '1',
            name: 'Lipstick',
            price: 29.99,
            image: 'lipstick.jpg'
        };

        await useWishlistStore.getState().addItem(item);
        await useWishlistStore.getState().addItem(item); // Try to add again

        const items = useWishlistStore.getState().items;
        expect(items).toHaveLength(1); // Should still be 1
    });

    it('should remove item from wishlist', async () => {
        const item = {
            productId: '1',
            name: 'Lipstick',
            price: 29.99,
            image: 'lipstick.jpg'
        };

        await useWishlistStore.getState().addItem(item);
        await useWishlistStore.getState().removeItem('1');

        const items = useWishlistStore.getState().items;
        expect(items).toHaveLength(0);
    });

    it('should check if product is favorited', async () => {
        const item = {
            productId: '1',
            name: 'Lipstick',
            price: 29.99,
            image: 'lipstick.jpg'
        };

        // Initially not favorited
        expect(useWishlistStore.getState().isFavorited('1')).toBe(false);

        // Add to wishlist
        await useWishlistStore.getState().addItem(item);
        expect(useWishlistStore.getState().isFavorited('1')).toBe(true);

        // Remove from wishlist
        await useWishlistStore.getState().removeItem('1');
        expect(useWishlistStore.getState().isFavorited('1')).toBe(false);
    });

    it('should persist wishlist to localStorage', async () => {
        const item = {
            productId: '1',
            name: 'Lipstick',
            price: 29.99,
            image: 'lipstick.jpg'
        };

        await useWishlistStore.getState().addItem(item);

        const stored = localStorageMock.getItem('wishlist');
        expect(stored).toBeTruthy();
        expect(JSON.parse(stored!)).toEqual([item]);
    });

    it('should handle multiple wishlist items', async () => {
        const items = [
            { productId: '1', name: 'Lipstick', price: 29.99, image: 'lipstick.jpg' },
            { productId: '2', name: 'Mascara', price: 24.99, image: 'mascara.jpg' },
            { productId: '3', name: 'Foundation', price: 39.99, image: 'foundation.jpg' }
        ];

        for (const item of items) {
            await useWishlistStore.getState().addItem(item);
        }

        const wishlistItems = useWishlistStore.getState().items;
        expect(wishlistItems).toHaveLength(3);
        expect(useWishlistStore.getState().isFavorited('2')).toBe(true);
    });

    it('should remove correct item from multiple items', async () => {
        const items = [
            { productId: '1', name: 'Lipstick', price: 29.99, image: 'lipstick.jpg' },
            { productId: '2', name: 'Mascara', price: 24.99, image: 'mascara.jpg' },
            { productId: '3', name: 'Foundation', price: 39.99, image: 'foundation.jpg' }
        ];

        for (const item of items) {
            await useWishlistStore.getState().addItem(item);
        }

        // Remove middle item
        await useWishlistStore.getState().removeItem('2');

        const wishlistItems = useWishlistStore.getState().items;
        expect(wishlistItems).toHaveLength(2);
        expect(useWishlistStore.getState().isFavorited('1')).toBe(true);
        expect(useWishlistStore.getState().isFavorited('2')).toBe(false);
        expect(useWishlistStore.getState().isFavorited('3')).toBe(true);
    });
});
