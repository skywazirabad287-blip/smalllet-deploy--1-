import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Building2,
  CreditCard,
  Wrench,
  BarChart3,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
  Home,
  DollarSign,
  FileText,
  MessageSquare,
  Moon,
} from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Property Management",
    description: "Manage all your properties and units in one place. Track occupancy, rent amounts, and tenant details.",
  },
  {
    icon: CreditCard,
    title: "Rent Collection",
    description: "Automated rent charges, Stripe-powered payments, late fee management, and instant receipts.",
  },
  {
    icon: Wrench,
    title: "Maintenance Tracking",
    description: "Tenants submit requests with photos. Assign to vendors, track progress, and maintain history.",
  },
  {
    icon: BarChart3,
    title: "Accounting & Reports",
    description: "Income and expense tracking, tax-ready reports, cash flow projections, and QuickBooks export.",
  },
  {
    icon: Shield,
    title: "Document Vault",
    description: "Securely store leases, IDs, insurance policies, and receipts with full-text search.",
  },
  {
    icon: MessageSquare,
    title: "Communication Hub",
    description: "In-app messaging, email templates, bulk messaging, and announcement broadcasting.",
  },
];

const testimonials = [
  {
    quote: "SmallLet saved me 5 hours a week. Rent collection is automatic and my tenants love the portal.",
    author: "Sarah M.",
    role: "Landlord, 4 units",
  },
  {
    quote: "Finally, a property management tool that doesn't require a PhD to use. Clean, fast, and reliable.",
    author: "David K.",
    role: "Landlord, 12 units",
  },
  {
    quote: "The maintenance tracking alone is worth it. My tenants submit requests with photos and I assign them instantly.",
    author: "Maria G.",
    role: "Property Manager, 18 units",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">SmallLet</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2" />
            Now in public beta
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:text-7xl">
            Property management
            <br />
            <span className="text-primary">for small landlords</span>
          </h1>
          <p className="max-w-[700px] text-lg text-muted-foreground md:text-xl">
            The simplest, most powerful platform for landlords with 1-20 units.
            Collect rent, manage tenants, track maintenance, and handle accounting — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Button size="lg" asChild>
              <Link href="/auth/signup">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/signin">Sign in to demo</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Demo: demo@smalllet.app / password123
          </p>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="border-y bg-muted/50">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold">1,200+</div>
              <div className="text-sm text-muted-foreground">Landlords</div>
            </div>
            <div>
              <div className="text-3xl font-bold">8,500+</div>
              <div className="text-sm text-muted-foreground">Units Managed</div>
            </div>
            <div>
              <div className="text-3xl font-bold">$2.4M</div>
              <div className="text-sm text-muted-foreground">Rent Collected</div>
            </div>
            <div>
              <div className="text-3xl font-bold">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-24">
        <div className="mx-auto max-w-[980px] text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need to manage rentals
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Built from the ground up for small landlords who want power without complexity.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-lg border bg-card p-6 hover:shadow-md transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y bg-muted/50">
        <div className="container py-24">
          <div className="mx-auto max-w-[980px] text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Get started in minutes
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Add your properties",
                description: "Enter property details, upload photos, and set up units in under 2 minutes.",
                icon: Building2,
              },
              {
                step: "02",
                title: "Invite tenants",
                description: "Add tenant profiles, create leases, and send portal invitations via email.",
                icon: FileText,
              },
              {
                step: "03",
                title: "Collect rent automatically",
                description: "Set up recurring charges, connect Stripe, and watch rent roll in automatically.",
                icon: DollarSign,
              },
            ].map((item) => (
              <div key={item.step} className="relative flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground max-w-[280px]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="container py-24">
        <div className="mx-auto max-w-[980px] text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Loved by small landlords
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.author} className="rounded-lg border bg-card p-6">
              <p className="text-sm text-muted-foreground mb-4">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="font-semibold text-sm">{t.author}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-y bg-muted/50">
        <div className="container py-24">
          <div className="mx-auto max-w-[980px] text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Simple pricing</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free, scale when you grow. No hidden fees.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              {
                name: "Free",
                price: "$0",
                description: "For landlords just getting started",
                features: [
                  "1 property",
                  "Up to 3 units",
                  "Tenant management",
                  "Basic maintenance tracking",
                  "Email support",
                ],
                cta: "Get Started",
                popular: false,
              },
              {
                name: "Starter",
                price: "$19",
                period: "/month",
                description: "For growing landlords",
                features: [
                  "Up to 5 properties",
                  "Up to 20 units",
                  "Stripe rent collection",
                  "Maintenance & vendors",
                  "Document vault",
                  "Priority support",
                ],
                cta: "Start Free Trial",
                popular: true,
              },
              {
                name: "Pro",
                price: "$49",
                period: "/month",
                description: "For serious landlords",
                features: [
                  "Unlimited properties",
                  "Unlimited units",
                  "Team members (5)",
                  "Advanced reporting",
                  "API access",
                  "White-label tenant portal",
                  "Phone support",
                ],
                cta: "Start Free Trial",
                popular: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg border bg-card p-6 ${
                  plan.popular ? "ring-2 ring-primary shadow-lg" : ""
                }`}
              >
                {plan.popular && (
                  <div className="inline-flex items-center rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6" variant={plan.popular ? "default" : "outline"} asChild>
                  <Link href="/auth/signup">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-24">
        <div className="mx-auto max-w-[700px] text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Ready to simplify your property management?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground mb-8">
            Join 1,200+ landlords who save hours every week with SmallLet.
          </p>
          <Button size="lg" asChild>
            <Link href="/auth/signup">
              Get Started for Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                  <Home className="h-3 w-3 text-primary-foreground" />
                </div>
                <span className="font-bold">SmallLet</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Property management software built for small landlords.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About</Link></li>
                <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground">Terms</Link></li>
                <li><Link href="#" className="hover:text-foreground">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2024 SmallLet. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
