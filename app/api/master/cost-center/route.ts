import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const costCenters = await prisma.costCenter.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json(costCenters);
  } catch (error) {
    console.error('Failed to fetch cost centers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost centers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name } = body;

    const costCenter = await prisma.costCenter.create({
      data: { code, name },
    });

    return NextResponse.json(costCenter);
  } catch (error) {
    console.error('Failed to create cost center:', error);
    return NextResponse.json(
      { error: 'Failed to create cost center' },
      { status: 500 }
    );
  }
}