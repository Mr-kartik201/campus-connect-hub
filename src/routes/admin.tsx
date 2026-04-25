import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Home, ShoppingBag, Flag, Trash2, Power, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { timeAgo, formatRupees } from "@/lib/utils-app";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — CollegeConnect" }] }),
  component: Admin,
});

function Admin() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || role !== "admin") { navigate({ to: "/admin-login" }); return; }
    (async () => {
      const [p, f, b, r] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("flat_listings").select("*, profiles(full_name, college)").order("created_at", { ascending: false }),
        supabase.from("bazaar_products").select("*, profiles(full_name, college)").order("created_at", { ascending: false }),
        supabase.from("reports").select("*").order("created_at", { ascending: false }),
      ]);
      setProfiles(p.data ?? []);
      setFlats(f.data ?? []);
      setProducts(b.data ?? []);
      setReports(r.data ?? []);
      setLoading(false);
    })();
  }, [user, role, authLoading, navigate]);

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
  const deleteReport = async (id: string) => {
    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Resolved"); setReports(reports.filter((x) => x.id !== id)); }
  };
  const toggleUser = async (p: any) => {
    const { error } = await supabase.from("profiles").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success(p.is_active ? "Deactivated" : "Activated");
      setProfiles(profiles.map((x) => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
    }
  };

  if (loading) return <Layout><div className="container mx-auto px-4 py-8"><Skeleton className="h-96 rounded-2xl" /></div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-6">Platform overview and moderation</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Stat icon={Users} label="Students" value={profiles.length} />
          <Stat icon={Home} label="Flat Listings" value={flats.length} />
          <Stat icon={ShoppingBag} label="Products" value={products.length} />
          <Stat icon={Flag} label="Reports" value={reports.length} />
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="flats">Flat Listings</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="reports">Reports {reports.length > 0 && <Badge variant="destructive" className="ml-1">{reports.length}</Badge>}</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4 bg-card border rounded-2xl overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>College</TableHead><TableHead>Joined</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.full_name}</TableCell>
                    <TableCell className="text-sm">{p.email}</TableCell>
                    <TableCell className="text-sm">{p.college ?? "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{timeAgo(p.created_at)}</TableCell>
                    <TableCell>{p.is_active ? <Badge variant="secondary">Active</Badge> : <Badge variant="destructive">Disabled</Badge>}</TableCell>
                    <TableCell><Button size="sm" variant="ghost" onClick={() => toggleUser(p)}><Power className="h-3.5 w-3.5" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="flats" className="mt-4 bg-card border rounded-2xl overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Location</TableHead><TableHead>Rent</TableHead><TableHead>Posted by</TableHead><TableHead>Date</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {flats.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.location}</TableCell>
                    <TableCell>{formatRupees(f.rent)}</TableCell>
                    <TableCell className="text-sm">{f.profiles?.full_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{timeAgo(f.created_at)}</TableCell>
                    <TableCell><Button size="sm" variant="ghost" onClick={() => deleteFlat(f.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="products" className="mt-4 bg-card border rounded-2xl overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Price</TableHead><TableHead>Seller</TableHead><TableHead>Date</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell>{p.is_free ? "FREE" : formatRupees(p.price)}</TableCell>
                    <TableCell className="text-sm">{p.profiles?.full_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{timeAgo(p.created_at)}</TableCell>
                    <TableCell><Button size="sm" variant="ghost" onClick={() => deleteProduct(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="reports" className="mt-4 bg-card border rounded-2xl overflow-hidden">
            {reports.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No active reports 🎉</div>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Listing</TableHead><TableHead>Reason</TableHead><TableHead>Date</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell><Badge variant="outline" className="capitalize">{r.listing_type}</Badge></TableCell>
                      <TableCell><a className="text-primary text-xs underline" href={`/${r.listing_type === "flat" ? "flatmate" : "bazaar"}/${r.listing_id}`}>View</a></TableCell>
                      <TableCell className="text-sm max-w-md">{r.reason}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</TableCell>
                      <TableCell><Button size="sm" variant="ghost" onClick={() => deleteReport(r.id)}>Resolve</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="bg-card border rounded-2xl p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}
