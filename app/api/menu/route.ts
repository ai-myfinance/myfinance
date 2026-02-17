import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const menus = await prisma.menu.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            children: true,
          },
        },
      },
    });

    return NextResponse.json(menus);
  } catch (error) {
    console.error('Error fetching menus:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menus' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, path, filePath, icon, sortOrder, type, parentId, isActive } = body;

    console.log('Received data:', { name, path, filePath, icon, sortOrder, type, parentId, isActive });

    if (!name || !type) {
      return NextResponse.json(
        { error: 'name and type are required' },
        { status: 400 }
      );
    }

    const newMenu = await prisma.menu.create({
      data: {
        name,
        path: path || null,
        filePath: filePath || null,  // 여기가 문제일 수 있음
        icon: icon || null,
        sortOrder: sortOrder || 0,
        type,
        parentId: parentId || null,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log('Created menu:', newMenu); // 디버그용

    return NextResponse.json(newMenu, { status: 201 });
  } catch (error: any) {
    console.error('Error creating menu:', error);

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: '존재하지 않는 상위 메뉴입니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create menu' },
      { status: 500 }
    );
  }
}