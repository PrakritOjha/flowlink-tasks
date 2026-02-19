import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <h1 className="text-9xl font-extrabold text-gray-100 select-none">404</h1>
      <p className="mt-2 text-xl font-medium text-muted-foreground">Page not found</p>
      <Link
        to="/"
        className="mt-6 text-sm font-medium text-primary hover:underline transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
};

export default NotFound;
