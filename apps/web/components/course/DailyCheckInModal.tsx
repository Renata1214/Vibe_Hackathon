"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Smile, Frown, Meh, Heart, Brain, Coffee, Loader2 } from "lucide-react";

interface DailyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  onCheckIn: (mood: string, notes: string) => Promise<void>;
}

const MOOD_OPTIONS = [
  { 
    key: "amazing", 
    label: "Amazing", 
    icon: Heart
  },
  { 
    key: "great", 
    label: "Great", 
    icon: Smile
  },
  { 
    key: "okay", 
    label: "Okay", 
    icon: Meh
  },
  { 
    key: "struggling", 
    label: "Struggling", 
    icon: Frown
  },
  { 
    key: "tired", 
    label: "Tired", 
    icon: Coffee
  },
  { 
    key: "focused", 
    label: "Focused", 
    icon: Brain
  }
];

export default function DailyCheckInModal({
  isOpen,
  onClose,
  courseTitle,
  onCheckIn,
}: DailyCheckInModalProps) {
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMood("");
      setNotes("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedMood) return;
    
    setIsSubmitting(true);
    try {
      await onCheckIn(selectedMood, notes);
      onClose();
    } catch (error) {
      console.error("Error checking in:", error);
      // Error is already handled in parent component (alert shown)
      // Don't close modal on error so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    // Check in with no mood/notes
    setIsSubmitting(true);
    try {
      await onCheckIn("", "");
      onClose();
    } catch (error) {
      console.error("Error checking in:", error);
      // Error is already handled in parent component (alert shown)
      // Don't close modal on error so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <Image
              src="/smilingPluto.png"
              alt="Pluto"
              width={250}
              height={150}
              className="rounded-full"
              unoptimized
            />
            <DialogTitle className="text-lg text-center">
              How are you feeling about <strong>{courseTitle}</strong> today?
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mood Selection */}
          <div>
            <div className="grid grid-cols-3 gap-3">
              {MOOD_OPTIONS.map((mood) => {
                const Icon = mood.icon;
                return (
                  <button
                    key={mood.key}
                    onClick={() => setSelectedMood(mood.key)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedMood === mood.key
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <Icon className="h-6 w-6 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">{mood.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any thoughts about your study session?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              maxLength={200}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {notes.length}/200
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!selectedMood || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking in...
                </>
              ) : (
                "Check In! 🎯"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              Skip
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            This helps us send you better reminders and track your learning journey!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
