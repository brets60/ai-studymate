import { NextResponse } from "next/server";
import { ensureDatabaseTables } from "@/lib/ensure-tables";

export async function GET() {
  try {
    await ensureDatabaseTables();
    return NextResponse.json({ success: true, message: "All 15 tables verified and ready in PostgreSQL!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
