import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
  adminOnly?: boolean;
}

export function ProtectedRoute({
  path,
  component: Component,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Super Admin bypass for admin routes
  if (adminOnly && user.role !== "admin" && user.role !== "super_admin") {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  // If Super Admin lands on regular dashboard, redirect to Super Admin panel
  if (path === "/" && user.role === "super_admin") {
    return (
      <Route path={path}>
        <Redirect to="/super-admin" />
      </Route>
    );
  }

  return (
    <Route path={path}>
      {(params) => <Component {...params} />}
    </Route>
  );
}
