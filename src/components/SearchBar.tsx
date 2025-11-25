import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '@/api/api';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showAutocomplete?: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  category_id: string;
}

export default function SearchBar({ 
  value, 
  onChange, 
  placeholder = 'Search products...', 
  showAutocomplete = true 
}: SearchBarProps) {
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const debounceTimer = useRef<number | null>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debouncing
  useEffect(() => {
    if (!showAutocomplete) return;

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Don't search for empty or very short queries
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce: wait 300ms after user stops typing
    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { data, error } = await productsAPI.search(value);
        
        if (error) {
          console.error('Search error:', error);
          setSuggestions([]);
        } else if (data) {
          // Limit to 5 suggestions
          setSuggestions(data.slice(0, 5));
          setShowSuggestions(data.length > 0);
        }
      } catch (err) {
        console.error('Search failed:', err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, showAutocomplete]);

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleSelectSuggestion = (product: Product) => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    navigate(`/product/${product.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none text-gray-900 placeholder-gray-500"
          autoComplete="off"
          aria-label="Search products"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={String(showSuggestions)}
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition"
            aria-label="Clear search"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {showSuggestions && showAutocomplete && (
        <div 
          id="search-suggestions"
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
          role="listbox"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-secondary rounded-full animate-spin" />
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => handleSelectSuggestion(product)}
                  className={`
                    w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition
                    ${selectedIndex === index ? 'bg-gray-100' : ''}
                    ${index !== 0 ? 'border-t border-gray-100' : ''}
                  `}
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  {/* Product Image */}
                  {product.images?.[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  
                  {/* Product Info */}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {highlightMatch(product.name, value)}
                    </p>
                    <p className="text-sm text-gray-600">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Arrow Icon */}
                  <svg 
                    className="w-4 h-4 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 5l7 7-7 7" 
                    />
                  </svg>
                </button>
              ))}
              
              {/* "View all results" link */}
              <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                <button
                  onClick={() => {
                    setShowSuggestions(false);
                    navigate(`/products?search=${encodeURIComponent(value)}`);
                  }}
                  className="text-sm text-secondary font-medium hover:underline"
                >
                  View all results for "{value}"
                </button>
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No products found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
