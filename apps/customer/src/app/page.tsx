import Image from "next/image";
import Link from "next/link";
import { prisma, Prisma } from "@p4p/db";
import SchoolPicker from "@/components/SchoolPicker";
import OrderTrackerSection from "@/components/OrderTrackerSection";
import {
  ArrowRight,
  BookOpen,
  Scissors,
  Tag,
  Truck,
  CheckCircle2,
  Heart,
  Star,
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

  const announcements = [
    "Now accepting orders for the 2027 school year",
    "Free delivery on orders over R500",
    "Book covering and labeling included with every pack",
    "Servicing 15+ schools across Durban and KZN",
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#F0F9FF] font-sans text-jetblack selection:bg-papaya selection:text-jetblack">
      {/* ── Scrolling Announcement Bar ─────────────────────────────────────── */}
      <div className="bg-jetblack py-2.5 overflow-hidden shadow-sm" role="marquee" aria-label="Announcements">
        <div className="announcement-scroll whitespace-nowrap">
          {[...announcements, ...announcements].map((msg, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-8 text-xs font-semibold text-white/90">
              <span className="h-1.5 w-1.5 rounded-full bg-papaya shrink-0" aria-hidden="true" />
              {msg}
            </span>
          ))}
        </div>
      </div>

      {/* ── Sticky Header Navigation ───────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative h-14 w-56 transition-transform duration-200 group-hover:scale-[1.02]">
              <Image
                src="/brand/p4p-logo.png"
                alt="PREPPED 4 PREP Logo"
                fill
                priority
                className="object-contain object-left"
              />
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-gray-700">
            <a href="#school-picker" className="hover:text-caramel transition-colors duration-200">
              Find My School
            </a>
            <Link href="/import" className="flex items-center gap-1.5 font-bold text-caramel hover:text-jetblack transition-colors duration-200">
              <FileText className="h-4 w-4" />
              List Scanner
            </Link>
            <a href="#services" className="hover:text-caramel transition-colors duration-200">
              Services
            </a>
            <a href="#track-order" className="hover:text-caramel transition-colors duration-200">
              Track Order
            </a>
            <Link href="/orders" className="hover:text-caramel transition-colors duration-200">
              My Orders
            </Link>
          </nav>

          {/* Primary CTA */}
          <a
            href="#school-picker"
            className="flex items-center gap-2 rounded-xl bg-papaya px-5 py-2.5 text-sm font-bold text-jetblack shadow-sm hover:bg-caramel hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 shrink-0"
          >
            <span>Get School Pack</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {/* ── Hero Section ──────────────────────────────────────────────────── */}
        <section className="relative min-h-[85vh] flex items-center overflow-hidden">
          {/* Background Image */}
          <Image
            src="/brand/hero-bg.jpg"
            alt="Colorful school stationery supplies"
            fill
            priority
            className="object-cover"
          />
          {/* Clean dark overlay for text readability */}
          <div className="absolute inset-0 bg-jetblack/65" />

          {/* Hero Content */}
          <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-20 lg:py-28">
            <div className="max-w-3xl space-y-8">
              {/* Eyebrow */}
              <p className="text-sm font-semibold text-papaya tracking-wide">
                Durban&apos;s trusted mom-led school stationery service
              </p>

              {/* Headline */}
              <h1 className="text-5xl font-black tracking-tight text-white sm:text-7xl leading-[1.05]">
                Back-To-School{" "}
                <br className="hidden sm:block" />
                Stationery,{" "}
                <br />
                <span className="text-papaya">
                  Prepped With Love.
                </span>
              </h1>

              {/* Sub-copy */}
              <p className="text-lg sm:text-xl text-gray-300 max-w-2xl leading-relaxed">
                Pick your child&apos;s school, and we&apos;ll pack every pen, cover
                exercise books in heavy-duty plastic, print custom waterproof
                name labels, and deliver straight to your door.
              </p>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-white/90">
                <span className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-papaya" />
                  15+ Durban Schools
                </span>
                <span className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-papaya" />
                  Book Covering Included
                </span>
                <span className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-papaya" />
                  Custom Name Labels
                </span>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
                <a
                  href="#school-picker"
                  className="group flex items-center gap-3 rounded-xl bg-papaya px-8 py-4 text-base font-bold text-jetblack shadow-lg hover:bg-caramel hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                >
                  <BookOpen className="h-5 w-5" />
                  <span>Find Your School List</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </a>

                <Link
                  href="/import"
                  className="group flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/25 px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-white/20 hover:border-white/40 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <FileText className="h-5 w-5 text-papaya" />
                  <span>Upload Your List</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </div>

              {/* Founder tagline */}
              <p className="flex items-center gap-2 text-xs font-medium text-white/60 pt-2">
                <Heart className="h-3.5 w-3.5 text-papaya fill-papaya" aria-hidden="true" />
                <span>&quot;Avoid the Fuss, Trust Us!&quot; — Founded by Caron &amp; Jess in Durban</span>
              </p>
            </div>

            {/* Mascot */}
            <div className="hidden lg:block absolute right-12 bottom-16 z-10">
              <div className="relative h-36 w-20 drop-shadow-xl opacity-90">
                <Image
                  src="/brand/preppi-mascot.svg"
                  alt="Preppi the Pencil Mascot"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Banner ─────────────────────────────────────────────────── */}
        <section className="bg-jetblack text-white py-8 border-y border-gray-800 shadow-inner">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-black text-papaya">15+</div>
                <div className="text-xs font-medium text-gray-300">Durban Schools Supported</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-black text-papaya">5,000+</div>
                <div className="text-xs font-medium text-gray-300">Books Covered &amp; Labeled</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-black text-papaya">Since 2019</div>
                <div className="text-xs font-medium text-gray-300">Serving Durban Families</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-black text-papaya flex items-center justify-center gap-1">
                  4.9
                  <Star className="h-6 w-6 fill-papaya text-papaya" aria-hidden="true" />
                </div>
                <div className="text-xs font-medium text-gray-300">Parent Rating</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Find Your School List Section ─────────────────────────────────── */}
        <section id="school-picker" className="py-20 bg-[#F0F9FF]">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left: Heading & context */}
              <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
                <h2 className="text-3xl sm:text-5xl font-black text-jetblack tracking-tight leading-tight">
                  Find Your School List
                </h2>
                <p className="text-gray-600 text-base leading-relaxed max-w-md mx-auto lg:mx-0">
                  Select your child&apos;s school and grade below. We&apos;ll
                  load the required stationery list — every pen, book, and
                  accessory matched to your school&apos;s exact requirements.
                </p>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-sm font-medium text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Exact school match
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Pre-filled cart
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Nothing missing
                  </span>
                </div>

                {/* Scan prompt card */}
                <div className="rounded-2xl bg-white border border-sky-200/80 p-5 flex items-center gap-4 max-w-md mx-auto lg:mx-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                  <div className="relative h-14 w-10 shrink-0">
                    <Image
                      src="/brand/preppi-mascot.svg"
                      alt="Preppi Mascot"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Got a paper list instead?</p>
                    <Link
                      href="/import"
                      className="inline-flex items-center gap-2 text-sm font-bold text-jetblack bg-papaya hover:bg-caramel px-4 py-2 rounded-xl shadow-xs hover:shadow-md transition-all duration-200"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Upload &amp; Scan</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right: SchoolPicker Card */}
              <div className="lg:col-span-7">
                <SchoolPicker schools={formattedSchools} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Services Section ─────────────────────────────────────────────── */}
        <section id="services" className="py-20 bg-[#F0F9FF] border-t border-sky-100">
          <div className="mx-auto max-w-7xl px-6 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl font-black text-jetblack sm:text-5xl tracking-tight">
                Our Back-To-School Services
              </h2>
              <p className="text-base text-gray-600">
                We handle the tedious, time-consuming tasks so your family can enjoy the summer holidays.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Pre-Packed Lists */}
              <div className="rounded-2xl bg-white border border-sky-200/80 border-t-4 border-t-papaya p-6 space-y-4 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group">
                <div className="h-12 w-12 rounded-xl bg-papaya/15 flex items-center justify-center text-caramel group-hover:bg-papaya group-hover:text-jetblack transition-colors duration-300 shadow-xs">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-jetblack">Pre-Packed School Lists</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Configured per school and grade. Every pen, exercise book, eraser, and art supply matched to your school&apos;s requirements.
                </p>
              </div>

              {/* Card 2: Book Covering */}
              <div className="rounded-2xl bg-white border border-sky-200/80 border-t-4 border-t-papaya p-6 space-y-4 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group">
                <div className="h-12 w-12 rounded-xl bg-papaya/15 flex items-center justify-center text-caramel group-hover:bg-papaya group-hover:text-jetblack transition-colors duration-300 shadow-xs">
                  <Scissors className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-jetblack">Heavy-Duty Book Covering</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Durable plastic or classic brown paper. No more late-night contact paper struggles — we cover every exercise book for you.
                </p>
              </div>

              {/* Card 3: Name Labels */}
              <div className="rounded-2xl bg-white border border-sky-200/80 border-t-4 border-t-papaya p-6 space-y-4 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group">
                <div className="h-12 w-12 rounded-xl bg-papaya/15 flex items-center justify-center text-caramel group-hover:bg-papaya group-hover:text-jetblack transition-colors duration-300 shadow-xs">
                  <Tag className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-jetblack">Custom Name Labels</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Waterproof, scratch-resistant printed name tags applied to every pencil, marker, book, and lunch container.
                </p>
              </div>

              {/* Card 4: Delivery */}
              <div className="rounded-2xl bg-white border border-sky-200/80 border-t-4 border-t-papaya p-6 space-y-4 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group">
                <div className="h-12 w-12 rounded-xl bg-papaya/15 flex items-center justify-center text-caramel group-hover:bg-papaya group-hover:text-jetblack transition-colors duration-300 shadow-xs">
                  <Truck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-jetblack">Doorstep &amp; School Delivery</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Delivered to your home in Durban or bulk drop-off at participating KZN school campuses before day one.
                </p>
              </div>
            </div>

            {/* Service Feature: Book Covering Showcase */}
            <div className="mt-12 rounded-2xl overflow-hidden border border-sky-200/80 shadow-lg bg-white grid grid-cols-1 md:grid-cols-12 items-center">
              <div className="md:col-span-7 p-8 sm:p-12 space-y-4">
                <p className="text-sm font-semibold text-caramel">Professional Book Covering</p>
                <h3 className="text-2xl sm:text-4xl font-black text-jetblack">
                  No More Contact Paper Struggles At Midnight
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Every exercise book is wrapped using durable, non-stick protective plastic with reinforced edges. Your child&apos;s books stay pristine all four school terms.
                </p>
                <div className="pt-2">
                  <a
                    href="#school-picker"
                    className="inline-flex items-center gap-2 rounded-xl bg-jetblack px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-caramel hover:shadow-lg transition-all duration-200"
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

            {/* Personalized Note Card Feature */}
            <div className="mt-12 rounded-2xl bg-papaya p-8 sm:p-12 text-jetblack shadow-lg overflow-hidden border border-amber-400">
              <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8">
                <div className="lg:col-span-7 space-y-4">
                  <p className="text-sm font-bold text-jetblack/70">Included free in every pack</p>
                  <h3 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                    Every Pack Comes With A Personal Welcome Note
                  </h3>
                  <p className="text-sm font-medium text-jetblack/80 leading-relaxed max-w-xl">
                    We write a personalized greeting card for every child&apos;s
                    stationery pack. Starting Grade 1 or a new school year is a big
                    milestone — we make sure your child feels excited for Day 1.
                  </p>
                  <div className="pt-2 flex items-center gap-4">
                    <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden border-2 border-white/60 shadow-sm">
                      <Image
                        src="/brand/square-logo.png"
                        alt="Prepped 4 Prep badge"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="text-sm">
                      <span className="font-bold">Hand-packed with care in Durban</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 relative h-72 sm:h-80 w-full rounded-xl overflow-hidden border-2 border-white/40 shadow-xl bg-white p-2">
                  <Image
                    src="/brand/box-note-template.webp"
                    alt="Personalized child welcome note template"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Order Tracking ───────────────────────────────────────────────── */}
        <OrderTrackerSection />

        {/* ── How It Works ─────────────────────────────────────────────────── */}
        <section className="py-20 bg-[#F0F9FF]">
          <div className="mx-auto max-w-7xl px-6 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl font-black text-jetblack sm:text-5xl tracking-tight">
                How Prepped 4 Prep Works
              </h2>
              <p className="text-base text-gray-600">
                From school selection to doorstep delivery in four simple steps.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  title: "Select School & Grade",
                  desc: "Choose from our pre-loaded Durban school templates, or upload your own list for Preppi to scan.",
                },
                {
                  step: "02",
                  title: "Customise Your Pack",
                  desc: "Add book covering, personalized name labels, or optional extras to your stationery pack.",
                },
                {
                  step: "03",
                  title: "We Pack & Label",
                  desc: "Our team carefully packs, covers, and labels every item by hand in our Durban warehouse.",
                },
                {
                  step: "04",
                  title: "Delivered to Your Door",
                  desc: "Your ready-for-school package arrives at your doorstep or school campus before day one.",
                },
              ].map((item) => (
                <div key={item.step} className="rounded-2xl bg-white p-6 border border-sky-200/80 shadow-md space-y-3 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
                  <span className="text-4xl font-black text-papaya">{item.step}</span>
                  <h3 className="text-lg font-bold text-jetblack">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Supported Schools ────────────────────────────────────────────── */}
        <section className="py-20 bg-white border-t border-sky-100">
          <div className="mx-auto max-w-7xl px-6 space-y-8 text-center">
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-jetblack sm:text-3xl">
                Partnered With Durban&apos;s Top Schools
              </h3>
              <p className="text-sm text-gray-600">
                We service over 15 primary and high schools across Durban and KZN.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {schoolsSupported.map((schoolName) => (
                <span
                  key={schoolName}
                  className="rounded-xl bg-[#F0F9FF] border border-sky-200/80 px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-xs hover:border-papaya hover:bg-white transition-all duration-200"
                >
                  {schoolName}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Parent Reviews ───────────────────────────────────────────────── */}
        <section id="why-us" className="py-20 bg-jetblack text-white shadow-inner">
          <div className="mx-auto max-w-7xl px-6 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl font-black text-white sm:text-5xl tracking-tight">
                What Durban Parents Say
              </h2>
              <p className="text-base text-gray-300">
                Real feedback from families who&apos;ve used Prepped 4 Prep.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  quote: "Prepped 4 Prep saved my December holidays! All books arrived covered in thick plastic with custom name labels. Worth every cent.",
                  name: "Sarah M.",
                  school: "Westville Preparatory Parent",
                },
                {
                  quote: "I uploaded my son's blurry paper list and the scanner matched everything in seconds. Checkout took less than two minutes.",
                  name: "Nokuthula Z.",
                  school: "Durban Primary (DPHS) Parent",
                },
                {
                  quote: "The personalized note inside the box put a huge smile on my daughter's face on day one of Grade 1. Such a thoughtful touch.",
                  name: "Claire T.",
                  school: "St Mary's DSG Parent",
                },
              ].map((review) => (
                <div key={review.name} className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4 shadow-md hover:bg-white/10 hover:border-white/20 transition-all duration-200">
                  <div className="flex text-papaya gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-papaya" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed italic">
                    &ldquo;{review.quote}&rdquo;
                  </p>
                  <div>
                    <h4 className="text-sm font-bold text-white">{review.name}</h4>
                    <span className="text-xs text-gray-400">{review.school}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-sky-100 bg-[#E0F2FE]/40 py-12 text-jetblack">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="relative h-10 w-44">
              <Image
                src="/brand/logo-wordmark.svg"
                alt="PREPPED 4 PREP Logo"
                fill
                className="object-contain object-left"
              />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Durban&apos;s trusted back-to-school stationery, book covering &amp; custom labeling service.
            </p>
            <p className="text-sm font-bold text-caramel">&quot;Avoid the Fuss, Trust Us!&quot;</p>
          </div>

          <div className="space-y-3 text-sm">
            <h4 className="font-bold text-jetblack">Quick Links</h4>
            <ul className="space-y-2 text-gray-600">
              <li><a href="#school-picker" className="hover:text-caramel transition-colors duration-200">Find My School</a></li>
              <li><Link href="/import" className="hover:text-caramel transition-colors duration-200">List Scanner</Link></li>
              <li><a href="#track-order" className="hover:text-caramel transition-colors duration-200">Track My Order</a></li>
              <li><Link href="/orders" className="hover:text-caramel transition-colors duration-200">My Orders &amp; Account</Link></li>
              <li><Link href="/privacy" className="hover:text-caramel transition-colors duration-200">POPIA Privacy Notice</Link></li>
            </ul>
          </div>

          <div className="space-y-3 text-sm">
            <h4 className="font-bold text-jetblack">Our Services</h4>
            <ul className="space-y-2 text-gray-600">
              <li>Pre-Packed School Lists</li>
              <li>Heavy-Duty Book Covering</li>
              <li>Waterproof Name Labeling</li>
              <li>Doorstep &amp; School Delivery</li>
            </ul>
          </div>

          <div className="space-y-3 text-sm">
            <h4 className="font-bold text-jetblack">Contact</h4>
            <p className="text-gray-600">Durban, KwaZulu-Natal, South Africa</p>
            <p className="text-gray-600">
              <a href="mailto:admin@prepped4prep.co.za" className="font-semibold text-jetblack hover:underline transition-colors duration-200">
                admin@prepped4prep.co.za
              </a>
            </p>
            <p className="text-xs text-gray-400 pt-1">
              POPIA Compliant &middot; Encrypted Checkout
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 mt-8 pt-6 border-t border-sky-200/80 text-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Prepped 4 Prep. Avoid the fuss, trust us! Built with love in Durban.</p>
        </div>
      </footer>
    </div>
  );
}
