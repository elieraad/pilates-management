"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type PublicNavbarProps = {
  studioName: string;
  studioLogo?: string | null;
};

const PublicNavbar = ({ studioName, studioLogo }: PublicNavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Name */}
          <div className="flex items-center">
            {studioLogo ? (
              <Image
                src={studioLogo}
                alt={`${studioName} logo`}
                className="h-8 w-8 rounded-full mr-2"
              />
            ) : (
              <div className="h-8 w-8 bg-olive-100 rounded-full flex items-center justify-center mr-2">
                <span className="text-olive-600 font-serif font-medium">
                  {studioName.charAt(0)}
                </span>
              </div>
            )}
            <span className="font-serif text-olive-900 text-lg">
              {studioName}
            </span>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              className="text-gray-500 hover:text-olive-600"
              onClick={toggleMenu}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#classes" className="text-olive-800 hover:text-olive-600">
              Classes
            </Link>
            <Link href="#about" className="text-olive-800 hover:text-olive-600">
              About
            </Link>
            <Link href="#contact" className="text-olive-800 hover:text-olive-600">
              Contact
            </Link>
            <Link
              href="#book"
              className="px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors"
            >
              Book Now
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-4 space-y-1 bg-white shadow-lg">
            <Link
              href="#classes"
              className="block px-3 py-2 rounded-md text-base font-medium text-olive-800 hover:bg-olive-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Classes
            </Link>
            <Link
              href="#about"
              className="block px-3 py-2 rounded-md text-base font-medium text-olive-800 hover:bg-olive-50"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="#contact"
              className="block px-3 py-2 rounded-md text-base font-medium text-olive-800 hover:bg-olive-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="#book"
              className="block px-3 py-2 text-center bg-olive-600 text-white rounded-md text-base font-medium hover:bg-olive-700 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Book Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;
