'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { switchRole } from '@/lib/auth-utils';
import { OpsRole, PERMISSIONS } from '@/lib/rbac';
import {
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  FileSpreadsheet,
  School,
  Truck,
  TrendingUp,
  Shield,
  Layers,
  ClipboardList,
  MapPin,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeRole: OpsRole;
}

export default function DashboardLayout({ children, activeRole }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRole = e.target.value;
    startTransition(async () => {
      await switchRole(nextRole);
      // Force reload to update permissions and UI states
      window.location.reload();
    });
  };

  const menuItems = [
    {
      name: 'Overview',
      href: '/',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: ShoppingBag,
      visible: true,
    },
    {
      name: 'Packing Queue',
      href: '/packing',
      icon: ClipboardList,
      visible: activeRole === 'admin' || activeRole === 'warehouse',
    },
    {
      name: 'Deliveries',
      href: '/delivery',
      icon: MapPin,
      visible: activeRole === 'admin' || activeRole === 'warehouse',
    },
    {
      name: 'Products',
      href: '/products',
      icon: Boxes,
      visible: PERMISSIONS[activeRole].canSeeConfig,
    },
    {
      name: 'Templates',
      href: '/templates',
      icon: FileSpreadsheet,
      visible: PERMISSIONS[activeRole].canSeeConfig,
    },
    {
      name: 'Schools',
      href: '/schools',
      icon: School,
      visible: PERMISSIONS[activeRole].canSeeConfig,
    },
    {
      name: 'Suppliers',
      href: '/suppliers',
      icon: Truck,

      visible: PERMISSIONS[activeRole].canSeeSuppliers,
    },
  ];


  return (
    <div className="flex min-h-screen bg-gray-50 text-jetblack">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-gray-200 shrink-0">
        <div className="p-6 border-b border-gray-200 flex flex-col items-center gap-2">
          <div className="relative h-10 w-44">
            <Image
              src="/brand/logo-wordmark.svg"
              alt="PREPPED 4 PREP Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Operations Portal
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                    isActive
                      ? 'bg-papaya/10 text-caramel'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-jetblack'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-jetblack text-white">
              <Shield className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 capitalize">{activeRole} Profile</p>
              <p className="text-[10px] text-gray-400">Security Clearance</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <div className="relative h-8 w-32">
              <Image
                src="/brand/logo-wordmark.svg"
                alt="PREPPED 4 PREP Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-gray-500">
            <span>Portal</span>
            <span>/</span>
            <span className="text-gray-900 font-bold capitalize">
              {pathname === '/' ? 'Overview' : pathname.replace('/', '')}
            </span>
          </div>

          {/* Dev Role Switcher */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-papaya-light/20 border border-papaya/30 px-3 py-1.5 rounded-xl">
              <Layers className="h-4 w-4 text-caramel" />
              <label htmlFor="role-switcher" className="text-[10px] font-black uppercase text-caramel tracking-wider">
                Dev Switch:
              </label>
              <select
                id="role-switcher"
                value={activeRole}
                onChange={handleRoleChange}
                disabled={isPending}
                className="bg-transparent text-xs font-bold text-jetblack focus:outline-none cursor-pointer"
              >
                <option value="admin">Admin (Caron)</option>
                <option value="finance">Finance Staff</option>
                <option value="warehouse">Warehouse Staff</option>
              </select>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
