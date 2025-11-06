// apps/web/app/courses/[id]/page.tsx
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CourseViewer from "@/components/course/CourseViewer";
import MobileWarning from "@/components/course/MobileWarning";

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/signin");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });
  if (!user) redirect("/signin");

  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          videos: { orderBy: { orderIndex: "asc" }, select: { id: true, youtubeId: true, title: true, durationS: true, thumbnailUrl: true, orderIndex: true } }
        }
      }
    }
  });
  if (!course || course.userId !== user.id) return notFound();

  const progress = await prisma.progress.findMany({
    where: { userId: user.id, videoId: { in: course.sections.flatMap(s => s.videos.map(v => v.id)) } },
    select: { videoId: true, completed: true }
  });

  const progressMap = Object.fromEntries(progress.map(p => [p.videoId, p.completed]));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <MobileWarning />
      <CourseViewer
        course={{
          id: course.id,
          title: course.title,
          totalVideos: course.totalVideos,
          sections: course.sections.map(s => ({
            id: s.id,
            title: s.title,
            orderIndex: s.orderIndex,
            videos: s.videos
          }))
        }}
        progress={progressMap}
      />
    </div>
  );
}
