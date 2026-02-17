"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X, ChevronLeft } from "lucide-react";

interface MasterCode {
  code: string;
  codeName: string;
  description: string | null;
  isActive: boolean;
  _count?: {
    codes: number;
  };
}

interface Code {
  code: string;
  masterCode: string;
  codeName: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export default function CodeManagePage() {
  const [masterCodes, setMasterCodes] = useState<MasterCode[]>([]);
  const [selectedMasterCode, setSelectedMasterCode] = useState<string | null>(
    null,
  );
  const [detailCodes, setDetailCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [editingMaster, setEditingMaster] = useState<MasterCode | null>(null);
  const [editingCode, setEditingCode] = useState<Code | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const [masterForm, setMasterForm] = useState({
    code: "",
    codeName: "",
    description: "",
    isActive: true,
  });

  const [codeForm, setCodeForm] = useState({
    code: "",
    codeName: "",
    description: "",
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchMasterCodes();
  }, []);

  useEffect(() => {
    if (selectedMasterCode) {
      fetchDetailCodes(selectedMasterCode);
      setShowDetail(true);
    }
  }, [selectedMasterCode]);

  const fetchMasterCodes = async () => {
    try {
      const res = await fetch("/api/code/master");
      const data = await res.json();
      setMasterCodes(data);
    } catch (error) {
      console.error("Failed to fetch master codes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailCodes = async (masterCode: string) => {
    try {
      const res = await fetch(`/api/code?masterCode=${masterCode}`);
      const data = await res.json();
      setDetailCodes(data);
    } catch (error) {
      console.error("Failed to fetch detail codes:", error);
    }
  };

  const handleCreateMaster = async () => {
    try {
      const res = await fetch("/api/code/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(masterForm),
      });

      if (res.ok) {
        fetchMasterCodes();
        setShowMasterModal(false);
        resetMasterForm();
      } else {
        const error = await res.json();
        alert(error.error || "마스터 코드 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to create master code:", error);
      alert("마스터 코드 생성에 실패했습니다.");
    }
  };

  const handleUpdateMaster = async () => {
    if (!editingMaster) return;

    try {
      const res = await fetch(`/api/code/master/${editingMaster.code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(masterForm),
      });

      if (res.ok) {
        fetchMasterCodes();
        setShowMasterModal(false);
        setEditingMaster(null);
        resetMasterForm();
      } else {
        const error = await res.json();
        alert(error.error || "마스터 코드 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to update master code:", error);
      alert("마스터 코드 수정에 실패했습니다.");
    }
  };

  const handleDeleteMaster = async (code: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/code/master/${code}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchMasterCodes();
        if (selectedMasterCode === code) {
          setSelectedMasterCode(null);
          setDetailCodes([]);
          setShowDetail(false);
        }
      } else {
        const error = await res.json();
        alert(error.error || "마스터 코드 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to delete master code:", error);
      alert("마스터 코드 삭제에 실패했습니다.");
    }
  };

  const handleCreateCode = async () => {
    if (!selectedMasterCode) return;

    try {
      const res = await fetch("/api/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...codeForm,
          masterCode: selectedMasterCode,
        }),
      });

      if (res.ok) {
        fetchDetailCodes(selectedMasterCode);
        fetchMasterCodes();
        setShowCodeModal(false);
        resetCodeForm();
      } else {
        const error = await res.json();
        alert(error.error || "상세 코드 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to create code:", error);
      alert("상세 코드 생성에 실패했습니다.");
    }
  };

  const handleUpdateCode = async () => {
    if (!editingCode) return;

    try {
      const res = await fetch(`/api/code/${editingCode.code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(codeForm),
      });

      if (res.ok) {
        if (selectedMasterCode) {
          fetchDetailCodes(selectedMasterCode);
        }
        setShowCodeModal(false);
        setEditingCode(null);
        resetCodeForm();
      } else {
        const error = await res.json();
        alert(error.error || "상세 코드 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to update code:", error);
      alert("상세 코드 수정에 실패했습니다.");
    }
  };

  const handleDeleteCode = async (code: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/code/${code}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (selectedMasterCode) {
          fetchDetailCodes(selectedMasterCode);
          fetchMasterCodes();
        }
      } else {
        const error = await res.json();
        alert(error.error || "상세 코드 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to delete code:", error);
      alert("상세 코드 삭제에 실패했습니다.");
    }
  };

  const openMasterModal = (master?: MasterCode) => {
    if (master) {
      setEditingMaster(master);
      setMasterForm({
        code: master.code,
        codeName: master.codeName,
        description: master.description || "",
        isActive: master.isActive,
      });
    } else {
      resetMasterForm();
    }
    setShowMasterModal(true);
  };

  const openCodeModal = (code?: Code) => {
    if (code) {
      setEditingCode(code);
      setCodeForm({
        code: code.code,
        codeName: code.codeName,
        description: code.description || "",
        sortOrder: code.sortOrder,
        isActive: code.isActive,
      });
    } else {
      resetCodeForm();
    }
    setShowCodeModal(true);
  };

  const resetMasterForm = () => {
    setMasterForm({ code: "", codeName: "", description: "", isActive: true });
    setEditingMaster(null);
  };

  const resetCodeForm = () => {
    setCodeForm({
      code: "",
      codeName: "",
      description: "",
      sortOrder: 0,
      isActive: true,
    });
    setEditingCode(null);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelectedMasterCode(null);
    setDetailCodes([]);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">공통 코드 관리</h1>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* 마스터 코드 */}
        <div
          className={`bg-white rounded-lg shadow-sm flex flex-col transition-all duration-300 ${
            showDetail ? "w-[420px]" : "flex-1"
          }`}
        >
          <div className="px-6 py-4 bg-[#f5f6fa] border-b flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              마스터코드 목록{" "}
              <span className="text-blue-600">{masterCodes.length}</span>
            </h2>
            <button
              onClick={() => openMasterModal()}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#4a7ba7] text-white rounded hover:bg-[#3d6a91]"
            >
              <Plus size={14} />
              추가
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col style={{ width: "25%" }} />
                <col style={{ width: "28%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "19%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    마스터 코드
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    마스터 코드명
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    사용 여부
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    비고
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      로딩 중...
                    </td>
                  </tr>
                ) : masterCodes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      등록된 마스터 코드가 없습니다.
                    </td>
                  </tr>
                ) : (
                  masterCodes.map((master) => (
                    <tr
                      key={master.code}
                      className={`border-b cursor-pointer ${
                        selectedMasterCode === master.code
                          ? "bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedMasterCode(master.code)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-medium text-gray-900 truncate"
                            title={master.code}
                          >
                            {master.code}
                          </span>
                          {master._count && master._count.codes > 0 && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                              {master._count.codes}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-sm text-gray-900 truncate block"
                          title={master.codeName}
                        >
                          {master.codeName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded ${
                            master.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {master.isActive ? "사용" : "미사용"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-sm text-gray-500 truncate block"
                          title={master.description || ""}
                        >
                          {master.description || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openMasterModal(master);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMaster(master.code);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
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

        {/* 상세 코드 */}
        {showDetail && (
          <div className="flex-1 bg-white rounded-lg shadow-sm flex flex-col min-w-0">
            <div className="px-6 py-4 bg-[#f5f6fa] border-b flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={closeDetail}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900">
                    상세코드 목록{" "}
                    <span className="text-blue-600">{detailCodes.length}</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {selectedMasterCode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => openCodeModal()}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#4a7ba7] text-white rounded hover:bg-[#3d6a91]"
              >
                <Plus size={14} />
                추가
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full table-fixed">
                <colgroup>
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "4%" }} />
                </colgroup>
                <thead className="bg-gray-50 border-b sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      마스터 코드
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      상세 코드
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      상세 코드명
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      설명
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      순서
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {detailCodes.map((code) => (
                    <tr key={code.code} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span
                          className="text-sm text-gray-500 truncate block"
                          title={code.masterCode}
                        >
                          {code.masterCode}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-sm font-medium text-gray-900 truncate block"
                          title={code.code}
                        >
                          {code.code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-sm text-gray-900 truncate block"
                          title={code.codeName}
                        >
                          {code.codeName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-sm text-gray-500 truncate block"
                          title={code.description || ""}
                        >
                          {code.description || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">
                          {code.sortOrder}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openCodeModal(code)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteCode(code.code)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 모달 - 동일 */}
      {showMasterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingMaster ? "마스터 코드 수정" : "마스터 코드 추가"}
              </h3>
              <button
                onClick={() => {
                  setShowMasterModal(false);
                  resetMasterForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  마스터 코드 *
                </label>
                <input
                  type="text"
                  value={masterForm.code}
                  onChange={(e) =>
                    setMasterForm({
                      ...masterForm,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  disabled={!!editingMaster}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="예: CURRENCY"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  코드명 *
                </label>
                <input
                  type="text"
                  value={masterForm.codeName}
                  onChange={(e) =>
                    setMasterForm({ ...masterForm, codeName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 통화"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  value={masterForm.description}
                  onChange={(e) =>
                    setMasterForm({
                      ...masterForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="코드에 대한 설명"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={masterForm.isActive}
                    onChange={(e) =>
                      setMasterForm({
                        ...masterForm,
                        isActive: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    사용
                  </span>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowMasterModal(false);
                  resetMasterForm();
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={
                  editingMaster ? handleUpdateMaster : handleCreateMaster
                }
                className="px-4 py-2 bg-[#4a7ba7] text-white rounded hover:bg-[#3d6a91]"
              >
                {editingMaster ? "수정" : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingCode ? "상세 코드 수정" : "상세 코드 추가"}
              </h3>
              <button
                onClick={() => {
                  setShowCodeModal(false);
                  resetCodeForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  코드 *
                </label>
                <input
                  type="text"
                  value={codeForm.code}
                  onChange={(e) =>
                    setCodeForm({
                      ...codeForm,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  disabled={!!editingCode}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  코드명 *
                </label>
                <input
                  type="text"
                  value={codeForm.codeName}
                  onChange={(e) =>
                    setCodeForm({ ...codeForm, codeName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  순서
                </label>
                <input
                  type="number"
                  value={codeForm.sortOrder}
                  onChange={(e) =>
                    setCodeForm({
                      ...codeForm,
                      sortOrder: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  value={codeForm.description}
                  onChange={(e) =>
                    setCodeForm({ ...codeForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={codeForm.isActive}
                    onChange={(e) =>
                      setCodeForm({ ...codeForm, isActive: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    사용
                  </span>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowCodeModal(false);
                  resetCodeForm();
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={editingCode ? handleUpdateCode : handleCreateCode}
                className="px-4 py-2 bg-[#4a7ba7] text-white rounded hover:bg-[#3d6a91]"
              >
                {editingCode ? "수정" : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
