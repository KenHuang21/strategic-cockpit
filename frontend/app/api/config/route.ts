import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const GITHUB_API = "https://api.github.com";

export async function GET() {
  try {
    const repo = process.env.GITHUB_REPOSITORY || "KenHuang21/strategic-cockpit";
    const token = process.env.GITHUB_TOKEN;

    // If no GitHub token, fall back to local file (for development)
    if (!token) {
      console.log("No GitHub token found, using local file for development");
      const configPath = path.join(process.cwd(), "..", "data", "user_config.json");

      if (fs.existsSync(configPath)) {
        const fileContent = fs.readFileSync(configPath, "utf-8");
        const config = JSON.parse(fileContent);
        return NextResponse.json(config);
      } else {
        return NextResponse.json(
          { error: "Configuration file not found" },
          { status: 404 }
        );
      }
    }

    // Fetch user_config.json from GitHub (production)
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

    // Validate config structure
    if (!config.thresholds || !config.subscribers) {
      return NextResponse.json(
        { error: "Invalid configuration format" },
        { status: 400 }
      );
    }

    // If no GitHub token, save to local file (for development)
    if (!token) {
      console.log("No GitHub token found, saving to local file for development");
      const configPath = path.join(process.cwd(), "..", "data", "user_config.json");

      try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
        return NextResponse.json({
          success: true,
          message: "Configuration updated successfully (local)"
        });
      } catch (error) {
        console.error("Error writing local config:", error);
        return NextResponse.json(
          { error: "Failed to write local configuration" },
          { status: 500 }
        );
      }
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
