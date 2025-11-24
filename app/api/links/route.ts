// app/api/links/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CODE_REGEX = /^[A-Za-z0-9]{6,8}$/;

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

async function generateUniqueCode(): Promise<string> {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  function randomCode(length = 6): string {
    let out = '';
    for (let i = 0; i < length; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }

  while (true) {
    const code = randomCode(6);
    const existing = await prisma.link.findUnique({ where: { code } });
    if (!existing) return code;
  }
}

// POST /api/links - Create link
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const targetUrl = body?.targetUrl as string | undefined;
    let code = body?.code as string | undefined;

    if (!targetUrl || !isValidUrl(targetUrl)) {
      return NextResponse.json(
        { error: 'Invalid or missing targetUrl. Must be a valid http/https URL.' },
        { status: 400 },
      );
    }

    if (code) {
      if (!CODE_REGEX.test(code)) {
        return NextResponse.json(
          { error: 'Code must match [A-Za-z0-9]{6,8}.' },
          { status: 400 },
        );
      }

      const existing = await prisma.link.findUnique({ where: { code } });
      if (existing) {
        return NextResponse.json({ error: 'Code already exists.' }, { status: 409 });
      }
    } else {
      code = await generateUniqueCode();
    }

    const link = await prisma.link.create({
      data: { code, targetUrl },
    });

    return NextResponse.json(
      {
        code: link.code,
        targetUrl: link.targetUrl,
        totalClicks: link.totalClicks,
        lastClickedAt: link.lastClickedAt,
        createdAt: link.createdAt,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('POST /api/links error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/links - List all links
export async function GET() {
  try {
    const links = await prisma.link.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      links.map((link) => ({
        code: link.code,
        targetUrl: link.targetUrl,
        totalClicks: link.totalClicks,
        lastClickedAt: link.lastClickedAt,
        createdAt: link.createdAt,
      })),
      { status: 200 },
    );
  } catch (err) {
    console.error('GET /api/links error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
