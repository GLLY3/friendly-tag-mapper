
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="w-full max-w-md mx-auto text-center p-8 glass-card rounded-lg animate-fade-in">
        <h1 className="text-6xl font-bold mb-4 text-primary">404</h1>
        <div className="w-16 h-0.5 bg-border mx-auto mb-6"></div>
        <p className="text-xl mb-6">The page you're looking for doesn't exist.</p>
        <Button asChild className="transition-all hover:scale-105">
          <a href="/">Return Home</a>
        </Button>
      </div>
    </Layout>
  );
};

export default NotFound;
