/**
 * Performance Optimization Utilities
 * Provides utilities for improving app performance
 */

/**
 * Debounce function to limit how often a function can fire
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
}

/**
 * Throttle function to ensure a function is only called once per specified time period
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

/**
 * Memoize expensive calculations
 * @param fn - Function to memoize
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
    const cache = new Map<string, ReturnType<T>>();

    return ((...args: Parameters<T>): ReturnType<T> => {
        const key = JSON.stringify(args);

        if (cache.has(key)) {
            return cache.get(key)!;
        }

        const result = fn(...args);
        cache.set(key, result);
        return result;
    }) as T;
}

/**
 * Format file size for display
 * @param bytes - Size in bytes
 * @returns Formatted string
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Compress image before upload
 * @param file - Image file
 * @param maxWidth - Maximum width
 * @param maxHeight - Maximum height
 * @param quality - JPEG quality (0-1)
 * @returns Compressed image blob
 */
export async function compressImage(
    file: File,
    maxWidth: number = 1200,
    maxHeight: number = 1200,
    quality: number = 0.8
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = reject;
            img.src = e.target?.result as string;
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Preload images for faster display
 * @param urls - Array of image URLs
 */
export function preloadImages(urls: string[]): void {
    urls.forEach((url) => {
        const img = new Image();
        img.src = url;
    });
}

/**
 * Check if element is in viewport
 * @param element - HTML element
 * @returns Boolean indicating if element is visible
 */
export function isInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Measure and log performance metrics
 */
export function measurePerformance(metricName: string, callback: () => void): void {
    const start = performance.now();
    callback();
    const end = performance.now();
    console.log(`${metricName}: ${(end - start).toFixed(2)}ms`);
}

/**
 * Get Web Vitals metrics
 */
export function reportWebVitals(): void {
    if ('web-vital' in window) {
        // If using web-vitals library
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
            getCLS(console.log);
            getFID(console.log);
            getFCP(console.log);
            getLCP(console.log);
            getTTFB(console.log);
        });
    }
}

/**
 * Cache API responses in memory
 */
class APICache {
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private ttl: number = 5 * 60 * 1000; // 5 minutes default

    set(key: string, data: any, customTTL?: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now() + (customTTL || this.ttl),
        });
    }

    get(key: string): any | null {
        const item = this.cache.get(key);

        if (!item) return null;

        if (Date.now() > item.timestamp) {
            // Expired
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    clear(): void {
        this.cache.clear();
    }
}

export const apiCache = new APICache();
