import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const detail = await prisma.detail.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(detail);
  } catch (error) {
    console.error('Failed to update detail:', error);
    return NextResponse.json(
      { error: 'Failed to update detail' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // type='3' (현금/영수증)만 삭제 가능
    const detail = await prisma.detail.findUnique({
      where: { id },
    });

    if (!detail) {
      return NextResponse.json(
        { error: 'Detail not found' },
        { status: 404 }
      );
    }

    if (detail.type !== '3') {
      return NextResponse.json(
        { error: '현금/영수증만 삭제할 수 있습니다.' },
        { status: 400 }
      );
    }

    await prisma.detail.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete detail:', error);
    return NextResponse.json(
      { error: 'Failed to delete detail' },
      { status: 500 }
    );
  }
}