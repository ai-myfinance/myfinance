'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Group {
  id: string;
  status: string;
  title: string;
  approvalRequestDatetime: string;
  reviewer1EmpNo: string | null;
  approverEmpNo: string | null;
  supplyAmtSum: number;
  settlementAmtSum: number;
  detailCount: number;
}

interface StatusCode {
  code: string;
  codeName: string;
}

export default function ExpenseListPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [statusCodes, setStatusCodes] = useState<StatusCode[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // 결제요청 모달
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [postingDate, setPostingDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchGroups();
    fetchStatusCodes();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/expense/group');
      const data = await res.json();
      setGroups(data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  const fetchStatusCodes = async () => {
    try {
      const res = await fetch('/api/code?masterCode=EXPENSE_STATUS');
      const data = await res.json();
      setStatusCodes(data);
    } catch (error) {
      console.error('Failed to fetch status codes:', error);
    }
  };

  const getStatusName = (code: string) => {
    return statusCodes.find(s => s.code === code)?.codeName || code;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string }> = {
      'SAVE': { color: 'bg-gray-200 text-gray-700' },
      'SUBMIT': { color: 'bg-blue-200 text-blue-700' },
      'GW_APPROVED': { color: 'bg-green-200 text-green-700' },
      'GW_REJECT': { color: 'bg-red-200 text-red-700' },
    };

    const { color } = statusMap[status] || { color: 'bg-gray-200 text-gray-700' };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
        {getStatusName(status)}
      </span>
    );
  };

  const handleRowClick = (groupId: string) => {
    router.push(`/expense/create?groupId=${groupId}`);
  };

  const toggleSelect = (id: string, status: string) => {
    // SAVE 상태만 선택 가능
    if (status !== 'SAVE') return;

    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSubmitRequest = () => {
    if (selectedIds.length === 0) {
      alert('승인요청할 항목을 선택해주세요.');
      return;
    }

    setShowSubmitModal(true);
  };

  const confirmSubmit = async () => {
    try {
      // 선택된 각 Group을 SUBMIT 상태로 변경
      await Promise.all(
        selectedIds.map(async (groupId) => {
          const group = groups.find(g => g.id === groupId);
          if (!group) return;

          // Group의 모든 Detail IDs 가져오기
          const res = await fetch(`/api/expense/group/${groupId}`);
          const data = await res.json();
          const detailIds = data.details.map((d: any) => d.id);

          // Group 업데이트
          await fetch(`/api/expense/group/${groupId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'SUBMIT',
              title: group.title,
              detailIds,
              postingDate,
            }),
          });
        })
      );

      alert('승인요청되었습니다.');
      setShowSubmitModal(false);
      setSelectedIds([]);
      fetchGroups();
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('승인요청에 실패했습니다.');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">경비정산 저장 목록</h1>

        {/* 버튼 영역 */}
        <div className="flex gap-2">
          <button
            onClick={handleSubmitRequest}
            disabled={selectedIds.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
          >
            승인요청
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto h-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  선택
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  결재 상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  신청일자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  전표 제목
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  공급가
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  총금액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  검토자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  승인자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  건수
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groups.map((group) => (
                <tr
                  key={group.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRowClick(group.id)}
                >
                  <td
                    className="px-6 py-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {group.status === 'SAVE' && (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(group.id)}
                        onChange={() => toggleSelect(group.id, group.status)}
                        className="rounded"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(group.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(group.approvalRequestDatetime).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {group.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {group.supplyAmtSum.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {group.settlementAmtSum.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {group.reviewer1EmpNo || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {group.approverEmpNo || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {group.detailCount}건
                  </td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    저장된 경비정산이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 승인요청 모달 */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">승인요청</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Posting Date (필수)
              </label>
              <input
                type="date"
                value={postingDate}
                onChange={(e) => setPostingDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <p className="mt-4 text-sm text-gray-600">
              선택한 {selectedIds.length}건의 경비정산을 승인요청하시겠습니까?
            </p>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={confirmSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                승인요청
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}