import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { user, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 grid place-items-center text-white font-bold">
            AI
          </div>
          <span className="font-extrabold text-xl tracking-tight">
            GHSS KARAI AI
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "text-primary font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/tutor"
            className={({ isActive }) =>
              isActive
                ? "text-primary font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }
          >
            Tutor
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              isActive
                ? "text-primary font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }
          >
            About
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              isActive
                ? "text-primary font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }
          >
            Contact
          </NavLink>
        </nav>
        <div className="flex items-center gap-3">
          {loading ? (
            <div>Loading...</div>
          ) : user ? (
            <>
              <span className="hidden sm:inline">{user.displayName}</span>
              <Button onClick={handleSignOut}>Logout</Button>
            </>
          ) : (
            <Button asChild>
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
