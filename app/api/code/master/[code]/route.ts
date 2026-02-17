import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT - 마스터 코드 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { codeName, description, isActive } = body;

    const masterCode = await prisma.masterCode.update({
      where: { code },
      data: {
        codeName,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(masterCode);
  } catch (error: any) {
    console.error('Error updating master code:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: '마스터 코드를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update master code' },
      { status: 500 }
    );
  }
}

// DELETE - 마스터 코드 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // 먼저 하위 코드가 있는지 확인
    const childCodes = await prisma.code.count({
      where: { masterCode: code },
    });

    if (childCodes > 0) {
      return NextResponse.json(
        { error: '하위 코드가 존재하여 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    await prisma.masterCode.delete({
      where: { code },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting master code:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: '마스터 코드를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete master code' },
      { status: 500 }
    );
  }
}