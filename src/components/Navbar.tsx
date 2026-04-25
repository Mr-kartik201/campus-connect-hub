import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Menu, X, Home, ShoppingBag, LayoutDashboard, LogOut, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const { user, role, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group" onClick={close}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-soft group-hover:scale-105 transition">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">College<span className="text-primary">Connect</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {role === "admin" ? (
            <>
              <Link to="/admin" className="px-3 py-2 text-sm font-medium hover:text-primary transition" activeProps={{ className: "px-3 py-2 text-sm font-medium text-primary" }}>Admin Dashboard</Link>
              <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4 mr-1" />Logout</Button>
            </>
          ) : (
            <>
              <Link to="/flatmate" className="px-3 py-2 text-sm font-medium hover:text-primary transition">Flatmate Finder</Link>
              <Link to="/bazaar" className="px-3 py-2 text-sm font-medium hover:text-primary transition">Student Bazaar</Link>
              {user ? (
                <>
                  <Link to="/dashboard" className="px-3 py-2 text-sm font-medium hover:text-primary transition">Dashboard</Link>
                  <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4 mr-1" />Logout</Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/login" })}>Login</Button>
                  <Button size="sm" onClick={() => navigate({ to: "/register" })} className="bg-gradient-to-r from-primary to-primary-glow shadow-soft">Register</Button>
                </>
              )}
            </>
          )}
        </nav>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {role === "admin" ? (
              <>
                <Link to="/admin" onClick={close} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted"><LayoutDashboard className="h-4 w-4" />Admin Dashboard</Link>
                <button onClick={() => { close(); signOut(); }} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-left"><LogOut className="h-4 w-4" />Logout</button>
              </>
            ) : (
              <>
                <Link to="/flatmate" onClick={close} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted"><Home className="h-4 w-4" />Flatmate Finder</Link>
                <Link to="/bazaar" onClick={close} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted"><ShoppingBag className="h-4 w-4" />Student Bazaar</Link>
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={close} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted"><LayoutDashboard className="h-4 w-4" />Dashboard</Link>
                    <Link to="/flatmate/post" onClick={close} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted"><PlusCircle className="h-4 w-4" />Post Listing</Link>
                    <button onClick={() => { close(); signOut(); }} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-left"><LogOut className="h-4 w-4" />Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={close} className="px-3 py-2 rounded-lg hover:bg-muted">Login</Link>
                    <Link to="/register" onClick={close} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-center">Register</Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
