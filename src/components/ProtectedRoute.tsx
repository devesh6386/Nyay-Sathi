import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({
  children,
  allowedRole,
}: {
  children: React.ReactNode;
  allowedRole?: "citizen" | "officer";
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("nyaysathi_token");
    const role = localStorage.getItem("nyaysathi_role");
    
    if (token && role) {
        setIsAuthenticated(true);
        setUserRole(role);
    } else {
        setIsAuthenticated(false);
    }
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRole && userRole && userRole !== allowedRole) {
    // Redirect if they have the wrong role
    return <Navigate to={userRole === "officer" ? "/dashboard" : "/citizen"} replace />;
  }

  return <>{children}</>;
}
