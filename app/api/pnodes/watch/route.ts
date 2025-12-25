import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { ip } = await req.json();
    if (!ip) {
      return NextResponse.json({ error: 'IP is required' }, { status: 400 });
    }
    const watch = await prisma.watch.create({
      data: { ip },
    });
    return NextResponse.json({ success: true, watch });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
  }
}

// GET all watchlist IPs
export async function GET() {
  try {
    const watchlist = await prisma.watch.findMany({ select: { ip: true } });
    console.log("what is the watchlist: ", watchlist);
    return NextResponse.json({ watchlist });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
  }
}
