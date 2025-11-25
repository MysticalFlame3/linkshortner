import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ code: string }>;
};

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

    await prisma.link.update({
      where: { code },
      data: {
        totalClicks: { increment: 1 },
        lastClickedAt: new Date(),
      },
    });

    return NextResponse.redirect(link.targetUrl, { status: 302 });
  } catch (err) {
    console.error('GET /[code] redirect error', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
