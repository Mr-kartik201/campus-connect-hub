import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag, Plus, Search, Tag } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { timeAgo, formatRupees, CATEGORIES, CONDITIONS } from "@/lib/utils-app";

export const Route = createFileRoute("/bazaar/")({
  head: () => ({
    meta: [
      { title: "Student Bazaar — CollegeConnect" },
      { name: "description", content: "Buy and sell second-hand textbooks, electronics, furniture and more from your campus." },
    ],
  }),
  component: BazaarBrowse,
});

function BazaarBrowse() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("any");
  const [condition, setCondition] = useState("any");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("bazaar_products")
        .select("*, profiles(full_name, college)")
        .order("created_at", { ascending: false });
      setProducts(data ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = products.filter((p) => {
    if (search && !(`${p.title} ${p.description ?? ""}`).toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== "any" && p.category !== category) return false;
    if (condition !== "any" && p.condition !== condition) return false;
    return true;
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Student Bazaar 🛒</h1>
            <p className="text-muted-foreground mt-1">{filtered.length} items from students like you</p>
          </div>
          <Button asChild className="bg-gradient-to-r from-accent to-orange-500 text-accent-foreground shadow-soft">
            <Link to={user ? "/bazaar/post" : "/login"}><Plus className="h-4 w-4 mr-1" />Sell a Product</Link>
          </Button>
        </div>

        <div className="bg-card border rounded-2xl p-4 md:p-5 shadow-card mb-6 grid md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">All categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger><SelectValue placeholder="Condition" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any condition</SelectItem>
              {CONDITIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No products yet" description="Be the first to list something for sale!" action={<Button asChild><Link to={user ? "/bazaar/post" : "/login"}>Sell a product</Link></Button>} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}

function ProductCard({ p }: { p: any }) {
  const cond = CONDITIONS.find((c) => c.value === p.condition)?.label ?? p.condition;
  return (
    <Link to="/bazaar/$id" params={{ id: p.id }} className="group bg-card border rounded-2xl overflow-hidden shadow-card hover:shadow-glow transition relative">
      <div className="aspect-square bg-gradient-to-br from-accent/10 to-primary/10 relative overflow-hidden">
        {p.photos[0] ? (
          <img src={p.photos[0]} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition" loading="lazy" />
        ) : (
          <div className="h-full flex items-center justify-center"><Tag className="h-12 w-12 text-accent/40" /></div>
        )}
        {p.is_sold && (
          <div className="absolute inset-0 bg-destructive/80 flex items-center justify-center">
            <span className="text-destructive-foreground font-bold text-2xl rotate-[-10deg]">SOLD</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold line-clamp-1">{p.title}</h3>
        <div className="flex items-center justify-between mt-1">
          <div className="text-lg font-bold text-accent">{p.is_free ? "FREE" : formatRupees(p.price)}</div>
          <Badge variant="secondary" className="text-xs">{cond}</Badge>
        </div>
        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground line-clamp-1">
          {p.profiles?.full_name ?? "Student"} • {timeAgo(p.created_at)}
        </div>
      </div>
    </Link>
  );
}
