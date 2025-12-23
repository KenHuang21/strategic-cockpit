import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Paths relative to the project root
    const projectRoot = path.resolve(process.cwd(), "..");
    const scriptPath = path.join(projectRoot, "backend", "fetch_metrics.py");
    const venvPython = path.join(projectRoot, "backend", "venv", "bin", "python");

    console.log("Project root:", projectRoot);
    console.log("Script path:", scriptPath);
    console.log("Python path:", venvPython);

    // Execute the Python script and save output to log file
    const logPath = path.join(projectRoot, "logs", "fetch_metrics.log");
    const { stdout, stderr } = await execAsync(`"${venvPython}" "${scriptPath}" 2>&1 | tee "${logPath}"`);

    if (stderr && !stderr.includes("Warning")) {
      console.error("Python script stderr:", stderr);
    }

    return NextResponse.json({
      success: true,
      message: "Data fetch completed",
      output: stdout,
      errors: stderr || null,
    });
  } catch (error) {
    console.error("Error executing fetch script:", error);
    return NextResponse.json(
      {
        error: "Failed to execute data fetch",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to trigger data fetch",
    endpoint: "/api/test-fetch",
  });
}
