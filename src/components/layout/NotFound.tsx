export function NotFound() {
  return (
    <div className="text-center py-16">
      <h1 className="text-2xl font-semibold mb-2">404 — Page not found</h1>
      <p className="text-gray-600 mb-6">
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="text-blue-600 hover:underline">
        Go home
      </Link>
    </div>
  );
}
