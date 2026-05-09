export function Navbar() {
  return (
    <nav className="bg-blue-900 text-white px-6 py-3 flex items-center gap-6 shadow">
      <Link to="/" className="font-bold text-lg hover:text-blue-200">
        Freight Operations
      </Link>
      <Link to="/" className="text-sm hover:text-blue-200 [&.active]:underline">
        Dashboard
      </Link>
      <Link
        to="/bookings"
        className="text-sm hover:text-blue-200 [&.active]:underline"
      >
        Bookings
      </Link>
    </nav>
  );
}
