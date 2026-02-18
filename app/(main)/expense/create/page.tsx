'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trash2, Plus } from 'lucide-react';

interface Detail {
  id: string;
  type: string;
  cardUsageId: string | null;
  groupId: string | null;
  settlementAmt: number | null;
  accountCode: string | null;
  costCenterCode: string | null;
  fundCenterCode: string | null;
  wbsCode: string | null;
  remark: string | null;
  deductibleYn: boolean;
  receiptDate: string | null;
  cardUsage?: {
    approvalDatetime: string | null;
    supplierName: string | null;
    supplyAmt: number | null;
    taxAmt: number | null;
    industryName: string | null;
    approvalNo: string | null;
    cardOwnerEmpName: string | null;
  };
}

interface Group {
  id: string;
  status: string;
  title: string;
}

interface MasterData {
  code: string;
  name: string;
}

function ExpenseCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId');

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState<Detail[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  
  // Master 데이터
  const [accounts, setAccounts] = useState<MasterData[]>([]);
  const [costCenters, setCostCenters] = useState<MasterData[]>([]);
  const [fundCenters, setFundCenters] = useState<MasterData[]>([]);
  const [wbsList, setWbsList] = useState<MasterData[]>([]);

  // 현금/영수증 추가 모달
  const [showAddModal, setShowAddModal] = useState(false);
  const [cashForm, setCashForm] = useState({
    receiptDate: new Date().toISOString().split('T')[0],
    settlementAmt: '',
    accountCode: '',
    costCenterCode: '',
    fundCenterCode: '',
    wbsCode: '',
    remark: '',
    deductibleYn: false,
  });

  // 결제요청 모달
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [postingDate, setPostingDate] = useState(new Date().toISOString().split('T')[0]);

  const isReadOnly = group?.status !== 'SAVE' && group?.status !== undefined;

  useEffect(() => {
    fetchMasterData();
    if (groupId) {
      fetchGroup();
      fetchDetails(groupId);
    } else {
      fetchDetails('null');
    }
  }, [groupId]);

  const fetchMasterData = async () => {
    try {
      const [accRes, ccRes, fcRes, wbsRes] = await Promise.all([
        fetch('/api/master/account'),
        fetch('/api/master/cost-center'),
        fetch('/api/master/fund-center'),
        fetch('/api/master/wbs'),
      ]);

      setAccounts(await accRes.json());
      setCostCenters(await ccRes.json());
      setFundCenters(await fcRes.json());
      setWbsList(await wbsRes.json());
    } catch (error) {
      console.error('Failed to fetch master data:', error);
    }
  };

  const fetchGroup = async () => {
    try {
      const res = await fetch(`/api/expense/group/${groupId}`);
      const data = await res.json();
      setGroup(data);
      setTitle(data.title || '');
    } catch (error) {
      console.error('Failed to fetch group:', error);
    }
  };

  const fetchDetails = async (gid: string) => {
    try {
      const res = await fetch(`/api/expense/detail?groupId=${gid}`);
      const data = await res.json();
      setDetails(data);
    } catch (error) {
      console.error('Failed to fetch details:', error);
    }
  };

  const handleFieldChange = async (detailId: string, field: string, value: string) => {
    try {
      await fetch(`/api/expense/detail/${detailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      // 로컬 state 업데이트
      setDetails(details.map(d => 
        d.id === detailId ? { ...d, [field]: value } : d
      ));
    } catch (error) {
      console.error('Failed to update detail:', error);
      alert('수정에 실패했습니다.');
    }
  };

  const handleAddCash = async () => {
    try {
      const res = await fetch('/api/expense/detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cashForm,
          settlementAmt: parseFloat(cashForm.settlementAmt),
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setCashForm({
          receiptDate: new Date().toISOString().split('T')[0],
          settlementAmt: '',
          accountCode: '',
          costCenterCode: '',
          fundCenterCode: '',
          wbsCode: '',
          remark: '',
          deductibleYn: false,
        });
        fetchDetails(groupId || 'null');
      }
    } catch (error) {
      console.error('Failed to add cash detail:', error);
      alert('추가에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }

    // type='3' (현금/영수증)만 삭제 가능 체크
    const selectedDetails = details.filter(d => selectedIds.includes(d.id));
    const hasCard = selectedDetails.some(d => d.type === '1');
    
    if (hasCard) {
      alert('카드 내역은 삭제할 수 없습니다. 현금/영수증만 삭제 가능합니다.');
      return;
    }

    if (!confirm(`선택한 ${selectedIds.length}건을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedIds.map(id =>
          fetch(`/api/expense/detail/${id}`, { method: 'DELETE' })
        )
      );

      setSelectedIds([]);
      fetchDetails(groupId || 'null');
    } catch (error) {
      console.error('Failed to delete details:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      alert('정산할 항목을 선택해주세요.');
      return;
    }

    const finalTitle = title.trim() || `경비정산_${new Date().toISOString().split('T')[0]}`;

    try {
      if (groupId) {
        // 수정
        await fetch(`/api/expense/group/${groupId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'SAVE',
            title: finalTitle,
            detailIds: selectedIds,
          }),
        });
      } else {
        // 신규
        await fetch('/api/expense/group', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'SAVE',
            title: finalTitle,
            detailIds: selectedIds,
          }),
        });
      }

      alert('저장되었습니다.');
      router.push('/expense/list');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('저장에 실패했습니다.');
    }
  };

  const handleSubmit = () => {
    if (selectedIds.length === 0) {
      alert('정산할 항목을 선택해주세요.');
      return;
    }

    const finalTitle = title.trim() || `경비정산_${new Date().toISOString().split('T')[0]}`;
    setTitle(finalTitle);
    setShowSubmitModal(true);
  };

  const confirmSubmit = async () => {
    const finalTitle = title.trim() || `경비정산_${new Date().toISOString().split('T')[0]}`;

    try {
      if (groupId) {
        // 수정
        await fetch(`/api/expense/group/${groupId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'SUBMIT',
            title: finalTitle,
            detailIds: selectedIds,
            postingDate,
          }),
        });
      } else {
        // 신규
        await fetch('/api/expense/group', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'SUBMIT',
            title: finalTitle,
            detailIds: selectedIds,
            postingDate,
          }),
        });
      }

      alert('결제요청되었습니다.');
      router.push('/expense/list');
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('결제요청에 실패했습니다.');
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === details.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(details.map(d => d.id));
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {groupId ? '경비정산 상세' : '경비정산 신규 작성'}
        </h1>

        {/* 전표 제목 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            전표 제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isReadOnly}
            placeholder="경비정산_2024-02-18"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        {/* 버튼 영역 */}
        {!isReadOnly && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <Plus size={18} />
              현금/영수증 추가
            </button>
            <button
              onClick={handleDelete}
              disabled={selectedIds.length === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 flex items-center gap-2"
            >
              <Trash2 size={18} />
              삭제
            </button>
            <div className="flex-1"></div>
            <button
              onClick={handleSave}
              disabled={selectedIds.length === 0}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300"
            >
              저장
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedIds.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
            >
              결제요청
            </button>
          </div>
        )}
      </div>

      {/* 테이블 */}
      <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto h-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === details.length && details.length > 0}
                    onChange={toggleSelectAll}
                    disabled={isReadOnly}
                    className="rounded"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">거래일시</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">상호</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">사용금액</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">부가세</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">정산금액</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">공제</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">계정</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost Center</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fund Center</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">WBS</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">세부 내역</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">업종</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">승인번호</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">카드명의자</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {details.map((detail) => (
                <tr key={detail.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(detail.id)}
                      onChange={() => toggleSelect(detail.id)}
                      disabled={isReadOnly}
                      className="rounded"
                    />
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    {detail.type === '1'
                      ? detail.cardUsage?.approvalDatetime?.substring(0, 16)
                      : detail.receiptDate}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    {detail.type === '1' ? '카드' : '현금/영수증'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    {detail.cardUsage?.supplierName || '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right">
                    {detail.cardUsage?.supplyAmt?.toLocaleString() || '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right">
                    {detail.cardUsage?.taxAmt?.toLocaleString() || '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right">
                    {detail.settlementAmt?.toLocaleString() || '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                    {detail.deductibleYn ? 'Y' : 'N'}
                  </td>
                  {/* 계정 */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <select
                      value={detail.accountCode || ''}
                      onChange={(e) => handleFieldChange(detail.id, 'accountCode', e.target.value)}
                      disabled={isReadOnly}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">선택</option>
                      {accounts.map(acc => (
                        <option key={acc.code} value={acc.code}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  {/* Cost Center */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <select
                      value={detail.costCenterCode || ''}
                      onChange={(e) => handleFieldChange(detail.id, 'costCenterCode', e.target.value)}
                      disabled={isReadOnly}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">선택</option>
                      {costCenters.map(cc => (
                        <option key={cc.code} value={cc.code}>
                          {cc.code} - {cc.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  {/* Fund Center */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <select
                      value={detail.fundCenterCode || ''}
                      onChange={(e) => handleFieldChange(detail.id, 'fundCenterCode', e.target.value)}
                      disabled={isReadOnly}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">선택</option>
                      {fundCenters.map(fc => (
                        <option key={fc.code} value={fc.code}>
                          {fc.code} - {fc.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  {/* WBS */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <select
                      value={detail.wbsCode || ''}
                      onChange={(e) => handleFieldChange(detail.id, 'wbsCode', e.target.value)}
                      disabled={isReadOnly}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">선택</option>
                      {wbsList.map(wbs => (
                        <option key={wbs.code} value={wbs.code}>
                          {wbs.code} - {wbs.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  {/* 세부 내역 */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={detail.remark || ''}
                      onChange={(e) => setDetails(details.map(d => 
                        d.id === detail.id ? { ...d, remark: e.target.value } : d
                      ))}
                      onBlur={(e) => handleFieldChange(detail.id, 'remark', e.target.value)}
                      disabled={isReadOnly}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="세부 내역"
                    />
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    {detail.cardUsage?.industryName || '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    {detail.cardUsage?.approvalNo || '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    {detail.cardUsage?.cardOwnerEmpName || '-'}
                  </td>
                </tr>
              ))}
              {details.length === 0 && (
                <tr>
                  <td colSpan={16} className="px-3 py-8 text-center text-gray-500">
                    정산할 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 현금/영수증 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">현금/영수증 추가</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  증빙일자 *
                </label>
                <input
                  type="date"
                  value={cashForm.receiptDate}
                  onChange={(e) => setCashForm({ ...cashForm, receiptDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  정산금액 *
                </label>
                <input
                  type="number"
                  value={cashForm.settlementAmt}
                  onChange={(e) => setCashForm({ ...cashForm, settlementAmt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  계정
                </label>
                <select
                  value={cashForm.accountCode}
                  onChange={(e) => setCashForm({ ...cashForm, accountCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">선택</option>
                  {accounts.map(acc => (
                    <option key={acc.code} value={acc.code}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Center
                </label>
                <select
                  value={cashForm.costCenterCode}
                  onChange={(e) => setCashForm({ ...cashForm, costCenterCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">선택</option>
                  {costCenters.map(cc => (
                    <option key={cc.code} value={cc.code}>
                      {cc.code} - {cc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  세부 내역
                </label>
                <input
                  type="text"
                  value={cashForm.remark}
                  onChange={(e) => setCashForm({ ...cashForm, remark: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="세부 내역 입력"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="deductible"
                  checked={cashForm.deductibleYn}
                  onChange={(e) => setCashForm({ ...cashForm, deductibleYn: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="deductible" className="ml-2 text-sm text-gray-700">
                  공제 여부
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleAddCash}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 결제요청 모달 */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">결제요청</h2>
            
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
                결제요청
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExpenseCreatePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExpenseCreateContent />
    </Suspense>
  );
}