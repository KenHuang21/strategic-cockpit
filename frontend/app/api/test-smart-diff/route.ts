import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const testCase = body.testCase || 'all';

    // Path to backend directory
    const backendPath = path.join(process.cwd(), '..', 'backend');

    // Execute the test script
    const { stdout, stderr } = await execAsync(
      `cd "${backendPath}" && python3 test_smart_diff.py`,
      { timeout: 30000 }
    );

    return NextResponse.json({
      success: true,
      stdout: stdout,
      stderr: stderr,
      message: 'Smart Diff tests completed'
    });

  } catch (error: any) {
    console.error('Error running Smart Diff tests:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      stdout: error.stdout || '',
      stderr: error.stderr || ''
    }, { status: 500 });
  }
}

// Alternative: Run fetch_metrics.py to test in production
export async function GET(request: NextRequest) {
  try {
    const backendPath = path.join(process.cwd(), '..', 'backend');

    // Execute fetch_metrics.py
    const { stdout, stderr } = await execAsync(
      `cd "${backendPath}" && source venv/bin/activate && python3 fetch_metrics.py`,
      { timeout: 60000 }
    );

    return NextResponse.json({
      success: true,
      stdout: stdout,
      stderr: stderr,
      message: 'Data fetch with Smart Diff completed'
    });

  } catch (error: any) {
    console.error('Error running fetch_metrics:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      stdout: error.stdout || '',
      stderr: error.stderr || ''
    }, { status: 500 });
  }
}
