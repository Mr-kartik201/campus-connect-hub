import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, FormEvent } from "react";
import { Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin-login")({
  head: () => ({ meta: [{ title: "Admin Login — CollegeConnect" }] }),
  component: AdminLogin,
});

function AdminLogin() {
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
    if (roleRow?.role !== "admin") {
      await supabase.auth.signOut();
      toast.error("This account is not an admin.");
      return;
    }
    toast.success("Welcome, Admin");
    navigate({ to: "/admin" });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-orange-600 shadow-glow">
              <Shield className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white text-center">Admin Portal</h1>
          <p className="text-sm text-slate-400 text-center mb-6">Restricted access</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="text-slate-300">Admin Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-slate-300">Password</Label>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 bg-slate-800 border-slate-700 text-white" />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-accent to-orange-600 text-white">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Sign in as Admin
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            <Link to="/login" className="hover:text-slate-300">← Student login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
