import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Button from "@/components/ui/button";
import { Calendar, Users, BarChart2 } from "lucide-react";

export default async function HomePage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Check if user is already logged in
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-olive-50 flex flex-col">
      {/* Mobile-First Responsive Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-serif text-olive-900">pilates</h1>
            <p className="hidden sm:block text-sm text-olive-700 italic ml-2">
              studio management
            </p>
          </div>
          <div className="flex space-x-2">
            <Link href="/login">
              <Button variant="outline" size="sm" className="px-3">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="px-3">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content with Mobile-First Design */}
      <main className="flex-1 flex items-center">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-serif text-olive-900 mb-4 leading-tight">
              Streamline Your Pilates Studio
            </h1>
            <p className="text-lg text-gray-700 mb-8 max-w-xl mx-auto">
              Simplify scheduling, bookings, and client management with our
              all-in-one platform designed specifically for Pilates studios.
            </p>

            {/* Feature Highlights for Mobile */}
            <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <Calendar className="w-6 h-6 mx-auto text-olive-600 mb-2" />
                <p className="text-xs text-gray-600 text-center">
                  Easy Scheduling
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <Users className="w-6 h-6 mx-auto text-olive-600 mb-2" />
                <p className="text-xs text-gray-600 text-center">
                  Client Management
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <BarChart2 className="w-6 h-6 mx-auto text-olive-600 mb-2" />
                <p className="text-xs text-gray-600 text-center">Analytics</p>
              </div>
            </div>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full">
                  Get Started
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Pilates Studio Management
          </p>
        </div>
      </footer>
    </div>
  );
}
