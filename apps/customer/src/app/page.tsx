import Image from "next/image";
import { prisma } from "@p4p/db";
import SchoolPicker from "@/components/SchoolPicker";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  let dbStatus = "Checking database connection...";
  let isDbConnected = false;
  let testCount = 0;
  let schoolsList: any[] = [];

  try {
    // Attempt a count on our seeded products table
    testCount = await prisma.product.count();
    isDbConnected = true;
    dbStatus = `Connected! Active Catalog: ${testCount} items.`;

    // Fetch active schools and their lists
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
  } catch (error: any) {
    console.error("Database connection error:", error);
    dbStatus = `Database connection error: ${error?.message || "Unknown error"}`;
  }

  // Format schools payload for SchoolPicker
  const formattedSchools = schoolsList.map((school) => ({
    id: school.id,
    name: school.name,
    region: school.region,
    templates: school.templates.map((t: any) => ({
      id: t.id,
      gradeLevel: t.gradeLevel,
      academicYear: t.academicYear,
    })),
  }));

  return (
    <div className="flex min-h-screen flex-col bg-purewhite font-sans text-jetblack">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-48">
              <Image
                src="/brand/logo-wordmark.svg"
                alt="PREPPED 4 PREP Logo"
                fill
                priority
                className="object-contain object-left"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center rounded-full bg-papaya/10 px-3 py-1 text-sm font-semibold text-caramel">
              Customer Storefront
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-bold border border-green-200">
              {dbStatus}
            </span>
          </div>
        </div>
      </header>

      {/* Hero / Main Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-papaya-light/25 to-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
              {/* Left Column: Heading and info */}
              <div className="lg:col-span-6 space-y-6 pt-4 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-papaya px-3 py-1 text-xs font-black uppercase tracking-wider text-jetblack">
                  Avoid the fuss, trust us!
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-jetblack sm:text-6xl leading-tight">
                  Back-To-School <br />
                  Stationery, <br />
                  <span className="text-caramel">Prepped With Love.</span>
                </h1>
                <p className="max-w-xl text-lg text-gray-600">
                  Avoid the Durban summer shopping rush! Select your child's school list and configure a custom stationery pack. We cover your books, custom-label every item, and deliver straight to your door.
                </p>

                {/* DB status panel */}
                <div className="flex items-center gap-3 text-sm text-gray-500 justify-center lg:justify-start">
                  <div className={`h-2.5 w-2.5 rounded-full ${isDbConnected ? "bg-green-500" : "bg-vermillion animate-ping"}`} />
                  <span>DB Connection: {isDbConnected ? "Online" : "Connection Error"}</span>
                </div>
              </div>

              {/* Right Column: Interactive School Picker */}
              <div className="lg:col-span-6 flex flex-col gap-8">
                <SchoolPicker schools={formattedSchools} />
                
                {/* Preppi Scanner Promo Card */}
                <div className="w-full max-w-xl mx-auto rounded-2xl bg-papaya/5 border border-papaya/20 p-6 flex gap-4 items-center">
                  <div className="relative h-20 w-10 shrink-0">
                    <Image
                      src="/brand/preppi-mascot.svg"
                      alt="Preppi Mascot"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <h4 className="font-extrabold text-jetblack text-sm">Have a custom stationery list?</h4>
                    <p className="text-xs text-gray-600 leading-normal">
                      Skip search entirely! Upload a photo or PDF of your list, and Preppi AI will match everything in seconds.
                    </p>
                    <Link
                      href="/import"
                      className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-jetblack hover:bg-caramel px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      Scan Stationery List
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Prepped 4 Prep. Durban, South Africa.</p>
        </div>
      </footer>
    </div>
  );
}
