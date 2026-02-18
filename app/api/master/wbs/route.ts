import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const wbsList = await prisma.wbs.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json(wbsList);
  } catch (error) {
    console.error('Failed to fetch WBS:', error);
    return NextResponse.json(
      { error: 'Failed to fetch WBS' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name } = body;

    const wbs = await prisma.wbs.create({
      data: { code, name },
    });

    return NextResponse.json(wbs);
  } catch (error) {
    console.error('Failed to create WBS:', error);
    return NextResponse.json(
      { error: 'Failed to create WBS' },
      { status: 500 }
    );
  }
}