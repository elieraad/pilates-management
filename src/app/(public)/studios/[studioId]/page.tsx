"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Phone,
  ChevronLeft,
  ChevronRight,
  Check,
  Info,
  Download,
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils/date-utils";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { URLSafeUUIDShortener } from "@/lib/utils/url-encodings";
import { QRCodeSVG } from "qrcode.react";

interface Studio {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  email: string;
  description: string | null;
  opening_hours: string | null;
}

interface Class {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  capacity: number;
  price: number;
  instructor: string;
}

interface ClassSession {
  id: string;
  class_id: string;
  start_time: string;
  is_recurring: boolean;
  class: Class;
  bookings_count: number;
  is_cancelled: boolean;
}

interface ClientInfo {
  name: string;
  email: string;
  phone: string;
}

export default function StudioPublicPage({
  params,
}: {
  params: { studioId: string };
}) {
  // Get current date and date 30 days from now
  const days = 30;

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  const studioId = URLSafeUUIDShortener.decode(params.studioId);
  const [studio, setStudio] = useState<Studio | null>(null);
  const [bookingConfirmation, setBookingConfirmation] = useState<string>();

  const availableDates = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i + 2);
      return futureDate.toISOString().split("T")[0];
    });
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const futureDate = new Date();
    futureDate.setDate(startDate.getDate() + 2);
    return futureDate.toISOString().split("T")[0];
  });
  const [sessionsByClassId, setSessionsByClassId] = useState<
    Record<string, ClassSession[]>
  >({});
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [bookingStep, setBookingStep] = useState(0);
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    name: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Ref for date scroll
  const dateScrollRef = useRef<HTMLDivElement>(null);

  // Scroll through dates
  const scrollDates = (direction: "left" | "right") => {
    if (dateScrollRef.current) {
      const scrollAmount = direction === "left" ? -200 : 200;
      dateScrollRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Fetch studio information and available sessions in a single API call
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const supabase = createClient();

        // Fetch studio info
        const { data: studioData, error: studioError } = await supabase
          .from("studios")
          .select("*")
          .eq("id", studioId)
          .single();

        if (studioError) throw studioError;
        setStudio(studioData);

        // Fetch all available sessions with class info
        const response = await fetch(
          `/api/public/studios/${studioId}/sessions?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );

        if (!response.ok) throw new Error("Failed to fetch sessions");

        const sessions = await response.json();

        // Group sessions by class ID
        const groupedSessions: Record<string, ClassSession[]> = {};
        sessions.forEach((session: ClassSession) => {
          if (!groupedSessions[session.class_id]) {
            groupedSessions[session.class_id] = [];
          }
          groupedSessions[session.class_id].push(session);
        });
        setSessionsByClassId(groupedSessions);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [studioId]);

  // Handle booking submission
  const handleBooking = async () => {
    if (!selectedSession || !clientInfo.name || !clientInfo.email) return;

    setIsSubmitting(true);
    setBookingError("");

    try {
      const sessionDate = new Date(selectedSession.start_time)
        .toISOString()
        .split("T")[0];

      const body = JSON.stringify({
        studio_id: studioId,
        class_session_id: selectedSession.id,
        client_name: clientInfo.name,
        client_email: clientInfo.email,
        client_phone: clientInfo.phone || undefined,
        sessionDate: sessionDate,
      });

      const response = await fetch("/api/public/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      if (!response.ok) {
        throw new Error("Failed to create booking");
      }

      const { booking } = await response.json();

      const bookingId = booking[0].booking_id;
      setBookingConfirmation(bookingId);

      // Update the local state to increment the booking count
      setSessionsByClassId((prevSessions) => {
        const updatedSessions = { ...prevSessions };
        const classId = selectedSession.class_id;

        if (updatedSessions[classId]) {
          updatedSessions[classId] = updatedSessions[classId].map((session) => {
            if (session.id === selectedSession.id) {
              return {
                ...session,
                bookings_count: session.bookings_count + 1,
              };
            }
            return session;
          });
        }

        return updatedSessions;
      });

      setBookingStep(2); // Success step
    } catch (error: unknown) {
      console.error("Booking error:", error);
      setBookingError("Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById("booking-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `booking-${bookingConfirmation}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  // Get sessions for selected date grouped by class
  const classesWithSessions = useMemo(() => {
    const classIds = Object.keys(sessionsByClassId);

    const filteredData = classIds
      .map((classId) => {
        const sessionsForClass = sessionsByClassId[classId]
          .filter((session) => {
            const sessionDate = new Date(session.start_time)
              .toISOString()
              .split("T")[0];
            return sessionDate === selectedDate;
          })
          .sort((a, b) => {
            return (
              new Date(a.start_time).getTime() -
              new Date(b.start_time).getTime()
            );
          });

        if (sessionsForClass.length === 0) return null;

        return {
          class: sessionsForClass[0].class,
          sessions: sessionsForClass,
        };
      })
      .filter((x) => x !== null);

    return filteredData;
  }, [sessionsByClassId, selectedDate]);

  if (!loading && !studio) {
    return (
      <div className="min-h-screen bg-olive-50 flex justify-center items-center text-center p-4">
        <div>
          <h1 className="text-2xl font-serif text-olive-900 mb-2">
            Studio Not Found
          </h1>
          <p className="text-olive-700 mb-6">
            {`We couldn't find the studio you're looking for.`}
          </p>
          <Link
            href="/"
            className="px-6 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const formatDateObj = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      full: formatDate(dateString),
    };
  };

  const renderSessionPlaceholder = () => {
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-olive-50 p-3">
          <div className="h-5 bg-olive-200 rounded w-3/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-olive-200 rounded w-1/2 mb-2 animate-pulse"></div>
          <div className="flex items-center text-sm mt-2">
            <div className="flex items-center mr-4">
              <Clock className="w-4 h-4 text-olive-600 mr-1 animate-pulse" />
              <div className="h-4 bg-olive-200 rounded w-12 animate-pulse"></div>
            </div>
            <div className="flex items-center mr-4">
              <Users className="w-4 h-4 text-olive-600 mr-1 animate-pulse" />
              <div className="h-4 bg-olive-200 rounded w-12 animate-pulse"></div>
            </div>
            <div className="h-4 bg-olive-200 rounded w-10 animate-pulse"></div>
          </div>
          <div className="h-4 bg-olive-200 rounded w-1/3 mt-2 animate-pulse"></div>
        </div>

        <div className="p-3">
          <div className="h-4 bg-olive-200 rounded w-1/2 mb-2 animate-pulse"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((_, index) => (
              <div
                key={index}
                className="p-2 rounded-lg border border-gray-200 bg-olive-100 text-center"
              >
                <div className="h-4 bg-olive-300 rounded w-1/2 mx-auto mb-1 animate-pulse"></div>
                <div className="h-3 bg-olive-300 rounded w-1/3 mx-auto animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-olive-50">
      {/* Compact Studio Header */}
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-serif text-olive-900">
                {studio ? (
                  studio.name
                ) : (
                  <div className="h-8 bg-olive-200 rounded w-48 animate-pulse"></div>
                )}
              </h1>
              {studio?.description && (
                <p className="text-olive-700 text-sm italic">
                  {studio?.description}
                </p>
              )}
            </div>
            <div className="text-sm text-olive-600 hidden md:block">
              {studio ? (
                studio?.phone && (
                  <div className="flex items-center mb-1">
                    <Phone className="w-4 h-4 mr-1" />
                    <span>{studio?.phone}</span>
                  </div>
                )
              ) : (
                <div className="h-4 bg-olive-200 rounded w-24 mb-1 animate-pulse"></div>
              )}

              {studio ? (
                studio?.address && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{studio?.address}</span>
                  </div>
                )
              ) : (
                <div className="h-4 bg-olive-200 rounded w-32 animate-pulse"></div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content - Focused on booking */}
      <main className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="mb-4 pb-3 border-b border-gray-100">
            <h2 className="text-xl font-serif text-olive-900">Book a Class</h2>
          </div>

          {bookingStep === 0 && (
            <>
              {/* Horizontal date picker */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Select a Date</h3>
                  {availableDates.length > 1 && (
                    <div className="flex space-x-1">
                      <button
                        className="rounded-full p-1 hover:bg-olive-50"
                        onClick={() => scrollDates("left")}
                      >
                        <ChevronLeft className="w-5 h-5 text-olive-600" />
                      </button>
                      <button
                        className="rounded-full p-1 hover:bg-olive-50"
                        onClick={() => scrollDates("right")}
                      >
                        <ChevronRight className="w-5 h-5 text-olive-600" />
                      </button>
                    </div>
                  )}
                </div>

                {availableDates.length > 0 ? (
                  <div className="relative">
                    <div
                      className="flex overflow-x-auto py-2 scrollbar-hide"
                      ref={dateScrollRef}
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                    >
                      {availableDates.map((date) => {
                        const dateObj = formatDateObj(date);
                        const isSelected = date === selectedDate;

                        return (
                          <button
                            key={date}
                            className={`flex-shrink-0 w-16 h-20 mx-1 flex flex-col items-center justify-center rounded-lg transition-colors ${
                              isSelected
                                ? "bg-olive-600 text-white"
                                : "bg-olive-50 text-olive-800 hover:bg-olive-100"
                            }`}
                            onClick={() => setSelectedDate(date)}
                          >
                            <span className="text-xs font-medium">
                              {dateObj.month}
                            </span>
                            <span className="text-xl font-medium">
                              {dateObj.day}
                            </span>
                            <span className="text-xs">{dateObj.weekday}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3 bg-olive-50 rounded-lg">
                    <p className="text-olive-700">No available dates</p>
                  </div>
                )}
              </div>

              {/* Classes and time slots for selected date */}
              <div>
                <h3 className="font-medium mb-3">
                  {loading
                    ? "Loading Available Classes"
                    : `Available Classes for ${
                        formatDateObj(selectedDate).full
                      }`}
                </h3>

                {loading ? (
                  renderSessionPlaceholder()
                ) : classesWithSessions && classesWithSessions.length > 0 ? (
                  <div className="space-y-5">
                    {classesWithSessions.map(({ class: cls, sessions }) => (
                      <div
                        key={cls.id}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <div className="bg-olive-50 p-3">
                          <h4 className="font-medium text-olive-900">
                            {cls.name}
                          </h4>
                          {cls.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {cls.description}
                            </p>
                          )}
                          <div className="flex items-center text-sm mt-2">
                            <div className="flex items-center mr-4">
                              <Clock className="w-4 h-4 text-olive-600 mr-1" />
                              <span>{cls.duration} min</span>
                            </div>
                            <div className="flex items-center mr-4">
                              <Users className="w-4 h-4 text-olive-600 mr-1" />
                              <span>Max {cls.capacity}</span>
                            </div>
                            <div className="font-medium text-olive-800">
                              ${cls.price}
                            </div>
                          </div>
                          <p className="text-sm mt-1">
                            Instructor:{" "}
                            <span className="font-medium">
                              {cls.instructor}
                            </span>
                          </p>
                        </div>

                        <div className="p-3">
                          <h5 className="text-sm font-medium text-gray-600 mb-2">
                            Available Times:
                          </h5>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                            {sessions.map((session) => (
                              <button
                                key={session.id}
                                className={`p-2 rounded-lg border text-center ${
                                  selectedSession?.id === session.id
                                    ? "border-olive-600 bg-olive-50 text-olive-900"
                                    : session.class.capacity -
                                        session.bookings_count <=
                                      0
                                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                    : "border-gray-200 hover:border-olive-300 hover:bg-olive-50/50"
                                }`}
                                onClick={() => {
                                  if (
                                    session.class.capacity -
                                      session.bookings_count >
                                    0
                                  ) {
                                    setSelectedSession(session);
                                  }
                                }}
                                disabled={
                                  session.class.capacity -
                                    session.bookings_count <=
                                  0
                                }
                              >
                                <div className="font-medium">
                                  {formatTime(session.start_time)}
                                </div>
                                <div className="text-xs mt-1">
                                  {session.class.capacity -
                                    session.bookings_count <=
                                  0
                                    ? "Full"
                                    : `${
                                        session.class.capacity -
                                        session.bookings_count
                                      } spots`}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-olive-50 rounded-lg">
                    <Calendar className="w-10 h-10 text-olive-300 mx-auto mb-2" />
                    <p className="text-olive-700">
                      No classes available on this date
                    </p>
                  </div>
                )}
              </div>

              {selectedSession && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="bg-olive-50 p-3 rounded-lg mb-4">
                    <h4 className="font-medium text-olive-900 mb-1">
                      Selected Session:
                    </h4>
                    <p>
                      <span className="font-medium">
                        {selectedSession.class.name}
                      </span>{" "}
                      at{" "}
                      <span className="font-medium">
                        {formatTime(selectedSession.start_time)}
                      </span>{" "}
                      on{" "}
                      <span className="font-medium">
                        {formatDate(selectedSession.start_time)}
                      </span>
                    </p>
                  </div>

                  <button
                    className="w-full py-3 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors"
                    onClick={() => setBookingStep(1)}
                  >
                    Continue to Book
                  </button>
                </div>
              )}
            </>
          )}

          {/* Step 2: Client Details */}
          {bookingStep === 1 && (
            <div>
              <button
                className="mb-5 text-olive-600 flex items-center text-sm"
                onClick={() => setBookingStep(0)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Class Selection
              </button>

              {selectedSession && (
                <div className="bg-olive-50 p-3 rounded-lg mb-5">
                  <h4 className="font-medium text-olive-900 mb-1">
                    Your Selection:
                  </h4>
                  <p className="font-medium">{selectedSession.class.name}</p>
                  <div className="flex items-center text-sm mt-1">
                    <Calendar className="w-4 h-4 text-olive-600 mr-1" />
                    <span className="text-gray-600 mr-3">
                      {formatDate(selectedSession.start_time)}
                    </span>
                    <Clock className="w-4 h-4 text-olive-600 mr-1" />
                    <span className="text-gray-600">
                      {formatTime(selectedSession.start_time)}
                    </span>
                  </div>
                  <div className="text-sm mt-2 pt-2 border-t border-olive-200/50">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Session Price:</span>
                      <span className="font-medium">
                        ${selectedSession.class.price}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <h3 className="font-medium mb-3">Your Information</h3>

              {/* Client information form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-200"
                    placeholder="Your full name"
                    value={clientInfo.name}
                    onChange={(e) =>
                      setClientInfo({ ...clientInfo, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-200"
                    placeholder="your.email@example.com"
                    value={clientInfo.email}
                    onChange={(e) =>
                      setClientInfo({
                        ...clientInfo,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-200"
                    placeholder="(555) 123-4567"
                    value={clientInfo.phone}
                    onChange={(e) =>
                      setClientInfo({
                        ...clientInfo,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {bookingError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <div className="flex items-start">
                    <Info className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Booking Error</p>
                      <p className="text-sm">{bookingError}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5">
                <button
                  className="w-full py-3 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={
                    !clientInfo.name || !clientInfo.email || isSubmitting
                  }
                  onClick={handleBooking}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </span>
                  ) : (
                    "Confirm Booking"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Success confirmation */}
          {bookingStep === 2 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>

              <h3 className="text-xl font-medium text-olive-900 mb-2">
                Booking Confirmed
              </h3>
              <p className="text-gray-600 mb-6">Thank you for your booking!</p>

              {/* QR Code Section */}
              {bookingConfirmation && (
                <div className="bg-white border border-olive-200 p-4 rounded-lg mb-6 max-w-md mx-auto">
                  <h4 className="font-medium text-olive-900 mb-3">
                    Your Booking QR Code
                  </h4>
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <QRCodeSVG
                        id="booking-qr-code"
                        value={bookingConfirmation}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-3 mb-3">
                      Show this QR code at the studio to check in
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={downloadQRCode}
                        className="flex items-center gap-2 px-4 py-2 bg-olive-100 text-olive-700 rounded-lg hover:bg-olive-200 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download QR Code
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedSession && (
                <div className="bg-olive-50 p-4 rounded-lg mb-6 max-w-md mx-auto text-left">
                  <h4 className="font-medium text-olive-900">
                    Booking Details:
                  </h4>
                  <div className="mt-2">
                    <p>
                      <span className="text-gray-600">Class:</span>{" "}
                      {selectedSession.class.name}
                    </p>
                    <p>
                      <span className="text-gray-600">Date:</span>{" "}
                      {formatDate(selectedSession.start_time)}
                    </p>
                    <p>
                      <span className="text-gray-600">Time:</span>{" "}
                      {formatTime(selectedSession.start_time)}
                    </p>
                    <p>
                      <span className="text-gray-600">Duration:</span>{" "}
                      {selectedSession.class.duration} minutes
                    </p>
                    <p>
                      <span className="text-gray-600">Instructor:</span>{" "}
                      {selectedSession.class.instructor}
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-olive-200/50">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium">
                        ${selectedSession.class.price}
                      </span>
                    </div>
                    <p className="text-sm text-olive-700 mt-2">
                      Payment will be collected at the studio.
                    </p>
                  </div>
                </div>
              )}

              <button
                className="px-6 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors"
                onClick={() => {
                  setBookingStep(0);
                  setSelectedSession(null);
                  setClientInfo({
                    name: "",
                    email: "",
                    phone: "",
                  });
                  setBookingConfirmation(""); // Reset confirmation
                }}
              >
                Book Another Class
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-gray-100 py-4 mt-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          © {new Date().getFullYear()} {studio?.name}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
