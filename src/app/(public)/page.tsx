import Link from "next/link";

export default function PublicLandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-serif text-olive-900">pilates</h1>
            <p className="text-sm text-olive-700 italic ml-2">studio booking</p>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-olive-50">
        <div className="container mx-auto px-6 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif text-olive-900 mb-6">
              Find Your Perfect Pilates Class
            </h1>
            <p className="text-lg text-gray-700 mb-8">
              Browse and book pilates classes at top studios with our
              easy-to-use platform.
            </p>

            {/* This would typically be populated with featured studios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              <div className="bg-white rounded-xl shadow-sm p-6 transition-transform hover:scale-105">
                <h3 className="text-xl font-serif text-olive-900 mb-2">
                  Pure Pilates Studio
                </h3>
                <p className="text-olive-700 mb-4">Downtown</p>
                <Link
                  href="/studios/1"
                  className="block w-full py-2 bg-olive-600 text-white text-center rounded-lg hover:bg-olive-700 transition-colors"
                >
                  Book Now
                </Link>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 transition-transform hover:scale-105">
                <h3 className="text-xl font-serif text-olive-900 mb-2">
                  Core Strength Pilates
                </h3>
                <p className="text-olive-700 mb-4">Westside</p>
                <Link
                  href="/studios/2"
                  className="block w-full py-2 bg-olive-600 text-white text-center rounded-lg hover:bg-olive-700 transition-colors"
                >
                  Book Now
                </Link>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 transition-transform hover:scale-105">
                <h3 className="text-xl font-serif text-olive-900 mb-2">
                  Balance Pilates
                </h3>
                <p className="text-olive-700 mb-4">Eastside</p>
                <Link
                  href="/studios/3"
                  className="block w-full py-2 bg-olive-600 text-white text-center rounded-lg hover:bg-olive-700 transition-colors"
                >
                  Book Now
                </Link>
              </div>
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
