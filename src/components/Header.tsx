/* eslint-disable react-hooks/immutability */
import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, LogOut, User } from "lucide-react";
import { useCartStore, useAuthStore } from "../store/store.ts";
import { authAPI } from "../api/api.ts";

interface HeaderProps {
  onMenuToggle?: (open: boolean) => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const cartItems = useCartStore((state) => state.items);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data } = await authAPI.getSession();
    if (data.session?.user) {
      setUser(data.session.user);
    }
  };

  const clearCart = useCartStore((state) => state.clearCart);

  const handleLogout = async () => {
    await authAPI.logout();
    clearCart();
    setUser(null);
    setShowUserMenu(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const toggleMobileMenu = () => {
    const newState = !mobileMenuOpen;
    setMobileMenuOpen(newState);
    onMenuToggle?.(newState);
  };

  const role = useAuthStore((state) => state.role);

  const isAdmin = role === 'admin';

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-secondary">
          BeautyHub
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className={`${
              isActive("/") ? "text-secondary font-semibold" : "text-gray-700"
            } hover:text-secondary transition`}
          >
            Home
          </Link>
          <Link
            to="/products"
            className={`${
              isActive("/products")
                ? "text-secondary font-semibold"
                : "text-gray-700"
            } hover:text-secondary transition`}
          >
            Shop
          </Link>
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className={`${
                isActive("/admin/dashboard")
                  ? "text-secondary font-semibold"
                  : "text-gray-700"
              } hover:text-secondary transition`}
            >
              Admin
            </Link>
          )}
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-4">
          {/* Cart */}
          <Link
            to="/cart"
            className="relative p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ShoppingCart size={24} />
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </Link>

          {/* User Menu */}
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg transition flex items-center gap-2"
                aria-label="User menu"
              >
                <User size={24} />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    My Orders
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="btn-secondary hidden sm:block">
                Sign In
              </Link>
              <Link to="/signup" className="btn-primary hidden sm:block">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-50 border-t px-4 py-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-2 hover:bg-gray-200 rounded-lg text-gray-700"
          >
            Home
          </Link>
          <Link
            to="/products"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-2 hover:bg-gray-200 rounded-lg text-gray-700"
          >
            Shop
          </Link>
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 hover:bg-gray-200 rounded-lg text-gray-700"
            >
              Admin
            </Link>
          )}
          {!user && (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 hover:bg-gray-200 rounded-lg text-gray-700"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 hover:bg-gray-200 rounded-lg text-gray-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
