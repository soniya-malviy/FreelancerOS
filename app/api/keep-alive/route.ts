import { NextResponse } from "next/server";

// This endpoint is meant to be pinged by an external cron job (e.g., cron-job.org)
// to keep the server instance from spinning down due to inactivity.

export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    message: "Keep-alive successful",
    timestamp: new Date().toISOString() 
  }, { status: 200 });
}
