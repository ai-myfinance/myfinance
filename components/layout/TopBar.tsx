'use client';

import { Menu, Search, User } from 'lucide-react';

interface TopBarProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export default function TopBar({ toggleSidebar, isSidebarOpen }: TopBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#1e3a5f] text-white z-30 flex items-center shadow-md">
      <div className="flex items-center gap-4 px-4 w-64">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-[#2d4a6f] rounded transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-bold">MyFinance</h1>
      </div>

      <div className="flex-1 flex items-center justify-between px-6">
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="상호 또는 금액으로 조회 할 수 있습니다."
              className="w-full pl-10 pr-4 py-2 bg-[#2d4a6f] border border-[#3d5a7f] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button className="p-2 hover:bg-[#2d4a6f] rounded transition-colors">
          <User size={20} />
        </button>
      </div>
    </header>
  );
}