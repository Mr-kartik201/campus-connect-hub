import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, FormEvent } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PhotoUploader } from "@/components/PhotoUploader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { CATEGORIES, CONDITIONS } from "@/lib/utils-app";

export const Route = createFileRoute("/bazaar/post")({
  head: () => ({ meta: [{ title: "Sell a product — CollegeConnect" }] }),
  component: PostProduct,
});

const schema = z.object({
  title: z.string().trim().min(2).max(150),
  category: z.enum(["books", "electronics", "furniture", "vehicles", "clothes", "sports", "other"]),
  price: z.number().int().min(0).max(1000000),
  is_free: z.boolean(),
  condition: z.enum(["like_new", "good", "fair"]),
  pickup_location: z.string().trim().min(2).max(150),
  description: z.string().max(2000).optional().or(z.literal("")),
});

function PostProduct() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "", category: "books", price: "0", is_free: false,
    condition: "good", description: "", pickup_location: "",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      ...form,
      price: form.is_free ? 0 : parseInt(form.price || "0", 10),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    const { error } = await supabase.from("bazaar_products").insert({
      user_id: user.id, ...parsed.data, photos, description: form.description || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Product listed!");
    navigate({ to: "/bazaar" });
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/bazaar" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4"><ArrowLeft className="h-4 w-4" />Back</Link>
        <h1 className="text-3xl font-bold mb-1">Sell a product</h1>
        <p className="text-muted-foreground mb-6">List something for fellow students to grab.</p>

        <form onSubmit={submit} className="bg-card border rounded-2xl shadow-card p-6 space-y-5">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. NCERT Chemistry textbook" className="mt-1.5" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Price (₹)</Label>
            <Input type="number" disabled={form.is_free} value={form.is_free ? "0" : form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1.5" />
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <Checkbox checked={form.is_free} onCheckedChange={(v) => setForm({ ...form, is_free: !!v })} />
              <span className="text-sm">Free / Donate</span>
            </label>
          </div>

          <div>
            <Label>Pickup Location</Label>
            <Input value={form.pickup_location} onChange={(e) => setForm({ ...form, pickup_location: e.target.value })} placeholder="e.g. Hostel B, Block 4" className="mt-1.5" />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="mt-1.5" />
          </div>

          <div>
            <Label>Photos</Label>
            <div className="mt-2"><PhotoUploader bucket="bazaar-photos" userId={user.id} photos={photos} setPhotos={setPhotos} max={5} /></div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-accent to-orange-500 text-accent-foreground">
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}List product
          </Button>
        </form>
      </div>
    </Layout>
  );
}
