import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Phone, Flag, CheckCircle2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { timeAgo, formatRupees, whatsappLink, CONDITIONS, CATEGORIES } from "@/lib/utils-app";

export const Route = createFileRoute("/bazaar/$id")({
  head: () => ({ meta: [{ title: "Product — CollegeConnect" }] }),
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [sellerPhone, setSellerPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [reportReason, setReportReason] = useState("");
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: row } = await supabase
        .from("bazaar_products")
        .select("*, profiles(full_name, college, phone)")
        .eq("id", id)
        .maybeSingle();
      setData(row);
      setSellerPhone(row?.profiles?.phone ?? null);
      setLoading(false);
    })();
  }, [id]);

  const markSold = async () => {
    const { error } = await supabase.from("bazaar_products").update({ is_sold: true }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Marked as sold"); setData({ ...data, is_sold: true }); }
  };

  const submitReport = async () => {
    if (!user) { navigate({ to: "/login" }); return; }
    if (reportReason.trim().length < 5) { toast.error("Please explain"); return; }
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id, listing_type: "bazaar", listing_id: id, reason: reportReason.trim(),
    });
    if (error) toast.error(error.message);
    else { toast.success("Report submitted"); setReportOpen(false); setReportReason(""); }
  };

  if (loading) return <Layout><div className="container mx-auto px-4 py-8 max-w-4xl"><Skeleton className="h-96 rounded-2xl" /></div></Layout>;
  if (!data) return <Layout><div className="container mx-auto px-4 py-8 text-center"><p>Product not found.</p></div></Layout>;

  const isOwner = user?.id === data.user_id;
  const cond = CONDITIONS.find((c) => c.value === data.condition)?.label ?? data.condition;
  const cat = CATEGORIES.find((c) => c.value === data.category)?.label ?? data.category;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <Link to="/bazaar" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4"><ArrowLeft className="h-4 w-4" />Back to bazaar</Link>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="aspect-square rounded-2xl bg-muted overflow-hidden relative">
              {data.photos[activeImg] ? (
                <img src={data.photos[activeImg]} alt={data.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No image</div>
              )}
              {data.is_sold && (
                <div className="absolute inset-0 bg-destructive/80 flex items-center justify-center">
                  <span className="text-destructive-foreground font-bold text-5xl rotate-[-10deg]">SOLD</span>
                </div>
              )}
            </div>
            {data.photos.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {data.photos.map((p: string, i: number) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={`h-16 w-16 rounded-lg overflow-hidden border-2 ${i === activeImg ? "border-primary" : "border-transparent"}`}>
                    <img src={p} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge>{cat}</Badge>
              <Badge variant="secondary">{cond}</Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{data.title}</h1>
            <div className="text-3xl font-bold text-accent">{data.is_free ? "FREE" : formatRupees(data.price)}</div>

            {data.description && <p className="text-foreground whitespace-pre-wrap">{data.description}</p>}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />Pickup: {data.pickup_location}
            </div>

            <div className="bg-card border rounded-2xl p-4">
              <div className="text-sm text-muted-foreground">Sold by</div>
              <div className="font-semibold">{data.profiles?.full_name ?? "Student"}</div>
              <div className="text-xs text-muted-foreground">{data.profiles?.college} • {timeAgo(data.created_at)}</div>

              <div className="mt-4 space-y-2">
                {user ? (
                  !data.is_sold && sellerPhone && (
                    <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white">
                      <a href={whatsappLink(sellerPhone, `Hi! I'm interested in your ${data.title} on CollegeConnect.`)} target="_blank" rel="noopener">
                        <MessageCircle className="h-4 w-4 mr-2" />Chat on WhatsApp
                      </a>
                    </Button>
                  )
                ) : (
                  <Button asChild className="w-full"><Link to="/login">Login to contact seller</Link></Button>
                )}
                {user && !sellerPhone && !isOwner && !data.is_sold && (
                  <p className="text-xs text-muted-foreground">Seller hasn't shared a contact number.</p>
                )}

                {isOwner && !data.is_sold && (
                  <Button variant="outline" onClick={markSold} className="w-full"><CheckCircle2 className="h-4 w-4 mr-1" />Mark as sold</Button>
                )}

                <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground"><Flag className="h-3.5 w-3.5 mr-1" />Report</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Report this product</DialogTitle></DialogHeader>
                    <Textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Why are you reporting this?" rows={4} />
                    <Button onClick={submitReport}>Submit report</Button>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
