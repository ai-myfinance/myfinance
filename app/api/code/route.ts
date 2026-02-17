import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const masterCode = searchParams.get('masterCode');

    if (!masterCode) {
      return NextResponse.json(
        { error: 'masterCode parameter is required' },
        { status: 400 }
      );
    }

    const codes = await prisma.code.findMany({
      where: { masterCode },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(codes);
  } catch (error) {
    console.error('Error fetching codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch codes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('===== Received body:', JSON.stringify(body, null, 2));
    
    const { code, masterCode, codeName, description, sortOrder } = body;

    console.log('===== Extracted values:', { code, masterCode, codeName, description, sortOrder });
    console.log('===== Types:', { 
      codeType: typeof code, 
      masterCodeType: typeof masterCode 
    });

    if (!code || !masterCode || !codeName) {
      return NextResponse.json(
        { error: 'code, masterCode, and codeName are required' },
        { status: 400 }
      );
    }

    console.log('===== About to create with data:', {
      code,
      masterCode,
      codeName,
      description: description || null,
      sortOrder: sortOrder || 0,
    });

    const newCode = await prisma.code.create({
      data: {
        code,
        masterCode,
        codeName,
        description: description || null,
        sortOrder: sortOrder || 0,
      },
    });

    console.log('===== Successfully created:', newCode);

    return NextResponse.json(newCode, { status: 201 });
  }  catch (error: any) {
    console.error('===== Error creating code:', error);
    console.error('===== Error details:', JSON.stringify(error, null, 2));
    console.error('Error creating code:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: '이미 존재하는 코드입니다.' },
        { status: 409 }
      );
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: '존재하지 않는 마스터 코드입니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create code' },
      { status: 500 }
    );
  }
}