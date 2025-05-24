
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileWarning } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
            <FileWarning size={40} className="text-primary" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Oops! This pipeline configuration doesn't exist
        </p>
        <p className="mb-8 text-muted-foreground">
          The page you're looking for couldn't be found. It might have been moved, deleted, or never existed.
        </p>
        
        <Button asChild size="lg">
          <a href="/" className="inline-flex items-center">
            Return to Dashboard
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
