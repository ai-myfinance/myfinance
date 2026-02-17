'use client';

import { useState } from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="flex-1 flex pt-14 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} />
        <main
          className={`flex-1 overflow-auto bg-gray-50 transition-all duration-300 ${
            isSidebarOpen ? 'ml-64' : 'ml-16'
          }`}
        >
          <div className="p-8 flex-1 flex flex-col overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}