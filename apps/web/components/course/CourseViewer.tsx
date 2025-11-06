// apps/web/components/course/CourseViewer.tsx
"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import CourseSettingsModal from "./CourseSettingsModal";
import DailyCheckInModal from "./DailyCheckInModal";

type Video = {
  id: string;
  youtubeId: string;
  title: string;
  durationS: number | null;
  thumbnailUrl: string | null;
  orderIndex: number;
};

type Section = {
  id: string;
  title: string;
  orderIndex: number;
  videos: Video[];
};

export default function CourseViewer({
  course,
  progress,
}: {
  course: { id: string; title: string; totalVideos: number; sections: Section[] };
  progress: Record<string, boolean>;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<{ s: number; v: number }>({ s: 0, v: 0 });
  const [done, setDone] = useState<Record<string, boolean>>(progress ?? {});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  const flatVideos = useMemo(() => course.sections.flatMap(s => s.videos), [course.sections]);
  const currentVideo = course.sections[current.s]?.videos[current.v] ?? null;

  const totals = useMemo(() => {
    const total = course.sections.reduce((sum, s) => sum + s.videos.length, 0);
    const completed = Object.values(done).filter(Boolean).length;
    return { total, completed, percent: total ? Math.round((completed / total) * 100) : 0 };
  }, [course.sections, done]);

  // Ref to track last checked date (persists across renders)
  const lastCheckedDateRef = useRef<string | null>(null);

  // Check if user has checked in today and auto-open modal if not
  useEffect(() => {
    let midnightTimeoutId: NodeJS.Timeout | null = null;
    let dateCheckIntervalId: NodeJS.Timeout | null = null;

    const getTodayDateString = () => {
      return new Date().toISOString().split('T')[0];
    };

    const checkDailyCheckIn = async (forceCheck = false) => {
      const today = getTodayDateString();
      
      // Optimize: Only make API call if date changed or forced
      // This prevents unnecessary API calls when date hasn't changed
      if (!forceCheck && lastCheckedDateRef.current === today && hasCheckedInToday) {
        return; // Already checked today and date hasn't changed
      }

      try {
        const response = await fetch(`/api/courses/${course.id}/check-in`);
        if (response.ok) {
          const data = await response.json();
          const checkedIn = data.hasCheckedInToday || false;
          setHasCheckedInToday(checkedIn);
          lastCheckedDateRef.current = today;
          
          // Automatically open modal if user hasn't checked in today
          if (!checkedIn) {
            setCheckInOpen(true);
          }
        } else {
          // If check fails, assume not checked in
          setHasCheckedInToday(false);
        }
      } catch (error) {
        console.error("Error checking daily check-in:", error);
        setHasCheckedInToday(false);
      }
    };

    // Check immediately on mount
    checkDailyCheckIn(true);

    // Check date change every 1 minute (lightweight client-side check)
    // Only makes API call if date actually changed
    dateCheckIntervalId = setInterval(() => {
      const today = getTodayDateString();
      if (lastCheckedDateRef.current && lastCheckedDateRef.current !== today) {
        // Date changed - need to check again
        checkDailyCheckIn(true);
      }
    }, 60 * 1000); // Check every minute (lightweight, no API call)

    // Calculate time until midnight to check immediately when new day starts
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    // Set timeout to check at midnight (optimization to check right when day changes)
    midnightTimeoutId = setTimeout(() => {
      checkDailyCheckIn(true);
    }, msUntilMidnight);

    // Cleanup on unmount
    return () => {
      if (dateCheckIntervalId) clearInterval(dateCheckIntervalId);
      if (midnightTimeoutId) clearTimeout(midnightTimeoutId);
    };
  }, [course.id, hasCheckedInToday]);

  const handleCheckIn = async (mood: string, notes: string) => {
    try {
      const response = await fetch(`/api/courses/${course.id}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, notes }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Check-in was successful (new or already existed)
        setHasCheckedInToday(true);
        // Update ref to prevent unnecessary API calls
        lastCheckedDateRef.current = new Date().toISOString().split('T')[0];
        
        // Show appropriate message
        if (data.alreadyCheckedIn) {
          // User already checked in - this is fine, just update state
          console.log(data.message);
        }
      } else {
        // API returned an error
        throw new Error(data.error || data.message || "Failed to check in");
      }
    } catch (error) {
      console.error("Error checking in:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to check in. Please try again.";
      alert(errorMessage);
      throw error; // Re-throw so modal can handle it
    }
  };

  function ytId(yid: string) {
    return yid.includes("_") ? yid.split("_")[0] : yid;
  }

  async function toggleComplete() {
    if (!currentVideo) return;
    const newVal = !done[currentVideo.id];
    setDone(p => ({ ...p, [currentVideo.id]: newVal }));
    await fetch("/api/progress/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: currentVideo.id, completed: newVal }),
    }).catch(() => {});
  }

  function goNext() {
    const s = current.s, v = current.v;
    const sec = course.sections[s];
    if (v + 1 < sec.videos.length) setCurrent({ s, v: v + 1 });
    else if (s + 1 < course.sections.length) setCurrent({ s: s + 1, v: 0 });
  }
  function goPrev() {
    const s = current.s, v = current.v;
    if (v > 0) setCurrent({ s, v: v - 1 });
    else if (s > 0) {
      const prevSec = course.sections[s - 1];
      setCurrent({ s: s - 1, v: prevSec.videos.length - 1 });
    }
  }

  return (
    <div className="min-h-screen">
      {/* Simple Top Bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="text-slate-700 hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-slate-300" />
              <h1 className="text-lg font-semibold text-slate-900">{course.title}</h1>
              {hasCheckedInToday && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <span>🪐</span>
                  <span>Checked in today</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setSettingsOpen(true)}
                className="text-slate-700 hover:bg-slate-100"
                size="sm"
                id="#onboarding"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl p-4 sm:p-6 grid grid-cols-12 gap-4">
      {/* SIDEBAR */}
      <aside className="col-span-12 md:col-span-4">
        <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold">{course.title}</h2>
            <div className="text-xs text-gray-600">
              {totals.completed} of {totals.total} completed
            </div>
            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${totals.percent}%` }} />
            </div>
          </div>

          <div className="max-h-[70vh] overflow-auto p-2">
            {course.sections.map((sec, si) => {
              const secCompleted = sec.videos.filter(v => done[v.id]).length;
              return (
                <div key={sec.id} className="mb-3">
                  <div className="px-2 py-1 text-sm font-semibold">
                    Section {si + 1}: {sec.title}
                    <span className="ml-2 text-xs text-gray-500">
                      {secCompleted} / {sec.videos.length}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {sec.videos.map((v, vi) => {
                      const active = current.s === si && current.v === vi;
                      return (
                        <li key={v.id}>
                          <button
                            className={`w-full flex items-center gap-3 rounded-lg px-2 py-2 text-left ${
                              active ? "bg-gray-100" : "hover:bg-gray-50"
                            }`}
                            onClick={() => setCurrent({ s: si, v: vi })}
                          >
                            {/* INTRINSIC-SIZE THUMBNAIL (no fill) */}
                            {v.thumbnailUrl ? (
                              <Image
                                src={v.thumbnailUrl}
                                alt={v.title}
                                width={96}
                                height={64} // 3:2-ish thumbnail
                                className="rounded bg-gray-100 object-cover"
                              />
                            ) : (
                              <div className="w-[96px] h-[64px] rounded bg-gray-100" />
                            )}
                            <div className="flex-1">
                              <div className="line-clamp-1 text-sm">{v.title}</div>
                              <div className="text-xs text-gray-500">
                                {Math.round((v.durationS || 0) / 60)} min
                              </div>
                            </div>
                            <div
                              className={`w-4 h-4 rounded-full border ${
                                done[v.id] ? "bg-green-500 border-green-500" : "border-gray-300"
                              }`}
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* PLAYER + CONTROLS */}
      <section className="col-span-12 md:col-span-8 space-y-3">
        {/* Fixed aspect ratio; never full-screen */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-black shadow-sm">
          <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
            {currentVideo ? (
              <iframe
                title={currentVideo.title}
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${ytId(currentVideo.youtubeId)}?rel=0&modestbranding=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-white">Select a video</div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button className="px-3 py-2 rounded-lg border" onClick={goPrev}>
            ← Previous
          </button>
          <div className="text-sm text-gray-600">
            {flatVideos.findIndex(v => v.id === currentVideo?.id) + 1} of {flatVideos.length}
          </div>
          <button className="px-3 py-2 rounded-lg border" onClick={goNext}>
            Next →
          </button>
        </div>

        {currentVideo && (
          <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="font-semibold">{currentVideo.title}</div>
              <div className="text-sm text-gray-500">
                Video {current.v + 1} • Section {current.s + 1} •{" "}
                {Math.round((currentVideo.durationS || 0) / 60)} min
              </div>
            </div>
            <div className="flex items-center gap-2">
             
              <button
                className={`px-3 py-2 rounded-lg ${
                  done[currentVideo.id] ? "bg-green-600 text-white" : "border"
                }`}
                onClick={toggleComplete}
              >
                {done[currentVideo.id] ? "Completed ✓" : "Mark as Complete"}
              </button>
            </div>
          </div>
        )}
      </section>
      </main>

      {/* Settings Modal */}
      <CourseSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        courseId={course.id}
        courseTitle={course.title}
      />

      {/* Daily Check-in Modal */}
      <DailyCheckInModal
        isOpen={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        courseTitle={course.title}
        onCheckIn={handleCheckIn}
      />
    </div>
  );
}
