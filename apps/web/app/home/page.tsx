"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useRequireAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { Loader2, LogOut, BookOpen } from "lucide-react";
import { isValidYouTubePlaylistUrl } from "@/lib/youtube";

function HomeAfterLoginContent() {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const playlistPlaceholders = [
    "Paste a YouTube playlist URL to get started"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onCreate();
  };

  const onCreate = useCallback(async () => {
    if (!url.trim()) return;
    setBusy(true);
    setErr(null);
    
    // Client-side validation: Check if URL is a valid YouTube playlist
    const validation = isValidYouTubePlaylistUrl(url.trim());
    if (!validation.valid) {
      setErr(validation.error || "Invalid YouTube playlist URL");
      setBusy(false);
      return;
    }
    
    try {
      const res = await fetch("/api/courses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistUrl: url }),
      });
      const json = await res.json();
      if (!res.ok) {
        // Display the error message from the API (which includes playlist validation errors)
        throw new Error(json?.error || "Failed to create course");
      }
      
      // Clear URL from browser history
      window.history.replaceState({}, '', '/home');
      router.push(`/courses/${json.courseId}`);
    } catch (e: unknown) {
      // Show user-friendly error message
      const errorMessage = e instanceof Error ? e.message : "Failed to create course. Please try again.";
      setErr(errorMessage);
    } finally {
      setBusy(false);
    }
  }, [url, router]);

  // Handle URL from query params after signin
  useEffect(() => {
    if (!isLoading && user) {
      const playlistUrl = searchParams.get('playlistUrl');
      if (playlistUrl) {
        const decodedUrl = decodeURIComponent(playlistUrl);
        setUrl(decodedUrl);
        // Auto-create course from the preserved URL
        setTimeout(() => {
          onCreate();
        }, 100);
      }
    }
  }, [isLoading, user, searchParams, onCreate]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Welcome back, {user?.name || user?.email}!
              </h1>
              <p className="text-slate-600 mt-1">
                Ready to create your next learning course?
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Course Creation */}
         
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-slate-900">Create New Course</CardTitle>
                <CardDescription className="text-slate-600">
                  Transform any YouTube playlist into a structured learning experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <PlaceholdersAndVanishInput
                  placeholders={playlistPlaceholders}
                  onChange={handleInputChange}
                  onSubmit={handleSubmit}
                />
                
                <div className="flex justify-center">
                  <Button
                    onClick={onCreate}
                    disabled={busy || !url.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Course...
                      </>
                    ) : (
                      "Create Course"
                    )}
                  </Button>
                </div>

                {err && (
                  <div className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-md">
                    {err}
                  </div>
                )}
              </CardContent>
            </Card>
         
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function HomeAfterLogin() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-16 flex items-center justify-center">
          <Card className="max-w-md w-full bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    }>
      <HomeAfterLoginContent />
    </Suspense>
  );
}
