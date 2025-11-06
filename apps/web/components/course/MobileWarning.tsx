"use client";

import { useState, useEffect } from "react";
import { Laptop, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MobileWarning() {
  const [isMobile, setIsMobile] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check if screen width is less than 768px (md breakpoint)
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    checkMobile();

    // Check on resize
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isMobile || isDismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Laptop className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Hey there! 👋</h3>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-2 text-slate-600">
          <p className="text-sm leading-relaxed">
            I didn&apos;t build this experience for mobile yet! 🚧
          </p>
          <p className="text-sm leading-relaxed">
            just grab a laptop and come back! too lazy to build this for mobile tbh.
          </p>
          <p className="text-sm leading-relaxed text-slate-500 italic">
            If you really need it on phone, let us know and we will build it asap at{" "}
            <a href="mailto:mm12515@nyu.edu" className="text-green-600 hover:text-green-700 underline">
              mm12515@nyu.edu
            </a>
          </p>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => setIsDismissed(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Got it, thanks!
          </Button>
        </div>
      </div>
    </div>
  );
}

