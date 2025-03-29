import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Button from "@/components/ui/button";

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
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-serif text-olive-900">pilates</h1>
            <p className="text-sm text-olive-700 italic ml-2">
              studio management
            </p>
          </div>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-olive-50">
        <div className="container mx-auto px-6 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif text-olive-900 mb-6">
              Streamline Your Pilates Studio Management
            </h1>
            <p className="text-lg text-gray-700 mb-8">
              Simplify scheduling, bookings, and client management with our
              all-in-one platform designed specifically for Pilates studios.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
              <Link href="/register">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Pilates Studio Management. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
