import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home, ShoppingBag, Search, MessageSquare, CheckCircle2, Users, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CollegeConnect — Find Roommates & Shop with Students" },
      { name: "description", content: "Find your perfect flatmate and buy or sell college essentials in one trusted student community." },
      { property: "og:title", content: "CollegeConnect" },
      { property: "og:description", content: "Find your perfect flatmate and shop smart with fellow students." },
    ],
  }),
  component: Index,
});

function Index() {
  const [stats, setStats] = useState({ students: 0, listings: 0, sold: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("flat_listings").select("*", { count: "exact", head: true }).eq("is_filled", false),
      supabase.from("bazaar_products").select("*", { count: "exact", head: true }).eq("is_sold", true),
    ]).then(([a, b, c]) => {
      setStats({ students: a.count ?? 0, listings: b.count ?? 0, sold: c.count ?? 0 });
    });
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                Built for college students
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
                Find Your Perfect <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Roommate</span> & Shop Smart
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Connect with verified students from your campus. Find flatmates and trade textbooks, electronics, furniture and more — all in one place.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary-glow shadow-glow">
                  <Link to="/flatmate"><Home className="h-5 w-5 mr-2" />Find a Flatmate</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                  <Link to="/bazaar"><ShoppingBag className="h-5 w-5 mr-2" />Visit Student Bazaar</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-2xl" />
              <img src={heroImg} alt="Students using CollegeConnect" className="relative rounded-3xl shadow-glow w-full" width={1280} height={960} />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-3 gap-4 rounded-2xl bg-card border shadow-card p-6 md:p-8">
          <Stat icon={Users} value={stats.students} label="Students" />
          <Stat icon={Home} value={stats.listings} label="Active Listings" />
          <Stat icon={Package} value={stats.sold} label="Products Sold" />
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">How it works</h2>
          <p className="text-muted-foreground mt-2">Two ways to make student life easier.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <ModuleCard
            color="primary"
            icon={Home}
            title="Flatmate Finder"
            steps={[
              { icon: Search, text: "Browse verified listings near your campus" },
              { icon: MessageSquare, text: "Chat directly via WhatsApp" },
              { icon: CheckCircle2, text: "Move in with the right roommate" },
            ]}
            cta={{ to: "/flatmate", label: "Browse Flats" }}
          />
          <ModuleCard
            color="accent"
            icon={ShoppingBag}
            title="Student Bazaar"
            steps={[
              { icon: Search, text: "Find books, electronics & more from peers" },
              { icon: TrendingUp, text: "Get great deals — or list your stuff" },
              { icon: CheckCircle2, text: "Pickup on campus, easy and quick" },
            ]}
            cta={{ to: "/bazaar", label: "Shop Now" }}
          />
        </div>
      </section>
    </Layout>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Home; value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl md:text-3xl font-bold">{value.toLocaleString()}</div>
      <div className="text-xs md:text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function ModuleCard({ color, icon: Icon, title, steps, cta }: any) {
  const isPrimary = color === "primary";
  return (
    <div className={`rounded-3xl border p-8 shadow-card hover:shadow-glow transition ${isPrimary ? "bg-gradient-to-br from-primary/5 to-transparent" : "bg-gradient-to-br from-accent/5 to-transparent"}`}>
      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-4 ${isPrimary ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <ol className="space-y-3 mb-6">
        {steps.map((s: any, i: number) => (
          <li key={i} className="flex items-start gap-3">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isPrimary ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>{i + 1}</div>
            <div className="flex items-center gap-2 text-sm pt-1"><s.icon className="h-4 w-4 text-muted-foreground" />{s.text}</div>
          </li>
        ))}
      </ol>
      <Button asChild className={isPrimary ? "" : "bg-accent hover:bg-accent/90 text-accent-foreground"}>
        <Link to={cta.to}>{cta.label} →</Link>
      </Button>
    </div>
  );
}
