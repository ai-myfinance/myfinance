import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const groups = await prisma.group.findMany({
      include: {
        details: {
          include: {
            cardUsage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 공급가, 총금액 계산
    const groupsWithSum = groups.map((group) => ({
      ...group,
      supplyAmtSum: group.details.reduce((sum, d) => {
        const supplyAmt = d.cardUsage?.supplyAmt || 0;
        return sum + Number(supplyAmt);
      }, 0),
      settlementAmtSum: group.details.reduce((sum, d) => {
        const settlementAmt = d.settlementAmt || 0;
        return sum + Number(settlementAmt);
      }, 0),
      detailCount: group.details.length,
    }));

    return NextResponse.json(groupsWithSum);
  } catch (error) {
    console.error('Failed to fetch groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { status, title, detailIds, postingDate } = body;

    // Group 생성
    const group = await prisma.group.create({
      data: {
        type: '1', // 경비정산
        status,
        title,
        empNo: '12345', // TODO: 실제 로그인 사용자 정보
        empName: '홍길동', // TODO: 실제 로그인 사용자 정보
      },
    });

    // Detail들의 groupId 업데이트
    const updateData: any = { groupId: group.id };
    
    // SUBMIT인 경우 postingDate도 업데이트
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
    console.error('Failed to create group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}