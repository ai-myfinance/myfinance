"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import { useMenuType } from "@/contexts/MenuTypeContext";

interface Menu {
  id: string;
  name: string;
  path: string | null;
  filePath: string | null;
  icon: string | null;
  sortOrder: number;
  type: string;
  parentId: string | null;
  isActive: boolean;
}

interface TreeNode extends Menu {
  children: TreeNode[];
}

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();
  const { currentMenuType, setCurrentMenuType, availableMenuTypes } =
    useMenuType();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [treeMenus, setTreeMenus] = useState<TreeNode[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const fetchMenus = useCallback(async () => {
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      const activeMenus = data.filter((m: Menu) => m.isActive);
      console.log("📋 All active menus:", activeMenus);
      setMenus(activeMenus);

      // 메뉴 로드 후 현재 경로에 맞는 메뉴 타입 찾기
      console.log("🔍 Current pathname:", pathname);
      const currentMenu = activeMenus.find((m: Menu) => m.path === pathname);
      console.log("🎯 Found menu for current path:", currentMenu);

      if (currentMenu) {
        console.log("✅ Setting menu type to:", currentMenu.type);
        setCurrentMenuType(currentMenu.type);
      } else {
        console.log("❌ No menu found for path:", pathname);
      }
    } catch (error) {
      console.error("Failed to fetch menus:", error);
    }
  }, [pathname, setCurrentMenuType]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  useEffect(() => {
    if (!currentMenuType || menus.length === 0) return;
    console.log("🌳 Building tree with menu type:", currentMenuType);
    buildTree();
  }, [menus, currentMenuType]);

  const buildTree = () => {
    if (!currentMenuType) return;

    const filteredMenus = menus.filter((m) => m.type === currentMenuType);
    console.log(
      "📊 Filtered menus for type",
      currentMenuType,
      ":",
      filteredMenus,
    );

    const menuMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    filteredMenus.forEach((menu) => {
      menuMap.set(menu.id, { ...menu, children: [] });
    });

    filteredMenus.forEach((menu) => {
      const node = menuMap.get(menu.id)!;
      if (menu.parentId && menuMap.has(menu.parentId)) {
        const parent = menuMap.get(menu.parentId)!;
        parent.children.push(node);
        parent.children.sort((a, b) => a.sortOrder - b.sortOrder);
      } else {
        roots.push(node);
      }
    });

    roots.sort((a, b) => a.sortOrder - b.sortOrder);
    console.log("🎄 Tree roots:", roots);
    setTreeMenus(roots);

    // 현재 활성 메뉴의 부모들을 자동으로 펼치기
    const activeMenu = filteredMenus.find((m) => m.path === pathname);
    if (activeMenu) {
      const parentsToExpand = new Set<string>();
      let currentParentId = activeMenu.parentId;
      while (currentParentId && menuMap.has(currentParentId)) {
        parentsToExpand.add(currentParentId);
        const parent = menuMap.get(currentParentId);
        currentParentId = parent?.parentId || null;
      }
      setExpandedMenus(parentsToExpand);
    }
  };

  const toggleExpand = (menuId: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
    } else {
      newExpanded.add(menuId);
    }
    setExpandedMenus(newExpanded);
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName) return null;
    const Icon = (Icons as any)[iconName];
    return Icon ? <Icon size={18} /> : null;
  };

  const isMenuActive = (menu: TreeNode): boolean => {
    if (menu.path === pathname) return true;
    return menu.children.some((child) => isMenuActive(child));
  };

  const renderMenu = (menu: TreeNode, level: number = 0) => {
    const hasChildren = menu.children.length > 0;
    const isExpanded = expandedMenus.has(menu.id);
    const isActive = isMenuActive(menu);

    if (!isOpen && level > 0) return null;

    const paddingLeft = isOpen ? 16 + level * 16 : 16;

    return (
      <div key={menu.id}>
        {menu.path ? (
          <Link
            href={menu.path}
            className={`flex items-center gap-3 py-2.5 text-sm transition-colors ${
              isActive
                ? "bg-blue-600 text-white mx-2 rounded"
                : "text-gray-700 hover:bg-[#d1d5db] hover:text-gray-900 mx-2 rounded"
            } ${!isOpen && "justify-center px-4"}`}
            style={{
              paddingLeft: isOpen ? `${paddingLeft}px` : undefined,
              paddingRight: "16px",
            }}
          >
            {menu.icon && getIcon(menu.icon)}
            {isOpen && <span className="flex-1">{menu.name}</span>}
            {isOpen && hasChildren && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleExpand(menu.id);
                }}
                className="p-0.5 flex-shrink-0"
              >
                {isExpanded ? (
                  <Icons.ChevronDown size={16} />
                ) : (
                  <Icons.ChevronRight size={16} />
                )}
              </button>
            )}
          </Link>
        ) : (
          <button
            onClick={() => hasChildren && toggleExpand(menu.id)}
            className={`w-full flex items-center gap-3 py-2.5 text-sm transition-colors text-left ${
              isActive
                ? "bg-blue-600 text-white mx-2 rounded"
                : "text-gray-700 hover:bg-[#d1d5db] hover:text-gray-900 mx-2 rounded"
            } ${!isOpen && "justify-center px-4"}`}
            style={{
              paddingLeft: isOpen ? `${paddingLeft}px` : undefined,
              paddingRight: "16px",
            }}
          >
            {menu.icon && getIcon(menu.icon)}
            {isOpen && <span className="flex-1">{menu.name}</span>}
            {isOpen && hasChildren && (
              <span className="flex-shrink-0">
                {isExpanded ? (
                  <Icons.ChevronDown size={16} />
                ) : (
                  <Icons.ChevronRight size={16} />
                )}
              </span>
            )}
          </button>
        )}

        {isOpen && isExpanded && hasChildren && (
          <div>
            {menu.children.map((child) => renderMenu(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleMenuTypeChange = (type: string) => {
    console.log("🔄 Changing menu type to:", type);
    setCurrentMenuType(type);
    setExpandedMenus(new Set());
  };

  const otherMenuTypes = availableMenuTypes.filter(
    (type) => type.code !== currentMenuType,
  );

  if (!currentMenuType) {
    return (
      <aside
        className={`fixed left-0 top-14 bottom-0 bg-[#1e3a5f] transition-all duration-300 z-20 flex flex-col ${
          isOpen ? "w-64" : "w-16"
        }`}
      >
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          로딩 중...
        </div>
      </aside>
    );
  }

  return (
  <aside
    className={`fixed left-0 top-14 bottom-0 bg-[#e8eaf0] transition-all duration-300 z-20 flex flex-col ${
      isOpen ? 'w-64' : 'w-16'
    }`}
  >
    {/* 메뉴 목록 */}
    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
      {treeMenus.map((menu) => renderMenu(menu))}
    </nav>

    {/* 메뉴 타입 전환 (하단 고정) */}
    {isOpen && otherMenuTypes.length > 0 && (
      <div className="border-t border-[#d1d5db] p-4 flex-shrink-0">
        <div className="text-xs text-gray-500 mb-2">메뉴 전환</div>
        <div className="space-y-1">
          {otherMenuTypes.map((type) => (
            <button
              key={type.code}
              onClick={() => handleMenuTypeChange(type.code)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-[#d1d5db] hover:text-gray-900 rounded transition-colors"
            >
              <Icons.ArrowRightLeft size={16} />
              <span>{type.codeName}</span>
            </button>
          ))}
        </div>
      </div>
    )}

    {/* 축소 모드일 때 메뉴 타입 전환 아이콘 */}
    {!isOpen && otherMenuTypes.length > 0 && (
      <div className="border-t border-[#d1d5db] p-2 flex-shrink-0">
        {otherMenuTypes.map((type) => (
          <button
            key={type.code}
            onClick={() => handleMenuTypeChange(type.code)}
            className="w-full flex items-center justify-center p-3 text-gray-700 hover:bg-[#d1d5db] hover:text-gray-900 rounded transition-colors"
            title={type.codeName}
          >
            <Icons.ArrowRightLeft size={18} />
          </button>
        ))}
      </div>
    )}
  </aside>
);
}
