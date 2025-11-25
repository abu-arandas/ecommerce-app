import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useToastStore } from '../toastStore';

describe('ToastStore', () => {
    beforeEach(() => {
        // Clear all toasts before each test
        useToastStore.setState({ toasts: [] });
    });

    it('should start with no toasts', () => {
        const toasts = useToastStore.getState().toasts;
        expect(toasts).toEqual([]);
    });

    it('should add success toast', () => {
        useToastStore.getState().addToast('success', 'Operation successful');

        const toasts = useToastStore.getState().toasts;
        expect(toasts).toHaveLength(1);
        expect(toasts[0].type).toBe('success');
        expect(toasts[0].message).toBe('Operation successful');
    });

    it('should add error toast', () => {
        useToastStore.getState().addToast('error', 'Something went wrong');

        const toasts = useToastStore.getState().toasts;
        expect(toasts).toHaveLength(1);
        expect(toasts[0].type).toBe('error');
        expect(toasts[0].message).toBe('Something went wrong');
    });

    it('should add multiple toasts', () => {
        useToastStore.getState().addToast('success', 'First toast');
        useToastStore.getState().addToast('info', 'Second toast');
        useToastStore.getState().addToast('warning', 'Third toast');

        const toasts = useToastStore.getState().toasts;
        expect(toasts).toHaveLength(3);
    });

    it('should generate unique IDs for toasts', () => {
        useToastStore.getState().addToast('success', 'First');
        useToastStore.getState().addToast('success', 'Second');

        const toasts = useToastStore.getState().toasts;
        expect(toasts[0].id).not.toBe(toasts[1].id);
    });

    it('should remove toast by ID', () => {
        useToastStore.getState().addToast('success', 'Toast 1');
        useToastStore.getState().addToast('info', 'Toast 2');

        const toasts = useToastStore.getState().toasts;
        const firstToastId = toasts[0].id;

        useToastStore.getState().removeToast(firstToastId);

        const remainingToasts = useToastStore.getState().toasts;
        expect(remainingToasts).toHaveLength(1);
        expect(remainingToasts[0].message).toBe('Toast 2');
    });

    it('should set default duration to 5000ms', () => {
        useToastStore.getState().addToast('success', 'Test');

        const toasts = useToastStore.getState().toasts;
        expect(toasts[0].duration).toBe(5000);
    });

    it('should accept custom duration', () => {
        useToastStore.getState().addToast('success', 'Test', 3000);

        const toasts = useToastStore.getState().toasts;
        expect(toasts[0].duration).toBe(3000);
    });

    it('should auto-remove toast after duration', async () => {
        vi.useFakeTimers();

        useToastStore.getState().addToast('success', 'Test', 100);

        expect(useToastStore.getState().toasts).toHaveLength(1);

        // Fast-forward time
        vi.advanceTimersByTime(100);

        // Wait for state update
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(useToastStore.getState().toasts).toHaveLength(0);

        vi.useRealTimers();
    });

    it('should not auto-remove toast with duration 0', async () => {
        vi.useFakeTimers();

        useToastStore.getState().addToast('error', 'Persistent error', 0);

        expect(useToastStore.getState().toasts).toHaveLength(1);

        // Fast-forward time
        vi.advanceTimersByTime(10000);

        // Toast should still be there
        expect(useToastStore.getState().toasts).toHaveLength(1);

        vi.useRealTimers();
    });

    it('should handle all toast types', () => {
        const types: Array<'success' | 'error' | 'warning' | 'info'> = ['success', 'error', 'warning', 'info'];

        types.forEach((type, index) => {
            useToastStore.getState().addToast(type, `Message ${index}`);
        });

        const toasts = useToastStore.getState().toasts;
        expect(toasts).toHaveLength(4);
        types.forEach((type, index) => {
            expect(toasts[index].type).toBe(type);
        });
    });
});
