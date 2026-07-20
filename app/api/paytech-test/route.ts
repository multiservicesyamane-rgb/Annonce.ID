import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { error: "Route diagnostic desactivee." },
    { status: 410 }
  );
}