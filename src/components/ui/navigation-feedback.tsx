"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { LoaderCircle } from "lucide-react";

/**
 * This component provides subtle visual feedback when navigating between pages.
 * It shows a small loading indicator at the top of the page rather than blocking the whole view.
 *
 * Improved to prevent flashing for quick navigations and ensure minimum display time for better UX.
 */
export default function NavigationFeedback() {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const showTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Config
  const LOADING_DELAY = 100; // Only show loading indicator after this delay (ms)
  const MIN_LOADING_TIME = 400; // Minimum time to show loading indicator (ms)

  // Reset navigation state when pathname changes
  useEffect(() => {
    // Clear any pending timers when navigation completes
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }

    // If we were navigating, ensure minimum display time
    if (isNavigating) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      hideTimerRef.current = setTimeout(() => {
        setIsNavigating(false);
        hideTimerRef.current = null;
      }, MIN_LOADING_TIME);
    }
  }, [pathname, isNavigating]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // Setup global click handler for navigation links
  useEffect(() => {
    // Function to intercept link clicks
    const handleLinkClick = (e: MouseEvent) => {
      // Only process link clicks
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (!link) return;

      // Ignore external links, anchor links, or links with target="_blank"
      const href = link.getAttribute("href");
      if (
        !href ||
        href.startsWith("http") ||
        href.startsWith("#") ||
        link.getAttribute("target") === "_blank"
      ) {
        return;
      }

      // Ignore if modifier keys are pressed (user might want to open in new tab)
      if (e.metaKey || e.ctrlKey || e.shiftKey) {
        return;
      }

      // Check if the link points to the current page
      if (href === pathname || href === `${pathname}/`) {
        // Don't show navigation indicator for same-page links
        return;
      }

      // Use a delayed timer to avoid showing loading indicator for fast navigations
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
      }

      showTimerRef.current = setTimeout(() => {
        setIsNavigating(true);
        showTimerRef.current = null;
      }, LOADING_DELAY);
    };

    document.addEventListener("click", handleLinkClick);
    return () => document.removeEventListener("click", handleLinkClick);
  }, [pathname]);

  // Don't render anything if not navigating
  if (!isNavigating) return null;

  // Render a subtle progress indicator
  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-olive-200 z-50 sm:hidden">
      <div
        className="h-full bg-olive-600 animate-pulse"
        style={{ width: "100%" }}
      ></div>

      {/* Small spinner in bottom-right corner */}
      <div className="fixed bottom-4 right-4 flex items-center bg-white border border-olive-200 px-3 py-2 rounded-full shadow-sm">
        <LoaderCircle className="w-4 h-4 animate-spin mr-2"></LoaderCircle>
        <span className="text-xs text-olive-800">Loading...</span>
      </div>
    </div>
  );
}
