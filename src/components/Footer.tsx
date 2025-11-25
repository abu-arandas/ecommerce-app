import React from "react";
import { Link } from "react-router-dom";
import Newsletter from "./Newsletter";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Newsletter Section */}
      <Newsletter />
      
      <footer className="bg-secondary text-white pt-12 pb-6">
        <div className="section py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-2xl font-bold mb-4">BeautyHub</h3>
              <p className="text-accent">
                Premium accessories and makeup for every occasion
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="hover:text-accent transition">Home</Link></li>
                <li><Link to="/products" className="hover:text-accent transition">Shop</Link></li>
                <li><a href="#" className="hover:text-accent transition">About Us</a></li>
                <li><a href="#" className="hover:text-accent transition">Contact</a></li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="font-semibold mb-4">Categories</h4>
              <ul className="space-y-2">
                <li><Link to="/products?category=makeup" className="hover:text-accent transition">Makeup</Link></li>
                <li><Link to="/products?category=accessories" className="hover:text-accent transition">Accessories</Link></li>
                <li><a href="#" className="hover:text-accent transition">New Arrivals</a></li>
                <li><a href="#" className="hover:text-accent transition">Sale</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Get in Touch</h4>
              <p className="mb-4 flex items-center gap-2">
                <Mail size={18} /> support@beautyhub.com
              </p>
              <div className="flex gap-4">
                <a href="#" className="hover:text-accent transition" aria-label="Facebook">
                  <Facebook size={24} />
                </a>
                <a href="#" className="hover:text-accent transition" aria-label="Instagram">
                  <Instagram size={24} />
                </a>
                <a href="#" className="hover:text-accent transition" aria-label="Twitter">
                  <Twitter size={24} />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-accent pt-8 text-center">
            <p className="text-accent">
              &copy; {currentYear} BeautyHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
