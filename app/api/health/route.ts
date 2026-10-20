import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export async function GET() {
  try {
    const result = await db.get<{ result: number }>(
      sql`SELECT 1 AS result`
    );
    return NextResponse.json({
      status: "ok",
      db: result?.result === 1 ? "connected" : "unexpected",
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
