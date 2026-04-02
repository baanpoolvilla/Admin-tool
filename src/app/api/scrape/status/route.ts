// =============================================================
// app/api/scrape/status/route.ts — Scrape Workflow Status
// GET → ดึงสถานะ workflow run ล่าสุดจาก GitHub Actions
// =============================================================

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPO;

  if (!githubToken || !githubRepo) {
    return NextResponse.json(
      { error: "GitHub not configured" },
      { status: 500 }
    );
  }

  const response = await fetch(
    `https://api.github.com/repos/${githubRepo}/actions/workflows/scrape.yml/runs?per_page=3`,
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return NextResponse.json({ error: "GitHub API error" }, { status: 502 });
  }

  const data = await response.json();
  const runs = (data.workflow_runs || []).map(
    (r: {
      id: number;
      status: string;
      conclusion: string | null;
      created_at: string;
      updated_at: string;
      html_url: string;
    }) => ({
      id: r.id,
      status: r.status,
      conclusion: r.conclusion,
      created_at: r.created_at,
      updated_at: r.updated_at,
      url: r.html_url,
    })
  );

  return NextResponse.json({ runs });
}
