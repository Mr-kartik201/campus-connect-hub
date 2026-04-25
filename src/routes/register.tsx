import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, FormEvent } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Register — CollegeConnect" }] }),
  component: Register,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Name too short").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
  college: z.string().trim().min(2, "College required").max(150),
  course: z.string().trim().min(1, "Course required").max(100),
  year: z.enum(["1st", "2nd", "3rd", "4th", "5th"]),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", college: "", course: "", year: "1st", phone: "" });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: parsed.data.full_name,
          college: parsed.data.college,
          course: parsed.data.course,
          year: parsed.data.year,
          phone: parsed.data.phone,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome to CollegeConnect! 🎉");
    navigate({ to: "/dashboard" });
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
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-6">Join your campus community</p>

          <form onSubmit={submit} className="space-y-4">
            <Field label="Full Name" v={form.full_name} on={(v) => setForm({ ...form, full_name: v })} />
            <Field label="Email" type="email" v={form.email} on={(v) => setForm({ ...form, email: v })} />
            <Field label="Password" type="password" v={form.password} on={(v) => setForm({ ...form, password: v })} />
            <Field label="College Name" v={form.college} on={(v) => setForm({ ...form, college: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Course" v={form.course} on={(v) => setForm({ ...form, course: v })} />
              <div>
                <Label>Year</Label>
                <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["1st", "2nd", "3rd", "4th", "5th"].map((y) => <SelectItem key={y} value={y}>{y} year</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Field label="Phone (optional)" v={form.phone} on={(v) => setForm({ ...form, phone: v })} />

            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-primary-glow">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create account
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account? <Link to="/login" className="text-primary font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, v, on, type = "text" }: { label: string; v: string; on: (v: string) => void; type?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type={type} value={v} onChange={(e) => on(e.target.value)} className="mt-1.5" />
    </div>
  );
}
