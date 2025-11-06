// apps/web/components/dashboard/TopBar.tsx
"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Home, LogOut } from "lucide-react";

export default function TopBar({
  appTitle,
  breadcrumb,
  userName,
}: {
  appTitle: string;
  breadcrumb?: string;
  userName?: string | null;
}) {
  const router = useRouter();
  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Welcome back, {userName}!
          </h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">
            Manage your learning courses and track your progress
          </p>
        </div>
        {breadcrumb && (
          <span className="text-xs sm:text-sm px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium self-start sm:self-center">
            {breadcrumb}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <Button
          onClick={() => router.push("/home")}
          className="bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base flex-1 sm:flex-initial"
          size="sm"
        >
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Add New Course</span>
          <span className="sm:hidden">Add Course</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="border-slate-300 text-slate-700 hover:bg-slate-50 text-sm sm:text-base"
          title={userName ?? "Sign out"}
          size="sm"
        >
          <LogOut className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Logout</span>
          <span className="sm:hidden">Out</span>
        </Button>
      </div>
    </header>
  );
}
