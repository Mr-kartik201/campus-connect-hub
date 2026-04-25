import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, FormEvent } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — CollegeConnect" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setLoading(false); toast.error(error.message); return; }
    const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).maybeSingle();
    setLoading(false);
    toast.success("Welcome back!");
    navigate({ to: roleRow?.role === "admin" ? "/admin" : "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-soft">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl">College<span className="text-primary">Connect</span></span>
        </Link>

        <div className="bg-card border rounded-2xl shadow-card p-6 md:p-8">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-6">Sign in to your student account</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-primary-glow">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Sign in
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground mt-6 space-y-2">
            <p>New here? <Link to="/register" className="text-primary font-medium">Create an account</Link></p>
            <p><Link to="/admin-login" className="text-xs hover:text-primary">Login as Admin →</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
