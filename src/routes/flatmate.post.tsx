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
import { AMENITIES } from "@/lib/utils-app";

export const Route = createFileRoute("/flatmate/post")({
  head: () => ({ meta: [{ title: "Post a flat listing — CollegeConnect" }] }),
  component: PostFlat,
});

const schema = z.object({
  listing_type: z.enum(["have_room", "need_room"]),
  location: z.string().trim().min(2).max(150),
  rent: z.number().int().min(500).max(200000),
  room_type: z.enum(["single", "shared", "pg"]),
  gender_pref: z.enum(["any", "male", "female"]),
  roommates_count: z.number().int().min(1).max(4),
  contact_number: z.string().trim().min(7).max(20),
  description: z.string().max(2000).optional().or(z.literal("")),
});

function PostFlat() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [form, setForm] = useState({
    listing_type: "have_room",
    location: "",
    rent: "10000",
    room_type: "single",
    gender_pref: "any",
    roommates_count: "1",
    move_in_date: "",
    description: "",
    contact_number: "",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      ...form,
      rent: parseInt(form.rent, 10),
      roommates_count: parseInt(form.roommates_count, 10),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    const { error } = await supabase.from("flat_listings").insert({
      user_id: user.id,
      ...parsed.data,
      amenities,
      photos,
      move_in_date: form.move_in_date || null,
      description: form.description || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Listing posted!");
    navigate({ to: "/flatmate" });
  };

  const toggleAmenity = (a: string) => setAmenities(amenities.includes(a) ? amenities.filter((x) => x !== a) : [...amenities, a]);

  if (!user) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/flatmate" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4"><ArrowLeft className="h-4 w-4" />Back</Link>
        <h1 className="text-3xl font-bold mb-1">Post a flat listing</h1>
        <p className="text-muted-foreground mb-6">Tell others what you're offering or looking for.</p>

        <form onSubmit={submit} className="bg-card border rounded-2xl shadow-card p-6 space-y-5">
          <div>
            <Label>Listing Type</Label>
            <Select value={form.listing_type} onValueChange={(v) => setForm({ ...form, listing_type: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="have_room">I have a room</SelectItem>
                <SelectItem value="need_room">I need a room</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Location / Area</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Koramangala" className="mt-1.5" />
            </div>
            <div>
              <Label>Monthly Rent (₹)</Label>
              <Input type="number" value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })} className="mt-1.5" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Room Type</Label>
              <Select value={form.room_type} onValueChange={(v) => setForm({ ...form, room_type: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="shared">Shared</SelectItem>
                  <SelectItem value="pg">PG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Gender Preference</Label>
              <Select value={form.gender_pref} onValueChange={(v) => setForm({ ...form, gender_pref: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Roommates needed</Label>
              <Select value={form.roommates_count} onValueChange={(v) => setForm({ ...form, roommates_count: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {AMENITIES.map((a) => (
                <label key={a} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-muted">
                  <Checkbox checked={amenities.includes(a)} onCheckedChange={() => toggleAmenity(a)} />
                  <span className="text-sm">{a}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Move-in Date</Label>
              <Input type="date" value={form.move_in_date} onChange={(e) => setForm({ ...form, move_in_date: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>WhatsApp Number</Label>
              <Input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} placeholder="9876543210" className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="mt-1.5" placeholder="Describe the place, neighbourhood, what you're looking for..." />
          </div>

          <div>
            <Label>Photos</Label>
            <div className="mt-2"><PhotoUploader bucket="flat-photos" userId={user.id} photos={photos} setPhotos={setPhotos} max={3} /></div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-primary to-primary-glow">
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Post listing
          </Button>
        </form>
      </div>
    </Layout>
  );
}
