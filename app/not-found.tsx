import Link from "next/link";
import { Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <p className="text-xl font-semibold text-foreground">Page Not Found</p>
        </div>

        <p className="text-muted-foreground">
          The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>

        <div className="flex flex-col gap-3 pt-4">
          <Link href="/" className="w-full">
            <Button className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Return to Home
            </Button>
          </Link>
          <Link href="/dashboard" className="w-full">
            <Button variant="outline" className="w-full">
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          If you believe this is a mistake, please contact support.
        </p>
      </div>
    </div>
  );
}
