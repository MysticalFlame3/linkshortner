// app/api/links/[code]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ code: string }>;
};

// GET /api/links/:code -> Stats for one code
export async function GET(req: Request, context: RouteContext) {
  try {
    const { code } = await context.params;

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 },
      );
    }

    const link = await prisma.link.findUnique({
      where: { code },
    });

    if (!link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        code: link.code,
        targetUrl: link.targetUrl,
        totalClicks: link.totalClicks,
        lastClickedAt: link.lastClickedAt,
        createdAt: link.createdAt,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('GET /api/links/[code] error', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// DELETE /api/links/:code
export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { code } = await context.params;

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 },
      );
    }

    const link = await prisma.link.findUnique({
      where: { code },
    });

    if (!link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 },
      );
    }

    await prisma.link.delete({
      where: { code },
    });

    return NextResponse.json(
      { message: 'Link deleted successfully' },
      { status: 200 },
    );
  } catch (err) {
    console.error('DELETE /api/links/[code] error', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
