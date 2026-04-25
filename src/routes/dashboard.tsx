import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home, ShoppingBag, Plus, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { timeAgo, formatRupees } from "@/lib/utils-app";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CollegeConnect" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [flats, setFlats] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { navigate({ to: "/login" }); return; }
    if (!user) return;
    (async () => {
      const [p, f, b] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("flat_listings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("bazaar_products").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setProfile(p.data);
      setFlats(f.data ?? []);
      setProducts(b.data ?? []);
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  const deleteFlat = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("flat_listings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); setFlats(flats.filter((x) => x.id !== id)); }
  };
  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("bazaar_products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); setProducts(products.filter((x) => x.id !== id)); }
  };

  if (loading || !user) {
    return <Layout><div className="container mx-auto px-4 py-8"><Skeleton className="h-32 rounded-2xl" /></div></Layout>;
  }

  const activeFlats = flats.filter((f) => !f.is_filled).length;
  const productsListed = products.length;
  const productsSold = products.filter((p) => p.is_sold).length;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Welcome, {profile?.full_name ?? "Student"}! 👋</h1>
          <p className="text-muted-foreground">{profile?.college}{profile?.course && ` • ${profile.course}`}{profile?.year && ` • ${profile.year} year`}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
          <StatCard label="Active flats" value={activeFlats} color="primary" />
          <StatCard label="Products listed" value={productsListed} color="accent" />
          <StatCard label="Products sold" value={productsSold} color="primary" />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button asChild className="bg-gradient-to-r from-primary to-primary-glow"><Link to="/flatmate/post"><Plus className="h-4 w-4 mr-1" />Post Flat Listing</Link></Button>
          <Button asChild variant="outline" className="border-accent text-accent"><Link to="/bazaar/post"><Plus className="h-4 w-4 mr-1" />Sell a Product</Link></Button>
        </div>

        <Tabs defaultValue="flats">
          <TabsList>
            <TabsTrigger value="flats"><Home className="h-4 w-4 mr-1" />My Flat Listings</TabsTrigger>
            <TabsTrigger value="products"><ShoppingBag className="h-4 w-4 mr-1" />My Products</TabsTrigger>
          </TabsList>

          <TabsContent value="flats" className="mt-4">
            {flats.length === 0 ? (
              <EmptyState icon={Home} title="No flat listings yet" action={<Button asChild><Link to="/flatmate/post">Post one</Link></Button>} />
            ) : (
              <div className="space-y-3">
                {flats.map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-3 bg-card border rounded-xl p-4">
                    <Link to="/flatmate/$id" params={{ id: f.id }} className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{f.location} — {formatRupees(f.rent)}/mo</div>
                      <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="capitalize">{f.room_type}</Badge>
                        {f.is_filled && <Badge variant="destructive">Filled</Badge>}
                        <span>{timeAgo(f.created_at)}</span>
                      </div>
                    </Link>
                    <Button size="icon" variant="ghost" onClick={() => deleteFlat(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="products" className="mt-4">
            {products.length === 0 ? (
              <EmptyState icon={ShoppingBag} title="No products yet" action={<Button asChild><Link to="/bazaar/post">List one</Link></Button>} />
            ) : (
              <div className="space-y-3">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 bg-card border rounded-xl p-4">
                    <Link to="/bazaar/$id" params={{ id: p.id }} className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{p.title}</div>
                      <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="text-accent font-semibold">{p.is_free ? "FREE" : formatRupees(p.price)}</span>
                        {p.is_sold && <Badge variant="destructive">Sold</Badge>}
                        <span>{timeAgo(p.created_at)}</span>
                      </div>
                    </Link>
                    <Button size="icon" variant="ghost" onClick={() => deleteProduct(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: "primary" | "accent" }) {
  return (
    <div className={`bg-card border rounded-2xl p-4 md:p-5 shadow-card ${color === "primary" ? "border-l-4 border-l-primary" : "border-l-4 border-l-accent"}`}>
      <div className="text-2xl md:text-3xl font-bold">{value}</div>
      <div className="text-xs md:text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
