import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home, MapPin, Plus, Search } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { timeAgo, formatRupees, isExpired } from "@/lib/utils-app";

export const Route = createFileRoute("/flatmate/")({
  head: () => ({
    meta: [
      { title: "Flatmate Finder — CollegeConnect" },
      { name: "description", content: "Browse student flat & roommate listings near your college." },
    ],
  }),
  component: FlatmateBrowse,
});

interface Listing {
  id: string;
  user_id: string;
  listing_type: string;
  location: string;
  rent: number;
  room_type: string;
  gender_pref: string;
  photos: string[];
  is_filled: boolean;
  created_at: string;
  profiles?: { full_name: string; college: string } | null;
}

function FlatmateBrowse() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("any");
  const [roomType, setRoomType] = useState("any");
  const [maxRent, setMaxRent] = useState(50000);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("flat_listings")
        .select("*, profiles(full_name, college)")
        .eq("is_filled", false)
        .order("created_at", { ascending: false });
      setListings((data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = listings.filter((l) => {
    if (isExpired(l.created_at)) return false;
    if (search && !l.location.toLowerCase().includes(search.toLowerCase())) return false;
    if (gender !== "any" && l.gender_pref !== gender && l.gender_pref !== "any") return false;
    if (roomType !== "any" && l.room_type !== roomType) return false;
    if (l.rent > maxRent) return false;
    return true;
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Flatmate Finder 🏠</h1>
            <p className="text-muted-foreground mt-1">Browse {filtered.length} active listings</p>
          </div>
          <Button asChild className="bg-gradient-to-r from-primary to-primary-glow shadow-soft">
            <Link to={user ? "/flatmate/post" : "/login"}><Plus className="h-4 w-4 mr-1" />Post Listing</Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-card border rounded-2xl p-4 md:p-5 shadow-card mb-6 grid md:grid-cols-4 gap-3">
          <div className="md:col-span-1">
            <label className="text-xs font-medium text-muted-foreground">Location</label>
            <div className="relative mt-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search area..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Gender</label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Room Type</label>
            <Select value={roomType} onValueChange={setRoomType}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="shared">Shared</SelectItem>
                <SelectItem value="pg">PG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Max Rent: {formatRupees(maxRent)}</label>
            <Slider value={[maxRent]} min={1000} max={50000} step={500} onValueChange={(v) => setMaxRent(v[0])} className="mt-3" />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Home} title="No listings found" description="Try adjusting your filters or be the first to post!" action={<Button asChild><Link to={user ? "/flatmate/post" : "/login"}>Post a listing</Link></Button>} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((l) => <FlatCard key={l.id} l={l} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}

function FlatCard({ l }: { l: Listing }) {
  return (
    <Link to="/flatmate/$id" params={{ id: l.id }} className="group bg-card border rounded-2xl overflow-hidden shadow-card hover:shadow-glow transition">
      <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden">
        {l.photos[0] ? (
          <img src={l.photos[0]} alt={l.location} className="h-full w-full object-cover group-hover:scale-105 transition" loading="lazy" />
        ) : (
          <div className="h-full flex items-center justify-center"><Home className="h-12 w-12 text-primary/40" /></div>
        )}
        <Badge className="absolute top-3 left-3 bg-background/90 text-foreground border">{l.listing_type === "have_room" ? "Has Room" : "Needs Room"}</Badge>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1 text-sm font-medium"><MapPin className="h-3.5 w-3.5 text-primary" />{l.location}</div>
          <div className="text-lg font-bold text-primary">{formatRupees(l.rent)}<span className="text-xs text-muted-foreground font-normal">/mo</span></div>
        </div>
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary" className="capitalize text-xs">{l.room_type}</Badge>
          <Badge variant="secondary" className="capitalize text-xs">{l.gender_pref}</Badge>
        </div>
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
          {l.profiles?.full_name ?? "Student"} • {l.profiles?.college ?? ""} • {timeAgo(l.created_at)}
        </div>
      </div>
    </Link>
  );
}
