"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Calendar,
  Users,
  Settings,
  Shield,
  AlertCircle,
  LogOut,
  LoaderCircle,
  Menu,
  X,
} from "lucide-react";
import { useStudioAuth } from "../providers";
import { useStudio } from "@/lib/hooks/use-studio";
import Modal from "../ui/modal";
import Button from "../ui/button";
import Link from "next/link";

const MIN_LOADING_TIME = 300;
const LOADING_DELAY = 100;

type Timers = {
  showTimer: NodeJS.Timeout;
  hideTimer?: () => NodeJS.Timeout;
};

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useStudioAuth();
  const { useLicenseStatusQuery } = useStudio();
  const { data: licenseStatus, isLoading: isLoadingLicense } =
    useLicenseStatusQuery();

  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [loadingTimers, setLoadingTimers] = useState<Record<string, Timers>>(
    {}
  );

  useEffect(() => {
    if (licenseStatus?.active && licenseStatus.license?.expiresAt) {
      const expiryDate = new Date(licenseStatus.license.expiresAt);
      const today = new Date();
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(diffDays);
    }
  }, [licenseStatus]);

  // Reset navigation state and mobile sidebar when pathname changes
  useEffect(() => {
    setNavigatingTo(null);
    setIsMobileSidebarOpen(false);

    // Clear any pending timers
    Object.values(loadingTimers).forEach((timer) => {
      if (timer.showTimer) clearTimeout(timer.showTimer);
    });
    setLoadingTimers({});
  }, [pathname]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      Object.values(loadingTimers).forEach((timer) => {
        if (timer.showTimer) clearTimeout(timer.showTimer);
      });
    };
  }, [loadingTimers]);

  const getLicenseStatusColor = () => {
    if (isLoadingLicense) {
      return "text-gray-500";
    }
    if (!licenseStatus?.active) return "text-red-500";
    if (daysRemaining !== null) {
      if (daysRemaining <= 7) return "text-red-500";
      if (daysRemaining <= 14) return "text-amber-500";
      return "text-green-500";
    }
    return "text-green-500";
  };

  const getLicenseIcon = () => {
    if (!licenseStatus?.active) return AlertCircle;
    if (daysRemaining !== null && daysRemaining <= 7) return AlertCircle;
    return Shield;
  };

  const handleSignOut = () => {
    setShowSignOutModal(true);
  };

  const confirmSignOut = () => {
    signOut();
    setShowSignOutModal(false);
  };

  const cancelSignOut = () => {
    setShowSignOutModal(false);
  };

  // Custom navigation handler with improved loading state
  const handleNavigation = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();

    // Don't navigate if we're already on this page
    if (pathname === path || pathname === `${path}/`) {
      return;
    }

    // Set up a delayed timer to show the loading state
    const timers: Timers = {
      showTimer: setTimeout(() => {
        setNavigatingTo(path);
      }, LOADING_DELAY),
    };

    setLoadingTimers((prev) => ({
      ...prev,
      [path]: timers,
    }));

    // Close mobile sidebar
    setIsMobileSidebarOpen(false);

    // Navigate to the new page
    router.push(path);

    // Set a minimum display time for the loading indicator
    timers.hideTimer = () =>
      setTimeout(() => {
        setNavigatingTo(null);

        setLoadingTimers((prev) => {
          const newTimers = { ...prev };
          delete newTimers[path];
          return newTimers;
        });
      }, MIN_LOADING_TIME + LOADING_DELAY);
  };

  const LicenseIcon = getLicenseIcon();

  if (!user) return null;

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  const renderNavigation = () => (
    <nav className="flex-1 pt-4">
      <div className="p-4 border-b border-gray-100 text-center hidden md:block">
        <h1 className="text-xl font-serif text-olive-900">fitness</h1>
        <p className="text-xs text-olive-700 italic">studio management</p>
      </div>
      <Link
        href="/dashboard"
        onClick={handleNavigation("/dashboard")}
        className={`w-full flex items-center p-3 md:px-4 ${
          isActive("/dashboard")
            ? "text-olive-600 bg-olive-50"
            : navigatingTo === "/dashboard"
            ? "text-olive-600 bg-olive-50/70"
            : "text-gray-600 hover:bg-olive-50"
        }`}
      >
        <Home size={20} className="mx-0 mr-3" />
        <span>Dashboard</span>
        {navigatingTo === "/dashboard" && (
          <LoaderCircle className="hidden md:inline-block ml-2 h-4 w-4 animate-spin"></LoaderCircle>
        )}
      </Link>
      <Link
        href="/classes"
        onClick={handleNavigation("/classes")}
        className={`w-full flex items-center p-3 md:px-4 ${
          isActive("/classes")
            ? "text-olive-600 bg-olive-50"
            : navigatingTo === "/classes"
            ? "text-olive-600 bg-olive-50/70"
            : "text-gray-600 hover:bg-olive-50"
        }`}
      >
        <Calendar size={20} className="mx-0 mr-3" />
        <span>Classes</span>
        {navigatingTo === "/classes" && (
          <LoaderCircle className="hidden md:inline-block ml-2 h-4 w-4 animate-spin"></LoaderCircle>
        )}
      </Link>
      <Link
        href="/bookings"
        onClick={handleNavigation("/bookings")}
        className={`w-full flex items-center p-3 md:px-4 ${
          isActive("/bookings")
            ? "text-olive-600 bg-olive-50"
            : navigatingTo === "/bookings"
            ? "text-olive-600 bg-olive-50/70"
            : "text-gray-600 hover:bg-olive-50"
        }`}
      >
        <Users size={20} className="mx-0 mr-3" />
        <span>Bookings</span>
        {navigatingTo === "/bookings" && (
          <LoaderCircle className="hidden md:inline-block ml-2 h-4 w-4 animate-spin"></LoaderCircle>
        )}
      </Link>
      <Link
        href="/settings"
        onClick={handleNavigation("/settings")}
        className={`w-full flex items-center p-3 md:px-4 ${
          isActive("/settings")
            ? "text-olive-600 bg-olive-50"
            : navigatingTo === "/settings"
            ? "text-olive-600 bg-olive-50/70"
            : "text-gray-600 hover:bg-olive-50"
        }`}
      >
        <Settings size={20} className="mx-0 mr-3" />
        <span>Settings</span>
        {navigatingTo === "/settings" && (
          <LoaderCircle className="hidden md:inline-block ml-2 h-4 w-4 animate-spin"></LoaderCircle>
        )}
      </Link>
    </nav>
  );

  const renderLicenseStatus = () => (
    <div className="border-t border-gray-100 p-3">
      <div
        className={`flex items-center p-2 rounded-lg ${getLicenseStatusColor()}`}
      >
        <LicenseIcon size={16} className="mr-2" />
        <div className="flex-1 text-sm">
          <div className="font-medium">
            {licenseStatus?.active ? "License Active" : "License Inactive"}
          </div>
          <div className="text-xs">
            {isLoadingLicense ? (
              "Loading..."
            ) : licenseStatus?.active ? (
              <>
                {licenseStatus.license?.type || "Standard"} ·
                {daysRemaining !== null ? (
                  <span> {daysRemaining} days left</span>
                ) : (
                  <span> Valid</span>
                )}
              </>
            ) : (
              "Renew now"
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserSection = () => (
    <div className="border-t border-gray-100">
      <div className="p-4 flex items-center">
        <div className="w-8 h-8 bg-olive-200 rounded-full flex items-center justify-center text-olive-600 font-medium">
          {user.email?.charAt(0).toUpperCase() || "S"}
        </div>
        <div className="ml-2">
          <div className="text-sm font-medium">Studio Admin</div>
          <div className="text-xs text-gray-500">{user.email}</div>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="w-full flex justify-center items-center p-3 md:px-4 text-gray-600 hover:bg-olive-50"
      >
        <LogOut size={20} className="mr-3" />
        <span>Sign Out</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Hamburger Menu for Mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-40 flex justify-between items-center p-4">
        <div className="flex items-center">
          <h1 className="text-xl font-serif text-olive-900 ml-2">fitness</h1>
        </div>
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="text-olive-600"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Desktop and Mobile Sidebar */}
      <div
        className={`
          fixed top-0 left-0 bottom-0 w-64 bg-white shadow-sm z-50 
          transform transition-transform duration-300 ease-in-out
          md:translate-x-0
          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Mobile Header */}
          <div className="md:hidden p-4 border-b border-gray-100 flex justify-between items-center">
            <h1 className="text-xl font-serif text-olive-900">fitness</h1>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="text-olive-600"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          {renderNavigation()}

          {/* License Status */}
          {renderLicenseStatus()}

          {/* User Section */}
          {renderUserSection()}
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      <Modal
        isOpen={showSignOutModal}
        onClose={cancelSignOut}
        title="Sign Out Confirmation"
      >
        <div className="p-2">
          <p className="mb-6">
            Are you sure you want to sign out of your account?
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={cancelSignOut}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmSignOut}>
              Yes, Sign Out
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Sidebar;
