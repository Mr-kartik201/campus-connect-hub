import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Calendar, Users, Phone, Flag, CheckCircle2, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { timeAgo, formatRupees, whatsappLink } from "@/lib/utils-app";

export const Route = createFileRoute("/flatmate/$id")({
  head: () => ({ meta: [{ title: "Flat listing — CollegeConnect" }] }),
  component: FlatDetail,
});

function FlatDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportReason, setReportReason] = useState("");
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: row } = await supabase
        .from("flat_listings")
        .select("*, profiles(full_name, college)")
        .eq("id", id)
        .maybeSingle();
      setData(row);
      setLoading(false);
    })();
  }, [id]);

  const markFilled = async () => {
    const { error } = await supabase.from("flat_listings").update({ is_filled: true }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Marked as filled"); setData({ ...data, is_filled: true }); }
  };

  const submitReport = async () => {
    if (!user) { navigate({ to: "/login" }); return; }
    if (reportReason.trim().length < 5) { toast.error("Please explain the reason"); return; }
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id, listing_type: "flat", listing_id: id, reason: reportReason.trim(),
    });
    if (error) toast.error(error.message);
    else { toast.success("Report submitted"); setReportOpen(false); setReportReason(""); }
  };

  if (loading) return <Layout><div className="container mx-auto px-4 py-8 max-w-4xl"><Skeleton className="h-96 rounded-2xl" /></div></Layout>;
  if (!data) return <Layout><div className="container mx-auto px-4 py-8 text-center"><p>Listing not found.</p></div></Layout>;

  const isOwner = user?.id === data.user_id;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Link to="/flatmate" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4"><ArrowLeft className="h-4 w-4" />Back to listings</Link>

        {data.photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden mb-6">
            <img src={data.photos[0]} alt="" className="col-span-3 md:col-span-2 row-span-2 aspect-video md:aspect-auto h-64 md:h-80 w-full object-cover" />
            {data.photos.slice(1, 3).map((p: string, i: number) => (
              <img key={i} src={p} alt="" className="hidden md:block h-[152px] w-full object-cover" />
            ))}
          </div>
        ) : (
          <div className="h-64 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mb-6" />
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge>{data.listing_type === "have_room" ? "Has Room" : "Needs Room"}</Badge>
                <Badge variant="secondary" className="capitalize">{data.room_type}</Badge>
                <Badge variant="secondary" className="capitalize">{data.gender_pref} preferred</Badge>
                {data.is_filled && <Badge variant="destructive">Filled</Badge>}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><MapPin className="h-6 w-6 text-primary" />{data.location}</h1>
              <div className="text-3xl font-bold text-primary mt-2">{formatRupees(data.rent)}<span className="text-base text-muted-foreground font-normal">/month</span></div>
            </div>

            {data.description && <p className="text-foreground whitespace-pre-wrap">{data.description}</p>}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Info icon={Users} label="Roommates needed" value={String(data.roommates_count)} />
              {data.move_in_date && <Info icon={Calendar} label="Move-in" value={new Date(data.move_in_date).toLocaleDateString()} />}
            </div>

            {data.amenities.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {data.amenities.map((a: string) => <Badge key={a} variant="outline" className="gap-1"><CheckCircle2 className="h-3 w-3" />{a}</Badge>)}
                </div>
              </div>
            )}
          </div>

          <aside className="bg-card border rounded-2xl p-5 shadow-card h-fit">
            <div className="text-sm text-muted-foreground">Posted by</div>
            <div className="font-semibold">{data.profiles?.full_name ?? "Student"}</div>
            <div className="text-xs text-muted-foreground">{data.profiles?.college}</div>
            <div className="text-xs text-muted-foreground mt-1">{timeAgo(data.created_at)}</div>

            <div className="mt-4 space-y-2">
              {user ? (
                !data.is_filled && (
                  <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <a href={whatsappLink(data.contact_number, `Hi! Saw your CollegeConnect listing for ${data.location}.`)} target="_blank" rel="noopener">
                      <Phone className="h-4 w-4 mr-2" />Contact on WhatsApp
                    </a>
                  </Button>
                )
              ) : (
                <Button asChild className="w-full"><Link to="/login">Login to contact</Link></Button>
              )}

              {isOwner && !data.is_filled && (
                <Button variant="outline" onClick={markFilled} className="w-full"><CheckCircle2 className="h-4 w-4 mr-1" />Mark as filled</Button>
              )}

              <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground"><Flag className="h-3.5 w-3.5 mr-1" />Report listing</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Report this listing</DialogTitle></DialogHeader>
                  <Textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Why are you reporting this?" rows={4} />
                  <Button onClick={submitReport}>Submit report</Button>
                </DialogContent>
              </Dialog>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      <Icon className="h-5 w-5 text-primary" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium text-sm">{value}</div>
      </div>
    </div>
  );
}
