import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Read dashboard_data.json from the data directory
    const dataPath = path.join(process.cwd(), "..", "data", "dashboard_data.json");
    const fileContents = fs.readFileSync(dataPath, "utf8");
    const data = JSON.parse(fileContents);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error reading dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
