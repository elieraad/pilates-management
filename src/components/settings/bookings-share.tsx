"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { useStudioAuth } from "../providers";
import { URLSafeUUIDShortener } from "@/lib/utils/url-encodings";

const BookingShareComponent = () => {
  const { user } = useStudioAuth();
  const [copied, setCopied] = useState(false);

  // Base URL of your deployed application
  let bookingUrl = "Loading...";
  if (user) {
    const baseUrl =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`
        : "https://axiomtech.me"; // Fallback

    const id = user ? URLSafeUUIDShortener.encode(user.id) : "";
    bookingUrl = `${baseUrl}/studios/${id}`;
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-6">
      <p className="text-sm	text-gray-600 mb-2">
        Share this link with your clients so they can book sessions directly:
      </p>

      <div className="flex items-center">
        <div className="flex-1 bg-olive-50 p-3 rounded-l-lg border border-olive-100 truncate">
          {bookingUrl}
        </div>
        <button
          className="bg-olive-600 text-white p-3 rounded-r-lg hover:bg-olive-700 transition-colors"
          onClick={copyToClipboard}
        >
          {copied ? "Copied!" : <Copy className="w-4 h-4 m-1" />}
        </button>
      </div>
    </div>
  );
};

export default BookingShareComponent;
