import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Normalize
    const normalizedEmail = email.toLowerCase().trim();

    await db.execute({
      sql: "INSERT OR IGNORE INTO subscribers (email) VALUES (?)",
      args: [normalizedEmail],
    });

    return Response.json({ ok: true, message: "Subscribed successfully" });
  } catch (err) {
    console.error("Subscribe error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
