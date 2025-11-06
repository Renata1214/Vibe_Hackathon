import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: courseId } = await params;
    const body = await request.json();
    const { mood, notes } = body;

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify course ownership
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId: user.id },
      select: { id: true }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Use date format: YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    // Check if user already checked in today
    const existingCheckIn = await prisma.dailyCheckIn.findUnique({
      where: {
        userId_courseId_checkInDate: {
          userId: user.id,
          courseId: courseId,
          checkInDate: today
        }
      }
    });

    if (existingCheckIn) {
      return NextResponse.json({ 
        success: true,
        message: "Already checked in today!",
        checkIn: existingCheckIn,
        alreadyCheckedIn: true
      });
    }

    // Create new check-in
    const checkIn = await prisma.dailyCheckIn.create({
      data: {
        userId: user.id,
        courseId: courseId,
        checkInDate: today,
        mood: mood || null,
        notes: notes || null
      }
    });

    return NextResponse.json({ 
      success: true,
      message: "Check-in recorded!",
      checkIn
    });
  } catch (error) {
    console.error("Error creating check-in:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: courseId } = await params;

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use date format: YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    // Check if user has checked in today
    const checkIn = await prisma.dailyCheckIn.findUnique({
      where: {
        userId_courseId_checkInDate: {
          userId: user.id,
          courseId: courseId,
          checkInDate: today
        }
      }
    });

    return NextResponse.json({ 
      hasCheckedInToday: !!checkIn,
      checkIn: checkIn || null
    });
  } catch (error) {
    console.error("Error checking daily check-in:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
