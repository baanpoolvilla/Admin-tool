// =============================================================
// app/api/scrape/trigger/route.ts — Manual Scrape Trigger
// POST → trigger GitHub Actions workflow ด้วยตนเอง
// ใช้ GitHub REST API workflow_dispatch
// =============================================================

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createServerSupabaseClient();

  // ตรวจสอบ authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPO;

  if (!githubToken || !githubRepo) {
    return NextResponse.json(
      { error: "GitHub token or repo not configured" },
      { status: 500 }
    );
  }

  // เรียก GitHub Actions API เพื่อ trigger workflow
  const response = await fetch(
    `https://api.github.com/repos/${githubRepo}/actions/workflows/scrape.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "main", // branch ที่จะรัน
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: `GitHub API error: ${errorText}` },
      { status: response.status }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Scraper workflow triggered successfully",
  });
}
