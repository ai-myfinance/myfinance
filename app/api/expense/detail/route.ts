import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    let where = {};
    
    if (groupId === 'null' || groupId === null) {
      // 신규 작성: groupId가 NULL인 것만
      where = { groupId: null };
    } else if (groupId) {
      // 상세/수정: 특정 groupId
      where = { groupId };
    }

    const details = await prisma.detail.findMany({
      where,
      include: {
        cardUsage: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(details);
  } catch (error) {
    console.error('Failed to fetch details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch details' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const detail = await prisma.detail.create({
      data: {
        type: '3', // 현금/영수증
        receiptDate: new Date(body.receiptDate),
        settlementAmt: body.settlementAmt,
        accountCode: body.accountCode,
        costCenterCode: body.costCenterCode,
        fundCenterCode: body.fundCenterCode,
        wbsCode: body.wbsCode,
        remark: body.remark,
        deductibleYn: body.deductibleYn || false,
      },
    });

    return NextResponse.json(detail);
  } catch (error) {
    console.error('Failed to create detail:', error);
    return NextResponse.json(
      { error: 'Failed to create detail' },
      { status: 500 }
    );
  }
}