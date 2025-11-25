import React, { useState } from 'react';
import { ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  if (!images || images.length === 0) {
    return (
      <div className="bg-gray-200 rounded-lg overflow-hidden h-96 flex items-center justify-center">
        <p className="text-gray-400">No image available</p>
      </div>
    );
  }

  const handleNextImage = () => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevImage();
    if (e.key === 'ArrowRight') handleNextImage();
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div 
        className="relative bg-gray-100 rounded-lg overflow-hidden h-96 md:h-[500px] group"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="img"
        aria-label={`${productName} image ${selectedIndex + 1} of ${images.length}`}
      >
        <div 
          className={`w-full h-full ${isZoomed ? 'scale-150 origin-center' : ''} transition-transform duration-200`}
          style={
            isZoomed
              ? {
                  transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                }
              : undefined
          }
        >
          <img
            src={images[selectedIndex]}
            alt={`${productName} - View ${selectedIndex + 1}`}
            className="w-full h-full object-cover"
            loading={selectedIndex === 0 ? 'eager' : 'lazy'}
          />
        </div>

        {/* Zoom Icon Indicator */}
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn size={20} />
        </div>

        {/* Navigation Arrows (only if multiple images) */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm font-medium">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Grid */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`
                relative rounded-lg overflow-hidden border-2 transition-all
                ${
                  selectedIndex === index
                    ? 'border-secondary ring-2 ring-secondary/30'
                    : 'border-gray-300 hover:border-gray-400'
                }
              `}
              aria-label={`View image ${index + 1}`}
              aria-current={selectedIndex === index}
            >
              <img
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
                className="w-full h-20 object-cover hover:opacity-75 transition"
                loading="lazy"
              />
              {selectedIndex === index && (
                <div className="absolute inset-0 border-2 border-secondary pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Mobile Swipe Dots (for touch devices) */}
      {images.length > 1 && (
        <div className="flex justify-center gap-2 md:hidden">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`
                w-2 h-2 rounded-full transition-all
                ${selectedIndex === index ? 'bg-secondary w-6' : 'bg-gray-300'}
              `}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
