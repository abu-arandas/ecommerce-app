import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Heart, ShoppingCart, Search } from 'lucide-react';
import { productsAPI, categoriesAPI } from '@/api/api';
import { useCartStore, useWishlistStore } from '@/store/store';
import { useToastStore } from '@/store/toastStore';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  description: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState(1000);
  const [sortBy, setSortBy] = useState('latest');

  const addToCart = useCartStore((state) => state.addItem);
  const wishlist = useWishlistStore((state) => state.items);
  const addToWishlist = useWishlistStore((state) => state.addItem);
  const removeFromWishlist = useWishlistStore((state) => state.removeItem);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory, priceRange, sortBy]);

  const fetchCategories = async () => {
    const { data } = await categoriesAPI.getAll();
    setCategories(data || []);
  };

  const fetchProducts = async () => {
    setLoading(true);
    let { data: allProducts } = await productsAPI.getAll();
    
    if (!allProducts) allProducts = [];

    // Filter by category
    if (selectedCategory) {
      allProducts = allProducts.filter((p: Product) => p.category_id === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      allProducts = allProducts.filter((p: Product) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by price
    allProducts = allProducts.filter((p: Product) => p.price <= priceRange);

    // Sort
    if (sortBy === 'price-low') {
      allProducts.sort((a: Product, b: Product) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      allProducts.sort((a: Product, b: Product) => b.price - a.price);
    } else if (sortBy === 'name') {
      allProducts.sort((a: Product, b: Product) => a.name.localeCompare(b.name));
    }

    setProducts(allProducts);
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: searchQuery });
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
      quantity: 1,
    });
    
    // Show toast notification
    addToast('success', `${product.name} added to cart!`, 3000);
  };

  const toggleWishlist = (product: Product) => {
    const isFavorited = wishlist.some((w) => w.productId === product.id);
    if (isFavorited) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '',
      });
    }
  };

  const isFavorited = (productId: string) => {
    return wishlist.some((w) => w.productId === productId);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-secondary mb-4">Shop Products</h1>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="input flex-1"
            />
            <button type="submit" className="btn-primary px-8" aria-label="Search">
              <Search size={20} />
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="md:col-span-1">
            <div className="card p-4 sticky top-4">
              <h3 className="font-bold text-lg mb-4 text-secondary">Filters</h3>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Category</h4>
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setSearchQuery('');
                    setSearchParams({});
                  }}
                  className={`block w-full text-left p-2 rounded ${
                    !selectedCategory ? 'bg-secondary text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSearchQuery('');
                      setSearchParams({});
                    }}
                    className={`block w-full text-left p-2 rounded ${
                      selectedCategory === cat.id ? 'bg-secondary text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Price Range</h4>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full"
                    aria-label="Price range"
                  />
                  <p className="text-sm text-gray-600">Up to ${priceRange}</p>
                </div>
              </div>

              {/* Sort */}
              <div>
                <h4 className="font-semibold mb-2">Sort By</h4>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input w-full"
                  aria-label="Sort by"
                >
                  <option value="latest">Latest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="md:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No products found. Try adjusting your filters.</p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-4">{products.length} products found</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
