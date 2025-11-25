// app/healthz/route.ts
import { NextResponse } from 'next/server';

const startTime = Date.now();

export async function GET() {
  const uptimeMs = Date.now() - startTime;

  return NextResponse.json(
    {
      ok: true,
      version: process.env.APP_VERSION ?? '1.0.0',
      uptimeMs,
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
