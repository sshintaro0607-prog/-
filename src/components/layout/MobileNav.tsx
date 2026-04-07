"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Users, BarChart2, Settings } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/dashboard", label: "ホーム", icon: <LayoutDashboard size={20} /> },
    { href: "/handovers", label: "引継書", icon: <FileText size={20} /> },
    { href: "/students", label: "生徒", icon: <Users size={20} /> },
    { href: "/reports", label: "レポート", icon: <BarChart2 size={20} /> },
    ...(isAdmin ? [{ href: "/admin/users", label: "管理", icon: <Settings size={20} /> }] : []),
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors ${
                active ? "text-blue-600" : "text-gray-500"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
