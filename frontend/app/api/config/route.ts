import { NextResponse } from "next/server";

const GITHUB_API = "https://api.github.com";

export async function GET() {
  try {
    const repo = process.env.GITHUB_REPOSITORY || "KenHuang21/strategic-cockpit";
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "GitHub token not configured" },
        { status: 500 }
      );
    }

    // Fetch user_config.json from GitHub
    const response = await fetch(
      `${GITHUB_API}/repos/${repo}/contents/data/user_config.json`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    const config = JSON.parse(content);

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error reading config:", error);
    return NextResponse.json(
      { error: "Failed to read configuration" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const config = await request.json();
    const repo = process.env.GITHUB_REPOSITORY || "KenHuang21/strategic-cockpit";
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "GitHub token not configured" },
        { status: 500 }
      );
    }

    // Validate config structure
    if (!config.thresholds || !config.subscribers) {
      return NextResponse.json(
        { error: "Invalid configuration format" },
        { status: 400 }
      );
    }

    // Get current file SHA (required for update)
    const getResponse = await fetch(
      `${GITHUB_API}/repos/${repo}/contents/data/user_config.json`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!getResponse.ok) {
      throw new Error(`Failed to get current file: ${getResponse.status}`);
    }

    const currentFile = await getResponse.json();
    const sha = currentFile.sha;

    // Update file on GitHub
    const content = Buffer.from(JSON.stringify(config, null, 2)).toString("base64");

    const updateResponse = await fetch(
      `${GITHUB_API}/repos/${repo}/contents/data/user_config.json`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          message: "Update user configuration via Settings Modal",
          content,
          sha,
          branch: "main",
        }),
      }
    );

    if (!updateResponse.ok) {
      throw new Error(`Failed to update file: ${updateResponse.status}`);
    }

    return NextResponse.json({
      success: true,
      message: "Configuration updated successfully"
    });
  } catch (error) {
    console.error("Error updating config:", error);
    return NextResponse.json(
      { error: "Failed to update configuration" },
      { status: 500 }
    );
  }
}
