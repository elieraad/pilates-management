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
} from "lucide-react";
import { useStudioAuth } from "../providers";
import { useStudio } from "@/lib/hooks/use-studio";
import Modal from "../ui/modal";
import Button from "../ui/button";

const MIN_LOADING_TIME = 300; // Minimum loading indication time in milliseconds
const LOADING_DELAY = 100; // Only show loading state after this delay

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

  // Reset navigation state when pathname changes
  useEffect(() => {
    setNavigatingTo(null);

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

  return (
    <div className="w-16 md:w-64 bg-white shadow-sm flex flex-col h-screen fixed">
      <div className="p-4 border-b border-gray-100 text-center hidden md:block">
        <h1 className="text-xl font-serif text-olive-900">pilates</h1>
        <p className="text-xs text-olive-700 italic">studio management</p>
      </div>

      {/* Mobile Logo */}
      <div className="p-4 flex items-center justify-center md:hidden border-b border-gray-100">
        <h1 className="text-xl font-serif text-olive-900">P</h1>
      </div>

      <nav className="flex-1 pt-4">
        <a
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
          <Home size={20} className="mx-auto md:mx-0 md:mr-3" />
          <span className="hidden md:block">Dashboard</span>
          {navigatingTo === "/dashboard" && (
            <LoaderCircle className="hidden md:inline-block ml-2 h-4 w-4 animate-spin"></LoaderCircle>
          )}
        </a>
        <a
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
          <Calendar size={20} className="mx-auto md:mx-0 md:mr-3" />
          <span className="hidden md:block">Classes</span>
          {navigatingTo === "/classes" && (
            <LoaderCircle className="hidden md:inline-block ml-2 h-4 w-4 animate-spin"></LoaderCircle>
          )}
        </a>
        <a
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
          <Users size={20} className="mx-auto md:mx-0 md:mr-3" />
          <span className="hidden md:block">Bookings</span>
          {navigatingTo === "/bookings" && (
            <LoaderCircle className="hidden md:inline-block ml-2 h-4 w-4 animate-spin"></LoaderCircle>
          )}
        </a>
        <a
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
          <Settings size={20} className="mx-auto md:mx-0 md:mr-3" />
          <span className="hidden md:block">Settings</span>
          {navigatingTo === "/settings" && (
            <LoaderCircle className="hidden md:inline-block ml-2 h-4 w-4 animate-spin"></LoaderCircle>
          )}
        </a>
      </nav>

      {/* License Status Section */}
      <div className="hidden md:block border-t border-gray-100 p-3">
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

      <div className="border-t border-gray-100 hidden md:block">
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
          <span className=" hidden md:block">Sign Out</span>
        </button>
      </div>

      {/* Mobile License Status Indicator */}
      <div className="md:hidden flex justify-center border-t border-gray-100 p-2">
        <div
          className={`flex items-center justify-center ${getLicenseStatusColor()}`}
        >
          <LicenseIcon size={20} />
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
    </div>
  );
};

export default Sidebar;
