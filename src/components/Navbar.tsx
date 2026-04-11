import { Link, useLocation, useNavigate } from "react-router-dom";
import { Scale, Menu, X, Search, LogOut, LogIn } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const isAuth = !!localStorage.getItem("nyaysathi_token");
  const role = localStorage.getItem("nyaysathi_role");

  const handleLogout = () => {
    localStorage.removeItem("nyaysathi_token");
    localStorage.removeItem("nyaysathi_role");
    navigate("/auth");
    setMobileOpen(false);
  };

  // Build nav items dynamically based on role
  const navItems = [
    { to: "/", label: "Home" },
    ...(isAuth && role === "citizen"
      ? [
          { to: "/citizen", label: "File Complaint" },
          { to: "/track", label: "Track Complaint" },
        ]
      : []),
    ...(isAuth && role === "officer" ? [{ to: "/dashboard", label: "Officer Dashboard" }] : []),
    { to: "/evidence", label: "Evidence Portal" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <Scale className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground">
            Nyaya<span className="text-orange-400">-Sathi</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === item.to
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {item.label}
            </Link>
          ))}

          {isAuth ? (
            <button
              onClick={handleLogout}
              className="ml-2 flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          ) : (
            <Link
              to="/auth"
              className="ml-2 flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-muted-foreground hover:text-foreground"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === item.to
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {isAuth ? (
            <button
              onClick={handleLogout}
              className="w-full text-left flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          ) : (
            <Link
              to="/auth"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground text-center"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
