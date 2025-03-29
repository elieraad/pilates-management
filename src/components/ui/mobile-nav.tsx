"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useStudioAuth } from "../providers";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useStudioAuth();
  const pathname = usePathname();

  if (!user) return null;

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="block md:hidden">
      <button onClick={toggleMenu} className="p-2 text-olive-600">
        <Menu size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="bg-white h-full w-64 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl font-serif text-olive-900">pilates</h1>
              <button onClick={toggleMenu}>
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <nav className="flex-1">
              <Link
                href="/dashboard"
                className={`block py-3 ${
                  pathname.startsWith("/dashboard")
                    ? "text-olive-600"
                    : "text-gray-600"
                }`}
                onClick={toggleMenu}
              >
                Dashboard
              </Link>
              <Link
                href="/classes"
                className={`block py-3 ${
                  pathname.startsWith("/classes")
                    ? "text-olive-600"
                    : "text-gray-600"
                }`}
                onClick={toggleMenu}
              >
                Classes
              </Link>
              <Link
                href="/bookings"
                className={`block py-3 ${
                  pathname.startsWith("/bookings")
                    ? "text-olive-600"
                    : "text-gray-600"
                }`}
                onClick={toggleMenu}
              >
                Bookings
              </Link>
              <Link
                href="/settings"
                className={`block py-3 ${
                  pathname.startsWith("/settings")
                    ? "text-olive-600"
                    : "text-gray-600"
                }`}
                onClick={toggleMenu}
              >
                Settings
              </Link>
            </nav>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-olive-200 rounded-full flex items-center justify-center text-olive-600 font-medium">
                  {user.email?.charAt(0).toUpperCase() || "S"}
                </div>
                <div className="ml-2">
                  <div className="text-sm font-medium">Studio Admin</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  signOut();
                  toggleMenu();
                }}
                className="text-sm text-olive-600 hover:underline"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileNav;
