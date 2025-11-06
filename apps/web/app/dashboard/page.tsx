// apps/web/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/dashboard/TopBar";
import CourseGrid, { type CourseCardData } from "@/components/dashboard/CourseGrid";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/signin");

  // Resolve user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true },
  });
  if (!user) redirect("/signin");

  // Fetch courses with a first-thumb helper and sections/videos for stats
  const courses = await prisma.course.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      videos: { take: 1, orderBy: { orderIndex: "asc" }, select: { thumbnailUrl: true } },
      sections: { select: { id: true, videos: { select: { id: true, durationS: true } } } },
    },
  });

  // Fetch completed progress for this user (used to compute percent + last watched)
  const progress = await prisma.progress.findMany({
    where: { userId: user.id, completed: true },
    select: { videoId: true, completedAt: true, watchTimeS: true },
  });
  const completedSet = new Set(progress.map((p) => p.videoId));

  // Build data for the grid
  const cards: CourseCardData[] = courses.map((c) => {
    const totalVideos = c.sections.reduce((sum, s) => sum + s.videos.length, 0);
    const completedVideos = c.sections.reduce(
      (sum, s) => sum + s.videos.filter((v) => completedSet.has(v.id)).length,
      0
    );
    const percent = totalVideos ? Math.round((completedVideos / totalVideos) * 100) : 0;

    // latest completion timestamp for this course (optional)
    const lastCompleted = progress
      .filter((p) => c.sections.some((s) => s.videos.some((v) => v.id === p.videoId)))
      .map((p) => p.completedAt)
      .filter(Boolean)
      .sort()
      .pop() || null;

    return {
      id: c.id,
      title: c.title,
      createdAt: c.createdAt.toISOString(),
      totalVideos,
      totalDurationS: c.totalDurationS || 0,
      thumb: c.videos[0]?.thumbnailUrl || null,
      completedVideos,
      percent,
      lastWatchedAt: lastCompleted ? new Date(lastCompleted!).toISOString() : null,
    };
  });

  // KPI numbers
  const totalCourses = cards.length;
  const completedCourses = cards.filter((c) => c.percent === 100).length;
  const totalWatchTimeS = cards.reduce((s, c) => s + c.totalDurationS, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <main className="mx-auto max-w-7xl p-4 sm:p-5 md:p-8 space-y-4 sm:space-y-6 pt-16 sm:pt-20">
        <TopBar
          appTitle="Pluto"
          breadcrumb="Dashboard"
          userName={session.user?.name || session.user?.email || "User"}
        />

        {/* KPI cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-4 sm:p-6 shadow-sm">
            <div className="text-xs sm:text-sm text-slate-500 font-medium">Total Courses</div>
            <div className="text-2xl sm:text-3xl font-bold mt-2 text-slate-900">{totalCourses}</div>
            <div className="text-xs sm:text-sm text-slate-500 mt-2">
              {Math.max(totalCourses - completedCourses, 0)} in progress
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-4 sm:p-6 shadow-sm">
            <div className="text-xs sm:text-sm text-slate-500 font-medium">Completed</div>
            <div className="text-2xl sm:text-3xl font-bold mt-2 text-green-600">{completedCourses}</div>
            <div className="text-xs sm:text-sm text-slate-500 mt-2">
              {totalCourses ? Math.round((completedCourses / totalCourses) * 100) : 0}% completion rate
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-4 sm:p-6 shadow-sm sm:col-span-2 md:col-span-1">
            <div className="text-xs sm:text-sm text-slate-500 font-medium">Total Watch Time</div>
            <div className="text-2xl sm:text-3xl font-bold mt-2 text-blue-600">
              {Math.floor(totalWatchTimeS / 3600)}h {Math.round((totalWatchTimeS % 3600) / 60)}m
            </div>
            <div className="text-xs sm:text-sm text-slate-500 mt-2">Across all courses</div>
          </div>
        </section>

        {/* Search + grid of cards (client) */}
        <CourseGrid initialCourses={cards} />
      </main>
    </div>
  );
}
    