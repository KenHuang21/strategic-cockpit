import { NextResponse } from "next/server";

export async function POST() {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPOSITORY || "owner/repo"; // Format: "owner/repo"

    if (!githubToken) {
      return NextResponse.json(
        { error: "GitHub token not configured" },
        { status: 500 }
      );
    }

    // Trigger GitHub Actions workflow using repository_dispatch
    const response = await fetch(
      `https://api.github.com/repos/${repo}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({
          event_type: "manual_refresh",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return NextResponse.json({
      success: true,
      message: "Refresh workflow triggered successfully",
    });
  } catch (error) {
    console.error("Error triggering refresh:", error);
    return NextResponse.json(
      { error: "Failed to trigger refresh" },
      { status: 500 }
    );
  }
}
