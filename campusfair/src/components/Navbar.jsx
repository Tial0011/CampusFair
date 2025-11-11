export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 shadow-sm bg-indigo-600 text-white">
        <h1 className="text-2xl font-semibold">CampusFair</h1>
        <button className="bg-white text-indigo-600 px-4 py-1 rounded-full text-sm font-medium hover:bg-gray-200 transition">
          Join Now
        </button>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-gray-800 leading-tight">
          Connect. Discover. Experience Campus Life.
        </h2>

        <p className="mt-4 text-gray-600 max-w-md">
          Your campus marketplace for events, startups, communities, and
          opportunities.
        </p>

        <button className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg shadow transition">
          Explore Now
        </button>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-gray-500 text-sm">
        © {new Date().getFullYear()} CampusFair. All rights reserved.
      </footer>
    </div>
  );
}
