import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - 모든 마스터 코드 조회
export async function GET() {
  try {
    const masterCodes = await prisma.masterCode.findMany({
      include: {
        _count: {
          select: { codes: true },
        },
      },
      orderBy: {
        code: 'asc',
      },
    });
    return NextResponse.json(masterCodes);
  } catch (error) {
    console.error('Error fetching master codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master codes' },
      { status: 500 }
    );
  }
}

// POST - 마스터 코드 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, codeName, description, isActive } = body;

    if (!code || !codeName) {
      return NextResponse.json(
        { error: 'Code and codeName are required' },
        { status: 400 }
      );
    }

    const masterCode = await prisma.masterCode.create({
      data: {
        code,
        codeName,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(masterCode, { status: 201 });
  } catch (error: any) {
    console.error('Error creating master code:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: '이미 존재하는 마스터 코드입니다.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create master code' },
      { status: 500 }
    );
  }
}