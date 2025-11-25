import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { productsAPI } from '@/api/api';
import { useCartStore, useWishlistStore } from '@/store/store';
import ReviewsSection from '@/components/ReviewsSection';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category_id: string;
  created_at: string;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const addToCart = useCartStore((state) => state.addItem);
  const wishlist = useWishlistStore((state) => state.items);
  const addToWishlist = useWishlistStore((state) => state.addItem);
  const removeFromWishlist = useWishlistStore((state) => state.removeItem);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (product) {
      fetchRelatedProducts();
    }
  }, [product]);

  const fetchRelatedProducts = async () => {
    if (!product) return;
    const { data } = await productsAPI.getAll();
    if (data) {
      const related = data
        .filter((p: Product) => p.category_id === product.category_id && p.id !== product.id)
        .slice(0, 4);
      setRelatedProducts(related);
    }
  };

  useEffect(() => {
    if (!id) {
      console.error('No product ID provided');
      setError('No product ID provided');
      setLoading(false);
      return;
    }
    console.log('Fetching product with ID:', id);
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      console.log('Calling productsAPI.getById with id:', id);
      const { data, error: fetchError } = await productsAPI.getById(id!);
      console.log('API Response:', { data, error: fetchError });
      
      if (fetchError) {
        console.error('API Error:', fetchError);
        throw fetchError;
      }
      
      if (!data) {
        console.error('No product data returned');
        throw new Error('Product not found');
      }
      
      console.log('Successfully loaded product:', data);
      setProduct(data);
      setError('');
    } catch (err: any) {
      console.error('Error in fetchProduct:', err);
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const isFavorited = product ? wishlist.some((w) => w.productId === product.id) : false;

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
      quantity,
    });
    navigate('/cart');
  };

  const toggleWishlist = () => {
    if (!product) return;
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

  console.log('ProductDetail render state:', { loading, error, hasProduct: !!product, productId: product?.id });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="section text-center py-12">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-500">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="section text-center py-12">
          <p className="text-red-600 mb-4 text-lg font-semibold">{error || 'Product not found'}</p>
          <button
            onClick={() => navigate('/products')}
            className="btn-primary inline-block"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="section">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Images */}
          <div>
            <div className="bg-gray-100 rounded-lg overflow-hidden mb-4 h-96">
              {product.images?.[selectedImage] && (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-secondary' : 'border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-20 object-cover hover:opacity-75 transition"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-4xl font-bold text-secondary">{product.name}</h1>
              <button
                onClick={toggleWishlist}
                className="p-3 rounded-full hover:bg-gray-100 transition"
                aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  size={28}
                  className={isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                />
              </button>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                  />
                ))}
              </div>
              <span className="text-gray-600">(120 reviews)</span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <p className="text-3xl font-bold text-secondary mb-2">
                ${product.price.toFixed(2)}
              </p>
              <p className={`text-lg font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </p>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-6 leading-relaxed">
              {product.description}
            </p>

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-2 w-fit border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="px-3 py-1 disabled:opacity-50"
                >
                  −
                </button>
                <span className="px-4 py-1 border-l border-r">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="px-3 py-1 disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-lg mb-3"
            >
              <ShoppingCart size={24} /> Add to Cart
            </button>

            {/* Related Info */}
            <div className="border-t pt-6 space-y-3 text-sm">
              <p>
                <span className="font-semibold">SKU:</span> {product.id.substring(0, 8)}
              </p>
              <p>
                <span className="font-semibold">Category:</span> Beauty Products
              </p>
              <p>
                <span className="font-semibold">Shipping:</span> Free shipping on orders over $100
              </p>
              <p>
                <span className="font-semibold">Returns:</span> 30-day return policy
              </p>
            </div>
          </div>
        </div>



        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-secondary mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <ReviewsSection productId={product.id} />
      </div>
    </div>
  );
}
