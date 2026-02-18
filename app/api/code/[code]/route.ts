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
    const { masterCode, codeName, description, sortOrder, isActive } = body;

    const updatedCode = await prisma.code.update({
      where: { 
        masterCode_code: {
          masterCode,
          code,
        }
      },
      data: {
        codeName,
        description: description || null,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(updatedCode);
  } catch (error) {
    console.error('Failed to update code:', error);
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
    const { searchParams } = new URL(request.url);
    const masterCode = searchParams.get('masterCode');

    if (!masterCode) {
      return NextResponse.json(
        { error: 'masterCode is required' },
        { status: 400 }
      );
    }

    await prisma.code.delete({
      where: {
        masterCode_code: {
          masterCode,
          code,
        }
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete code:', error);
    return NextResponse.json(
      { error: 'Failed to delete code' },
      { status: 500 }
    );
  }
}