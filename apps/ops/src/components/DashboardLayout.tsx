'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { opsSignout, setPreviewRole } from '@/app/auth-actions';
import { OpsRole, PERMISSIONS } from '@/lib/rbac';
import {
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  FileSpreadsheet,
  School,
  Truck,
  Shield,
  ClipboardList,
  MapPin,
  LogOut,
  Eye,
  Users,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeRole: OpsRole;
  isActualAdmin?: boolean;  // true when the JWT role is 'admin', regardless of preview
  userEmail?: string;
}

export default function DashboardLayout({
  children,
  activeRole,
  isActualAdmin = false,
  userEmail = '',
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handlePreviewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRole = e.target.value;
    startTransition(async () => {
      // 'admin' means "exit preview mode"
      await setPreviewRole(nextRole === 'admin' ? null : nextRole);
      window.location.reload();
    });
  };

  const handleSignOut = () => {
    startTransition(async () => {
      await opsSignout();
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
    {
      name: 'Staff',
      href: '/staff',
      icon: Users,
      visible: isActualAdmin, // Only real admins can manage staff
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

        {/* Sidebar Footer — User identity + sign out */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <div className="flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-jetblack text-white shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 capitalize truncate">
                {isActualAdmin && activeRole !== 'admin' ? (
                  <span className="text-caramel">Preview: {activeRole}</span>
                ) : (
                  `${activeRole} role`
                )}
              </p>
              <p className="text-[10px] text-gray-400 truncate">{userEmail || 'Staff'}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={isPending}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-gray-500 rounded-xl hover:bg-vermillion/5 hover:text-vermillion transition-all disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 shrink-0">
          {/* Mobile logo */}
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

          {/* Desktop breadcrumb */}
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-gray-500">
            <span>Portal</span>
            <span>/</span>
            <span className="text-gray-900 font-bold capitalize">
              {pathname === '/' ? 'Overview' : pathname.replace('/', '')}
            </span>
          </div>

          {/* Right side: Admin Preview Mode + mobile sign out */}
          <div className="flex items-center gap-3">
            {/* Preview Mode — Admin Only */}
            {isActualAdmin && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                <Eye className="h-3.5 w-3.5 text-amber-600" />
                <label
                  htmlFor="preview-role-switcher"
                  className="text-[10px] font-black uppercase text-amber-600 tracking-wider"
                >
                  Preview:
                </label>
                <select
                  id="preview-role-switcher"
                  value={activeRole}
                  onChange={handlePreviewChange}
                  disabled={isPending}
                  className="bg-transparent text-xs font-bold text-jetblack focus:outline-none cursor-pointer"
                >
                  <option value="admin">Admin (own view)</option>
                  <option value="finance">Finance Staff</option>
                  <option value="warehouse">Warehouse Staff</option>
                </select>
              </div>
            )}

            {/* Mobile sign out */}
            <button
              onClick={handleSignOut}
              disabled={isPending}
              className="md:hidden flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-vermillion transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
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
