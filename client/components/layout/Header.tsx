import { Link, NavLink } from "react-router-dom";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/auth";
import { LogIn, LogOut } from "lucide-react";
import { useEffect, useRef } from "react";

export default function Header() {
  const { user, signIn, signOut } = useAuth();
  const btnRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const g = (window as any).google;
    if (g?.accounts?.id && btnRef.current) {
      try {
        g.accounts.id.renderButton(btnRef.current, {
          theme: "outline",
          size: "large",
        });
      } catch (e) {
        // ignore
      }
    }
  }, []);

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
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 rounded-full pl-1 pr-3 py-1">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="h-7 w-7 rounded-full"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-primary/10" />
                )}
                <div className="text-sm">
                  <div className="font-semibold leading-none">{user.name}</div>
                  <div className="text-slate-500 text-xs">{user.email}</div>
                </div>
              </div>
              <button onClick={signOut} className="btn-primary">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button onClick={signIn} className="btn-secondary">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign in with Google
                </button>
                <div ref={btnRef} className="ml-2" aria-hidden="true" />
              </div>
            </>
          )}
        </div>
      </div>
      <div className="md:hidden border-t px-4 py-2 flex gap-6 text-sm">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "text-primary font-semibold" : "text-slate-600"
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/tutor"
          className={({ isActive }) =>
            isActive ? "text-primary font-semibold" : "text-slate-600"
          }
        >
          Tutor
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) =>
            isActive ? "text-primary font-semibold" : "text-slate-600"
          }
        >
          About
        </NavLink>
        <NavLink
          to="/contact"
          className={({ isActive }) =>
            isActive ? "text-primary font-semibold" : "text-slate-600"
          }
        >
          Contact
        </NavLink>
      </div>
    </header>
  );
}
