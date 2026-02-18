import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const fundCenters = await prisma.fundCenter.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json(fundCenters);
  } catch (error) {
    console.error('Failed to fetch fund centers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fund centers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name } = body;

    const fundCenter = await prisma.fundCenter.create({
      data: { code, name },
    });

    return NextResponse.json(fundCenter);
  } catch (error) {
    console.error('Failed to create fund center:', error);
    return NextResponse.json(
      { error: 'Failed to create fund center' },
      { status: 500 }
    );
  }
}