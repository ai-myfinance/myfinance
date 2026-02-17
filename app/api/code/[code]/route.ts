import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { codeName, description, sortOrder, isActive } = body;

    const updatedCode = await prisma.code.update({
      where: { code },
      data: {
        codeName,
        description: description || null,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(updatedCode);
  } catch (error: any) {
    console.error('Error updating code:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: '코드를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update code' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    await prisma.code.delete({
      where: { code },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting code:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: '코드를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete code' },
      { status: 500 }
    );
  }
}