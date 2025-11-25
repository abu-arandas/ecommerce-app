import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCartStore, useWishlistStore } from '@/store/store'

describe('useCartStore', () => {
    beforeEach(() => {
        // Reset store before each test
        useCartStore.setState({ items: [] })
        localStorage.clear()
    })

    it('should start with empty cart', () => {
        const { result } = renderHook(() => useCartStore())
        expect(result.current.items).toEqual([])
    })

    it('should add item to cart', () => {
        const { result } = renderHook(() => useCartStore())

        const testItem = {
            id: '1',
            productId: 'p1',
            name: 'Test Product',
            price: 29.99,
            image: 'test.jpg',
            quantity: 1,
        }

        act(() => {
            result.current.addItem(testItem)
        })

        expect(result.current.items).toHaveLength(1)
        expect(result.current.items[0]).toEqual(testItem)
    })

    it('should increase quantity when adding same item', () => {
        const { result } = renderHook(() => useCartStore())

        const testItem = {
            id: '1',
            productId: 'p1',
            name: 'Test Product',
            price: 29.99,
            image: 'test.jpg',
            quantity: 1,
        }

        act(() => {
            result.current.addItem(testItem)
            result.current.addItem(testItem)
        })

        expect(result.current.items).toHaveLength(1)
        expect(result.current.items[0].quantity).toBe(2)
    })

    it('should remove item from cart', () => {
        const { result } = renderHook(() => useCartStore())

        const testItem = {
            id: '1',
            productId: 'p1',
            name: 'Test Product',
            price: 29.99,
            image: 'test.jpg',
            quantity: 1,
        }

        act(() => {
            result.current.addItem(testItem)
        })

        expect(result.current.items).toHaveLength(1)

        act(() => {
            result.current.removeItem('p1')
        })

        expect(result.current.items).toHaveLength(0)
    })

    it('should update item quantity', () => {
        const { result } = renderHook(() => useCartStore())

        const testItem = {
            id: '1',
            productId: 'p1',
            name: 'Test Product',
            price: 29.99,
            image: 'test.jpg',
            quantity: 1,
        }

        act(() => {
            result.current.addItem(testItem)
            result.current.updateQuantity('p1', 5)
        })

        expect(result.current.items[0].quantity).toBe(5)
    })

    it('should calculate total correctly', () => {
        const { result } = renderHook(() => useCartStore())

        act(() => {
            result.current.addItem({
                id: '1',
                productId: 'p1',
                name: 'Product 1',
                price: 10.00,
                image: 'test.jpg',
                quantity: 2,
            })
            result.current.addItem({
                id: '2',
                productId: 'p2',
                name: 'Product 2',
                price: 15.50,
                image: 'test.jpg',
                quantity: 1,
            })
        })

        const total = result.current.total()
        expect(total).toBe(35.50) // (10 * 2) + (15.50 * 1)
    })

    it('should clear cart', () => {
        const { result } = renderHook(() => useCartStore())

        act(() => {
            result.current.addItem({
                id: '1',
                productId: 'p1',
                name: 'Test Product',
                price: 29.99,
                image: 'test.jpg',
                quantity: 1,
            })
            result.current.clearCart()
        })

        expect(result.current.items).toEqual([])
    })

    it('should persist to localStorage', () => {
        const { result } = renderHook(() => useCartStore())

        const testItem = {
            id: '1',
            productId: 'p1',
            name: 'Test Product',
            price: 29.99,
            image: 'test.jpg',
            quantity: 1,
        }

        act(() => {
            result.current.addItem(testItem)
        })

        const stored = localStorage.getItem('cart')
        expect(stored).toBeTruthy()
        expect(JSON.parse(stored!)).toEqual([testItem])
    })
})

describe('useWishlistStore', () => {
    beforeEach(() => {
        useWishlistStore.setState({ items: [] })
        localStorage.clear()
    })

    it('should add item to wishlist', () => {
        const { result } = renderHook(() => useWishlistStore())

        const testItem = {
            productId: 'p1',
            name: 'Test Product',
            price: 29.99,
            image: 'test.jpg',
        }

        act(() => {
            result.current.addItem(testItem)
        })

        expect(result.current.items).toHaveLength(1)
        expect(result.current.items[0]).toEqual(testItem)
    })

    it('should remove item from wishlist', () => {
        const { result } = renderHook(() => useWishlistStore())

        const testItem = {
            productId: 'p1',
            name: 'Test Product',
            price: 29.99,
            image: 'test.jpg',
        }

        act(() => {
            result.current.addItem(testItem)
            result.current.removeItem('p1')
        })

        expect(result.current.items).toHaveLength(0)
    })

    it('should check if item is favorited', () => {
        const { result } = renderHook(() => useWishlistStore())

        const testItem = {
            productId: 'p1',
            name: 'Test Product',
            price: 29.99,
            image: 'test.jpg',
        }

        act(() => {
            result.current.addItem(testItem)
        })

        expect(result.current.isFavorited('p1')).toBe(true)
        expect(result.current.isFavorited('p2')).toBe(false)
    })
})
