import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 하위 메뉴들의 type을 재귀적으로 업데이트
async function updateChildrenType(parentId: string, type: string) {
  const children = await prisma.menu.findMany({
    where: { parentId },
  });

  for (const child of children) {
    await prisma.menu.update({
      where: { id: child.id },
      data: { type },
    });
    // 재귀적으로 하위의 하위도 업데이트
    await updateChildrenType(child.id, type);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, path, filePath, icon, sortOrder, type, parentId, isActive } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'name and type are required' },
        { status: 400 }
      );
    }

    // 자기 자신을 부모로 설정하는 것 방지
    if (parentId === id) {
      return NextResponse.json(
        { error: '자기 자신을 상위 메뉴로 설정할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 현재 메뉴 정보 가져오기
    const currentMenu = await prisma.menu.findUnique({
      where: { id },
    });

    if (!currentMenu) {
      return NextResponse.json(
        { error: '메뉴를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 메뉴 업데이트
    const updatedMenu = await prisma.menu.update({
      where: { id },
      data: {
        name,
        path: path || null,
        filePath: filePath || null,
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

    // type이 변경되었으면 하위 메뉴들도 모두 업데이트
    if (currentMenu.type !== type) {
      await updateChildrenType(id, type);
    }

    return NextResponse.json(updatedMenu);
  } catch (error: any) {
    console.error('Error updating menu:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: '메뉴를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: '존재하지 않는 상위 메뉴입니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update menu' },
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

    // 하위 메뉴가 있는지 확인
    const childrenCount = await prisma.menu.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      return NextResponse.json(
        { error: '하위 메뉴가 있는 메뉴는 삭제할 수 없습니다. 먼저 하위 메뉴를 삭제해주세요.' },
        { status: 400 }
      );
    }

    await prisma.menu.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting menu:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: '메뉴를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete menu' },
      { status: 500 }
    );
  }
}