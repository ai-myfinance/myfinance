import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        details: {
          include: {
            cardUsage: true,
          },
        },
      },
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error('Failed to fetch group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, title, detailIds, postingDate } = body;

    // Group 업데이트
    const group = await prisma.group.update({
      where: { id },
      data: {
        status,
        title,
      },
    });

    // 기존 Detail들의 groupId NULL로 변경
    await prisma.detail.updateMany({
      where: { groupId: id },
      data: { groupId: null },
    });

    // 새로 선택된 Detail들의 groupId 업데이트
    const updateData: any = { groupId: id };
    
    if (status === 'SUBMIT' && postingDate) {
      updateData.postingDate = new Date(postingDate);
    }

    await prisma.detail.updateMany({
      where: {
        id: { in: detailIds },
      },
      data: updateData,
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error('Failed to update group:', error);
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    );
  }
}