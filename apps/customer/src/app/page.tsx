import Image from "next/image";
import Link from "next/link";
import { prisma, Prisma } from "@p4p/db";
import SchoolPicker from "@/components/SchoolPicker";
import OrderTrackerSection from "@/components/OrderTrackerSection";
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Scissors,
  Tag,
  Truck,
  CheckCircle2,
  Heart,
  ShieldCheck,
  Star,
  Zap,
  HelpCircle,
  FileText,
} from "lucide-react";

export const dynamic = "force-dynamic";

type SchoolWithTemplates = Prisma.SchoolGetPayload<{
  include: {
    templates: {
      select: {
        id: true;
        gradeLevel: true;
        academicYear: true;
      };
    };
  };
}>;

export default async function Home() {
  let isDbConnected = false;
  let schoolsList: SchoolWithTemplates[] = [];

  try {
    schoolsList = await prisma.school.findMany({
      where: { isActive: true },
      include: {
        templates: {
          where: { isActive: true },
          select: {
            id: true,
            gradeLevel: true,
            academicYear: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
    isDbConnected = true;
  } catch (error) {
    console.error("Database connection error:", error);
  }

  const formattedSchools = schoolsList.map((school) => ({
    id: school.id,
    name: school.name,
    region: school.region,
    templates: school.templates.map((t) => ({
      id: t.id,
      gradeLevel: t.gradeLevel,
      academicYear: t.academicYear,
    })),
  }));

  const schoolsSupported = [
    "Westville Preparatory School",
    "Durban Primary High School (DPHS)",
    "Clifton School",
    "St Mary's DSG Kloof",
    "Crawford International La Lucia",
    "Kearsney College",
    "Maris Stella School",
    "Thomas More College",
    "Glenwood Preparatory",
    "Chelsea Preparatory School",
    "Curro Hillcrest",
    "Our Lady of Fatima",
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-jetblack selection:bg-papaya selection:text-jetblack">
      {/* ── Top Announcement Bar ───────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-teal-700 via-purple-700 to-amber-500 py-2.5 px-4 text-center text-xs font-black text-white tracking-wide flex items-center justify-center gap-2">
        <Sparkles className="h-4 w-4 text-papaya animate-bounce shrink-0" />
        <span>Avoid the Durban Back-To-School Rush! We Cover, Label & Deliver Your Exact School Pack.</span>
        <span className="hidden md:inline bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
          Avoid the fuss, trust us!
        </span>
      </div>

      {/* ── Sticky Header Navigation ───────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-12 w-48 transition-transform group-hover:scale-105">
              <Image
                src="/brand/logo-wordmark.svg"
                alt="PREPPED 4 PREP Logo"
                fill
                priority
                className="object-contain object-left"
              />
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-bold text-gray-700">
            <a href="#school-picker" className="hover:text-caramel transition-colors">
              Find My School
            </a>
            <Link href="/import" className="flex items-center gap-1 text-purple-700 font-extrabold hover:text-purple-900 transition-colors">
              <Zap className="h-4 w-4 fill-purple-700 text-purple-700" />
              AI List Scanner
            </Link>
            <a href="#services" className="hover:text-caramel transition-colors">
              Book Covering & Labels
            </a>
            <a href="#track-order" className="hover:text-caramel transition-colors">
              Track Order
            </a>
            <a href="#why-us" className="hover:text-caramel transition-colors">
              Our Durban Story
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-xs font-bold text-gray-700 hover:text-jetblack px-3.5 py-2 rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
            >
              Parent Portal
            </Link>
            <a
              href="#school-picker"
              className="flex items-center gap-2 rounded-2xl bg-papaya px-5 py-2.5 text-xs font-black text-jetblack hover:bg-caramel hover:shadow-md transition-all cursor-pointer"
            >
              <span>Get School Pack</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero Section (Inspired by kids-school-landing) ────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 pt-12 pb-20 lg:pt-16 lg:pb-28">
          {/* Decorative background shapes */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-papaya/20 blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 -right-24 h-96 w-96 rounded-full bg-purple-200/30 blur-3xl" />

          <div className="mx-auto max-w-7xl px-6 relative z-10">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
              {/* Left Column: Heading & Copy */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 border border-amber-300/60 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-caramel shadow-xs">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <span>Durban's #1 Mom-Led School Stationery Service</span>
                </div>

                <h1 className="text-4xl font-black tracking-tight text-jetblack sm:text-6xl leading-[1.1]">
                  Back-To-School <br />
                  Stationery, <br />
                  <span className="bg-gradient-to-r from-teal-700 via-purple-700 to-amber-500 bg-clip-text text-transparent">
                    Prepped With Love.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Avoid the Durban summer shopping rush! Select your child's exact school list, and we'll pack every pen, cover exercise books in heavy-duty plastic, print custom waterproof name tags, and deliver straight to your door or school.
                </p>

                {/* Hero Badges */}
                <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-bold text-gray-700">
                  <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-gray-100 shadow-xs">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>15+ Durban Schools</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-gray-100 shadow-xs">
                    <CheckCircle2 className="h-4 w-4 text-teal-600" />
                    <span>Book Covering Included</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-gray-100 shadow-xs">
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    <span>Custom Child Name Labels</span>
                  </div>
                </div>

                {/* Main Hero Image */}
                <div className="relative mt-6 rounded-3xl overflow-hidden border-4 border-white shadow-2xl max-w-lg mx-auto lg:mx-0">
                  <div className="relative h-64 sm:h-72 w-full">
                    <Image
                      src="/brand/hero-kids.jpg"
                      alt="Happy Durban kids with school stationery packs"
                      fill
                      priority
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                    <p className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-2">
                      <Heart className="h-4 w-4 text-papaya fill-papaya" />
                      <span>Tagline: "Avoid the Fuss, Trust us!" — Founded by Caron & Jess</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive School Picker Card */}
              <div id="school-picker" className="lg:col-span-6 space-y-6">
                <div className="relative">
                  <div className="absolute -top-3 -right-3 z-20 bg-papaya text-jetblack text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border-2 border-white shadow-md animate-pulse">
                    Quick 1-Click Order
                  </div>
                  <SchoolPicker schools={formattedSchools} />
                </div>

                {/* Secondary AI Scanner Box */}
                <div className="rounded-3xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-6 shadow-xl flex flex-col sm:flex-row items-center gap-5 border border-purple-800">
                  <div className="relative h-24 w-16 shrink-0 bg-white/10 rounded-2xl p-2 flex items-center justify-center">
                    <Image
                      src="/brand/preppi-mascot.svg"
                      alt="Preppi Mascot"
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="space-y-2 text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-purple-800 px-2.5 py-0.5 rounded-full text-papaya">
                      <Zap className="h-3 w-3 fill-papaya" />
                      Ask Preppi AI Scanner
                    </div>
                    <h4 className="font-extrabold text-white text-base">Have a paper or handwritten list?</h4>
                    <p className="text-xs text-purple-200 leading-normal">
                      Snap a photo of your child's stationery list. Preppi matches all items automatically & suggests cheaper options!
                    </p>
                    <Link
                      href="/import"
                      className="inline-flex items-center gap-2 text-xs font-black text-jetblack bg-papaya hover:bg-caramel px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      <span>Scan My Stationery List</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats & Trust Banner ───────────────────────────────────────────── */}
        <section className="bg-jetblack text-white py-10 border-y border-amber-400">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-black text-papaya">15+</div>
                <div className="text-xs font-bold text-gray-300">Durban Schools Supported</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-black text-papaya">5,000+</div>
                <div className="text-xs font-bold text-gray-300">Books Covered in Plastic</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-black text-papaya">100%</div>
                <div className="text-xs font-bold text-gray-300">Stress-Free Back to School</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-black text-papaya">4.9 ★</div>
                <div className="text-xs font-bold text-gray-300">Durban Mom Reviews</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Services Showcase Section ──────────────────────────────────────── */}
        <section id="services" className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-6 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-teal-700">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Everything Done For You</span>
              </div>
              <h2 className="text-3xl font-black text-jetblack sm:text-5xl tracking-tight">
                Our Back-To-School Services
              </h2>
              <p className="text-base text-gray-600">
                We handle the tedious, time-consuming tasks so your family can enjoy the summer holidays.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Card 1: Pre-Packed Lists */}
              <div className="rounded-3xl bg-amber-50/60 border-2 border-amber-200 p-6 space-y-4 hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="h-14 w-14 rounded-2xl bg-papaya flex items-center justify-center text-jetblack font-black shadow-sm group-hover:scale-110 transition-transform">
                  <BookOpen className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-black text-jetblack">Pre-Packed School Lists</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Pre-configured per school and grade level. Every pen, exercise book, eraser, and artistic item matched with zero omissions.
                </p>
                <div className="pt-2 text-xs font-bold text-caramel flex items-center gap-1">
                  <span>Exact School Match</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                </div>
              </div>

              {/* Card 2: Professional Book Covering */}
              <div className="rounded-3xl bg-sky-50/60 border-2 border-sky-200 p-6 space-y-4 hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="h-14 w-14 rounded-2xl bg-sky-500 flex items-center justify-center text-white font-black shadow-sm group-hover:scale-110 transition-transform">
                  <Scissors className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-black text-jetblack">Book Covering Service</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Heavy-duty plastic, classic brown paper, or custom thematic patterns. Say goodbye to late-night contact paper bubbles and tears!
                </p>
                <div className="pt-2 text-xs font-bold text-sky-700 flex items-center gap-1">
                  <span>Heavy-Duty Protection</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                </div>
              </div>

              {/* Card 3: Custom Name Labeling */}
              <div className="rounded-3xl bg-pink-50/60 border-2 border-pink-200 p-6 space-y-4 hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="h-14 w-14 rounded-2xl bg-pink-500 flex items-center justify-center text-white font-black shadow-sm group-hover:scale-110 transition-transform">
                  <Tag className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-black text-jetblack">Personalized Labeling</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Waterproof, scratch-resistant printed name tags applied to every individual pencil, marker, book, and lunch container.
                </p>
                <div className="pt-2 text-xs font-bold text-pink-700 flex items-center gap-1">
                  <span>Waterproof & Durable</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                </div>
              </div>

              {/* Card 4: Delivery */}
              <div className="rounded-3xl bg-emerald-50/60 border-2 border-emerald-200 p-6 space-y-4 hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white font-black shadow-sm group-hover:scale-110 transition-transform">
                  <Truck className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-black text-jetblack">Doorstep & School Pickup</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Direct delivery to your home in Durban or convenient bulk drop-off at participating KZN school campuses before day 1.
                </p>
                <div className="pt-2 text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <span>Greater Durban Delivery</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                </div>
              </div>
            </div>

            {/* Service Feature Graphic */}
            <div className="mt-12 rounded-3xl overflow-hidden border-2 border-gray-100 shadow-xl bg-gray-50 grid grid-cols-1 md:grid-cols-12 items-center">
              <div className="md:col-span-7 p-8 sm:p-12 space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-caramel">Neat & Durable</span>
                <h3 className="text-2xl sm:text-4xl font-black text-jetblack">
                  No More Contact Paper Struggles At Midnight!
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Every exercise book is wrapped using durable, non-stick protective plastic with reinforced edges. Your child's books stay pristine all 4 school terms.
                </p>
                <div className="pt-2">
                  <a
                    href="#school-picker"
                    className="inline-flex items-center gap-2 rounded-xl bg-jetblack px-6 py-3 text-xs font-black text-white hover:bg-caramel transition-colors"
                  >
                    <span>Order Covered Pack</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <div className="md:col-span-5 relative h-64 md:h-full min-h-[250px]">
                <Image
                  src="/brand/book-covering.jpg"
                  alt="Neatly plastic covered exercise books"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Order Tracking Feature Block ───────────────────────────────────── */}
        <OrderTrackerSection />

        {/* ── How It Works (4 Playful Steps) ─────────────────────────────────── */}
        <section className="py-20 bg-gradient-to-b from-white via-amber-50/40 to-white">
          <div className="mx-auto max-w-7xl px-6 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 border border-purple-300 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-purple-800">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Simple 4-Step Process</span>
              </div>
              <h2 className="text-3xl font-black text-jetblack sm:text-5xl tracking-tight">
                How Prepped 4 Prep Works
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  title: "Select School & Grade",
                  desc: "Choose from our pre-loaded Durban school templates or scan your custom list with Preppi AI.",
                },
                {
                  step: "02",
                  title: "Customise Services",
                  desc: "Add book covering, personalized name labels, or optional extra stationery items.",
                },
                {
                  step: "03",
                  title: "Packed With Love",
                  desc: "Our Durban team carefully packs, covers, and labels every single item in your order.",
                },
                {
                  step: "04",
                  title: "Delivered to Door",
                  desc: "Receive your ready-for-school package at your doorstep or school campus!",
                },
              ].map((item) => (
                <div key={item.step} className="rounded-3xl bg-white p-6 border border-gray-150 shadow-md space-y-3 relative">
                  <span className="text-4xl font-black text-papaya">{item.step}</span>
                  <h3 className="text-lg font-black text-jetblack">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Supported Schools Grid ─────────────────────────────────────────── */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="mx-auto max-w-7xl px-6 space-y-8 text-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
              Servicing Over 15+ Primary & High Schools Across Durban & KZN
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {schoolsSupported.map((schoolName) => (
                <div
                  key={schoolName}
                  className="rounded-2xl bg-amber-50/70 border border-amber-200/80 px-4 py-2 text-xs font-extrabold text-jetblack hover:bg-papaya/20 hover:border-papaya transition-all cursor-default"
                >
                  🏫 {schoolName}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Parent Testimonials / Community Trust ─────────────────────────── */}
        <section id="why-us" className="py-20 bg-gray-900 text-white">
          <div className="mx-auto max-w-7xl px-6 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-papaya/20 border border-papaya/30 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-papaya">
                <Heart className="h-3.5 w-3.5 fill-papaya" />
                <span>Parent Reviews</span>
              </div>
              <h2 className="text-3xl font-black text-white sm:text-5xl tracking-tight">
                Why Durban Moms Trust Us
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-3xl bg-white/5 border border-white/10 p-6 space-y-4">
                <div className="flex text-papaya gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-papaya" />
                  ))}
                </div>
                <p className="text-xs text-gray-300 italic leading-relaxed">
                  "Prepped 4 Prep saved my December holidays! All books arrived covered in thick plastic with custom name labels. Worth every single cent!"
                </p>
                <div>
                  <h4 className="text-sm font-black text-white">Sarah M.</h4>
                  <span className="text-[10px] text-gray-400 font-bold">Westville Preparatory Parent</span>
                </div>
              </div>

              <div className="rounded-3xl bg-white/5 border border-white/10 p-6 space-y-4">
                <div className="flex text-papaya gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-papaya" />
                  ))}
                </div>
                <p className="text-xs text-gray-300 italic leading-relaxed">
                  "The AI scanner read my son's blurry paper list in 5 seconds. Checkout took less than 2 minutes. Unbelievably convenient!"
                </p>
                <div>
                  <h4 className="text-sm font-black text-white">Nokuthula Z.</h4>
                  <span className="text-[10px] text-gray-400 font-bold">Durban Primary (DPHS) Parent</span>
                </div>
              </div>

              <div className="rounded-3xl bg-white/5 border border-white/10 p-6 space-y-4">
                <div className="flex text-papaya gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-papaya" />
                  ))}
                </div>
                <p className="text-xs text-gray-300 italic leading-relaxed">
                  "Zero fuss! The personalized child note inside the box put a huge smile on my daughter's face on day 1 of Grade 1."
                </p>
                <div>
                  <h4 className="text-sm font-black text-white">Claire T.</h4>
                  <span className="text-[10px] text-gray-400 font-bold">St Mary's DSG Parent</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Playful Kiddy Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-amber-100 bg-amber-50/50 py-12 text-jetblack">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="relative h-12 w-48">
              <Image
                src="/brand/logo-wordmark.svg"
                alt="PREPPED 4 PREP Logo"
                fill
                className="object-contain object-left"
              />
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Durban's trusted back-to-school stationery, book covering & custom labeling service.
            </p>
            <p className="text-xs font-black text-caramel">"Avoid the Fuss, Trust us!"</p>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-black text-sm text-jetblack uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-1.5 text-gray-600 font-semibold">
              <li><a href="#school-picker" className="hover:text-caramel">Find My School</a></li>
              <li><Link href="/import" className="hover:text-caramel">AI List Scanner</Link></li>
              <li><a href="#track-order" className="hover:text-caramel">Track My Order</a></li>
              <li><Link href="/login" className="hover:text-caramel">Parent Account</Link></li>
            </ul>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-black text-sm text-jetblack uppercase tracking-wider">Our Services</h4>
            <ul className="space-y-1.5 text-gray-600 font-semibold">
              <li>Pre-Packed School Lists</li>
              <li>Heavy-Duty Book Covering</li>
              <li>Waterproof Name Labeling</li>
              <li>Doorstep & School Delivery</li>
            </ul>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-black text-sm text-jetblack uppercase tracking-wider">Contact & Location</h4>
            <p className="text-gray-600">Durban, KwaZulu-Natal, South Africa</p>
            <p className="text-gray-600">Email: <a href="mailto:admin@prepped4prep.co.za" className="font-bold text-jetblack hover:underline">admin@prepped4prep.co.za</a></p>
            <div className="pt-2 text-[10px] text-gray-400">
              POPIA Compliant • Encrypted Checkout
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 mt-8 pt-6 border-t border-amber-200/60 text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Prepped 4 Prep. Avoid the fuss, trust us! Built with love in Durban.</p>
        </div>
      </footer>
    </div>
  );
}
