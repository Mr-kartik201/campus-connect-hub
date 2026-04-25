import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-secondary/30 mt-20">
      <div className="container mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">College<span className="text-primary">Connect</span></span>
            </div>
            <p className="text-sm text-muted-foreground">Find your perfect roommate and shop smart with fellow students.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/flatmate" className="hover:text-primary">Flatmate Finder</Link></li>
              <li><Link to="/bazaar" className="hover:text-primary">Student Bazaar</Link></li>
              <li><Link to="/register" className="hover:text-primary">Join now</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">For Admins</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/admin-login" className="hover:text-primary">Admin Login</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border/60 text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} CollegeConnect. Built for students, by students.
        </div>
      </div>
    </footer>
  );
}
