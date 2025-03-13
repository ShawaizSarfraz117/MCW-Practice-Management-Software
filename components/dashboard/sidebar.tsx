'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isAdmin?: boolean;
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Define navigation items based on role
  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      active: pathname === '/dashboard',
    },
    {
      label: 'Clients',
      href: '/dashboard/clients',
      icon: Users,
      active: pathname?.startsWith('/dashboard/clients'),
    },
    {
      label: 'Appointments',
      href: '/dashboard/appointments',
      icon: Calendar,
      active: pathname?.startsWith('/dashboard/appointments'),
    },
    {
      label: 'Reports',
      href: '/dashboard/reports',
      icon: FileText,
      active: pathname?.startsWith('/dashboard/reports'),
    },
    // Admin only section
    ...(isAdmin ? [
      {
        label: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
        active: pathname?.startsWith('/dashboard/settings'),
      }
    ] : []),
  ];

  return (
    <aside 
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-4 flex items-center justify-between border-b border-gray-200">
        <div className={`font-semibold text-gray-800 ${collapsed ? 'hidden' : 'block'}`}>
          MCW Platform
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link 
                href={item.href}
                className={`flex items-center p-2 rounded-md ${
                  item.active 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {!collapsed && (
                  <span className="ml-3">{item.label}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <Link 
          href="/api/auth/signout"
          className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md"
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!collapsed && (
            <span className="ml-3">Sign Out</span>
          )}
        </Link>
      </div>
    </aside>
  );
} 