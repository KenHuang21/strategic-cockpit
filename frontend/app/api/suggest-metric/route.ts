import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { metricName, description } = await request.json();

    // Validation
    if (!metricName || !description) {
      return NextResponse.json(
        { error: "Metric name and description are required" },
        { status: 400 }
      );
    }

    // Check if we have GitHub token
    const githubToken = process.env.GITHUB_TOKEN;
    const repoOwner = process.env.GITHUB_REPO_OWNER || "your-username";
    const repoName = process.env.GITHUB_REPO_NAME || "strategic-cockpit";

    if (!githubToken) {
      console.warn("GITHUB_TOKEN not set, skipping GitHub issue creation");
      return NextResponse.json({
        success: true,
        message: "Suggestion received (GitHub integration not configured)",
        issueUrl: null,
      });
    }

    // Create GitHub issue
    const issueTitle = `[Metric Suggestion] ${metricName}`;
    const issueBody = `## Metric Suggestion

**Metric Name:** ${metricName}

**Description:**
${description}

---
*This suggestion was submitted via the Strategic Cockpit Dashboard.*`;

    const githubResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          title: issueTitle,
          body: issueBody,
          labels: ["enhancement", "metric-suggestion"],
        }),
      }
    );

    if (!githubResponse.ok) {
      const errorData = await githubResponse.json();
      console.error("GitHub API error:", errorData);
      return NextResponse.json(
        { error: "Failed to create GitHub issue" },
        { status: 500 }
      );
    }

    const issueData = await githubResponse.json();

    return NextResponse.json({
      success: true,
      message: "Suggestion submitted successfully!",
      issueUrl: issueData.html_url,
      issueNumber: issueData.number,
    });
  } catch (error) {
    console.error("Error in suggest-metric API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
