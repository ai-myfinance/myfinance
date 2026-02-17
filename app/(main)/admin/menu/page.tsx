'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronRight, ChevronDown, Save, X } from 'lucide-react';

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
  parent?: {
    id: string;
    name: string;
    type: string;
  } | null;
  _count?: {
    children: number;
  };
}

interface MenuType {
  code: string;
  codeName: string;
}

interface TreeNode extends Menu {
  children: TreeNode[];
  level: number;
}

export default function MenuManagePage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [menuTypes, setMenuTypes] = useState<MenuType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [menuForm, setMenuForm] = useState({
    name: '',
    path: '',
    filePath: '',
    icon: '',
    sortOrder: 0,
    type: '',
    parentId: '',
    isActive: true,
  });

  useEffect(() => {
    fetchMenus();
    fetchMenuTypes();
  }, []);

  useEffect(() => {
    buildTree();
  }, [menus]);

  const fetchMenus = async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      setMenus(data);
    } catch (error) {
      console.error('Failed to fetch menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuTypes = async () => {
    try {
      const res = await fetch('/api/code?masterCode=MENU_TYPE');
      const data = await res.json();
      setMenuTypes(data);
    } catch (error) {
      console.error('Failed to fetch menu types:', error);
    }
  };

  const buildTree = () => {
    const menuMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    menus.forEach((menu) => {
      menuMap.set(menu.id, { ...menu, children: [], level: 0 });
    });

    menus.forEach((menu) => {
      const node = menuMap.get(menu.id)!;
      if (menu.parentId && menuMap.has(menu.parentId)) {
        const parent = menuMap.get(menu.parentId)!;
        node.level = parent.level + 1;
        parent.children.push(node);
        parent.children.sort((a, b) => a.sortOrder - b.sortOrder);
      } else {
        roots.push(node);
      }
    });

    roots.sort((a, b) => a.sortOrder - b.sortOrder);
    setTreeData(roots);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const flattenTree = (nodes: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = [];
    const traverse = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        result.push(node);
        if (expandedNodes.has(node.id) && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    traverse(nodes);
    return result;
  };

  const generateFilePath = (parentId: string | null, menuName: string): string => {
    if (!parentId) {
      // 최상위 메뉴
      const slugName = menuName.toLowerCase().replace(/\s+/g, '-');
      return `/${slugName}`;
    }

    // 부모 메뉴 찾기
    const parent = menus.find((m) => m.id === parentId);
    if (!parent || !parent.filePath) {
      const slugName = menuName.toLowerCase().replace(/\s+/g, '-');
      return `/${slugName}`;
    }

    // 부모 경로에 추가
    const slugName = menuName.toLowerCase().replace(/\s+/g, '-');
    return `${parent.filePath}/${slugName}`;
  };

  const handleCreate = async () => {
  try {
    let finalType = menuForm.type;
    if (menuForm.parentId) {
      const parent = menus.find((m) => m.id === menuForm.parentId);
      if (parent) {
        finalType = parent.type;
      }
    }

    // filePath가 비어있으면 자동 생성
    let finalFilePath = menuForm.filePath?.trim();
    if (!finalFilePath) {
      finalFilePath = generateFilePath(menuForm.parentId || null, menuForm.name);
    }

    const requestData = {
      name: menuForm.name,
      path: menuForm.path?.trim() || null,
      filePath: finalFilePath,
      icon: menuForm.icon?.trim() || null,
      sortOrder: menuForm.sortOrder,
      type: finalType,
      parentId: menuForm.parentId || null,
      isActive: menuForm.isActive,
    };

    console.log('Sending to API:', requestData);

    const res = await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });

    if (res.ok) {
      const created = await res.json();
      console.log('Created menu:', created);
      await fetchMenus();
      setShowDetail(false);
      setIsCreating(false);
      resetForm();
    } else {
      const error = await res.json();
      console.error('API error:', error);
      alert(error.error || '메뉴 생성에 실패했습니다.');
    }
  } catch (error) {
    console.error('Failed to create menu:', error);
    alert('메뉴 생성에 실패했습니다.');
  }
};

  const handleUpdate = async () => {
    if (!selectedMenu) return;

    try {
      const res = await fetch(`/api/menu/${selectedMenu.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...menuForm,
          parentId: menuForm.parentId || null,
        }),
      });

      if (res.ok) {
        await fetchMenus();
        setShowDetail(false);
        setSelectedMenu(null);
        resetForm();
      } else {
        const error = await res.json();
        alert(error.error || '메뉴 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to update menu:', error);
      alert('메뉴 수정에 실패했습니다.');
    }
  };

  const handleDelete = async (id: string, hasChildren: number) => {
    if (hasChildren > 0) {
      alert('하위 메뉴가 있는 메뉴는 삭제할 수 없습니다. 먼저 하위 메뉴를 삭제해주세요.');
      return;
    }

    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (selectedMenu?.id === id) {
          closeDetail();
        }
        await fetchMenus();
      } else {
        const error = await res.json();
        alert(error.error || '메뉴 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete menu:', error);
      alert('메뉴 삭제에 실패했습니다.');
    }
  };

  const openDetail = (menu: Menu) => {
    setSelectedMenu(menu);
    setIsCreating(false);
    setMenuForm({
      name: menu.name,
      path: menu.path || '',
      filePath: menu.filePath || '',
      icon: menu.icon || '',
      sortOrder: menu.sortOrder,
      type: menu.type,
      parentId: menu.parentId || '',
      isActive: menu.isActive,
    });
    setShowDetail(true);
  };

  const openCreate = () => {
    resetForm();
    setIsCreating(true);
    setSelectedMenu(null);
    setShowDetail(true);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setIsCreating(false);
    setSelectedMenu(null);
    resetForm();
  };

  const resetForm = () => {
    setMenuForm({
      name: '',
      path: '',
      filePath: '',
      icon: '',
      sortOrder: 0,
      type: '',
      parentId: '',
      isActive: true,
    });
  };

  const getMenuTypeName = (type: string) => {
    const menuType = menuTypes.find((mt) => mt.code === type);
    return menuType ? menuType.codeName : type;
  };

  const getParentMenus = () => {
    if (selectedMenu) {
      const excludeIds = new Set<string>([selectedMenu.id]);
      const addDescendants = (id: string) => {
        menus.forEach((m) => {
          if (m.parentId === id) {
            excludeIds.add(m.id);
            addDescendants(m.id);
          }
        });
      };
      addDescendants(selectedMenu.id);
      return menus.filter((m) => !excludeIds.has(m.id));
    }
    return menus;
  };

  const isTypeDisabled = () => {
    return !!menuForm.parentId;
  };

  const flatMenus = flattenTree(treeData);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">메뉴 관리</h1>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* 왼쪽: 메뉴 목록 */}
        <div
          className={`bg-white rounded-lg shadow-sm flex flex-col transition-all duration-300 ${
            showDetail ? 'w-[500px]' : 'flex-1'
          }`}
        >
          <div className="px-6 py-4 bg-[#f5f6fa] border-b flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              메뉴 목록 <span className="text-blue-600">{menus.length}</span>
            </h2>
            <button
              onClick={openCreate}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#4a7ba7] text-white rounded hover:bg-[#3d6a91]"
            >
              <Plus size={14} />
              추가
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col style={{ width: '40%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '15%' }} />
              </colgroup>
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">메뉴명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">경로</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">메뉴 유형</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">로딩 중...</td>
                  </tr>
                ) : flatMenus.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">등록된 메뉴가 없습니다.</td>
                  </tr>
                ) : (
                  flatMenus.map((menu) => (
                    <tr
                      key={menu.id}
                      className={`border-b cursor-pointer transition-colors ${
                        selectedMenu?.id === menu.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => openDetail(menu)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2" style={{ paddingLeft: `${menu.level * 20}px` }}>
                          {menu.children.length > 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(menu.id);
                              }}
                              className="p-0.5 hover:bg-gray-200 rounded flex-shrink-0"
                            >
                              {expandedNodes.has(menu.id) ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                            </button>
                          ) : (
                            <div className="w-5 flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium text-gray-900 truncate" title={menu.name}>
                            {menu.name}
                          </span>
                          {menu._count && menu._count.children > 0 && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded flex-shrink-0">
                              {menu._count.children}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900 truncate block" title={menu.filePath || ''}>
                          {menu.filePath || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900 truncate block" title={getMenuTypeName(menu.type)}>
                          {getMenuTypeName(menu.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(menu.id, menu._count?.children || 0);
                            }}
                            className={`p-1.5 rounded ${
                              menu._count && menu._count.children > 0
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            disabled={menu._count && menu._count.children > 0}
                            title={menu._count && menu._count.children > 0 ? '하위 메뉴가 있어 삭제할 수 없습니다' : '삭제'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 오른쪽: 상세 정보 */}
        {showDetail && (
          <div className="flex-1 bg-white rounded-lg shadow-sm flex flex-col min-w-0">
            <div className="px-6 py-4 bg-[#f5f6fa] border-b flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                {isCreating ? '메뉴 추가' : '메뉴 수정'}
              </h2>
              <button
                onClick={closeDetail}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    메뉴명 *
                  </label>
                  <input
                    type="text"
                    value={menuForm.name}
                    onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 대시보드"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상위 메뉴
                  </label>
                  <select
                    value={menuForm.parentId}
                    onChange={(e) => {
                      const newParentId = e.target.value;
                      if (newParentId) {
                        const parent = menus.find((m) => m.id === newParentId);
                        if (parent) {
                          setMenuForm({ ...menuForm, parentId: newParentId, type: parent.type });
                        }
                      } else {
                        setMenuForm({ ...menuForm, parentId: newParentId });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">없음 (최상위 메뉴)</option>
                    {getParentMenus().map((menu) => (
                      <option key={menu.id} value={menu.id}>
                        {menu.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    상위 메뉴를 선택하면 자동으로 폴더 구조로 경로가 생성됩니다
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    메뉴 유형 * {isTypeDisabled() && <span className="text-xs text-gray-500">(상위 메뉴에서 상속)</span>}
                  </label>
                  <select
                    value={menuForm.type}
                    onChange={(e) => setMenuForm({ ...menuForm, type: e.target.value })}
                    disabled={isTypeDisabled()}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">선택하세요</option>
                    {menuTypes.map((type) => (
                      <option key={type.code} value={type.code}>
                        {type.codeName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    파일 경로 (폴더 구조)
                  </label>
                  <input
                    type="text"
                    value={menuForm.filePath}
                    onChange={(e) => setMenuForm({ ...menuForm, filePath: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: /admin/menu"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    실제 파일 경로(예: /admin/menu)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL 경로
                  </label>
                  <input
                    type="text"
                    value={menuForm.path}
                    onChange={(e) => setMenuForm({ ...menuForm, path: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: /admin/menu"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    실제 라우팅에 사용되는 URL 경로
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    아이콘
                  </label>
                  <input
                    type="text"
                    value={menuForm.icon}
                    onChange={(e) => setMenuForm({ ...menuForm, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: LayoutDashboard"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    lucide-react 아이콘 이름
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    순서
                  </label>
                  <input
                    type="number"
                    value={menuForm.sortOrder}
                    onChange={(e) => setMenuForm({ ...menuForm, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={menuForm.isActive}
                      onChange={(e) => setMenuForm({ ...menuForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">사용</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-end gap-2">
              <button
                onClick={closeDetail}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={isCreating ? handleCreate : handleUpdate}
                className="flex items-center gap-2 px-4 py-2 bg-[#4a7ba7] text-white rounded hover:bg-[#3d6a91]"
              >
                <Save size={16} />
                {isCreating ? '생성' : '저장'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}