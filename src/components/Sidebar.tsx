import {
  ArrowLeftRight,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  ChartNoAxesCombined,
  ClipboardCheck,
  History,
  LayoutDashboard,
  MapPin,
  Nfc,
  Route,
  ShieldCheck,
  TriangleAlert,
  UserRoundX,
  Users,
} from "lucide-react";

import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import logo from "@/src/assets/logo.png";

export type NavTab =
  | "dashboard"
  | "monitoring"
  | "jadwal"
  | "kalender"
  | "tambah-jadwal"
  | "tukar-shift"
  | "cuti-izin"
  | "titik"
  | "riwayat"
  | "temuan"
  | "nfc"
  | "pengguna"
  | "question-builder"
  | "analytic-audit"
  | "manajemen-ronde";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeIncidentsCount?: number;
  openFindingsCount: number;
}

interface MenuItem {
  id: NavTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
  count?: number;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export function Sidebar({
  currentTab,
  onSelectTab,
  activeIncidentsCount = 0,
  openFindingsCount,
}: SidebarProps) {
  const groups: MenuGroup[] = [
    {
      label: "Dasbor",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: "Master Data",
      items: [
        {
          id: "pengguna",
          label: "Pengguna",
          icon: Users,
        },
        {
          id: "titik",
          label: "Titik Patroli",
          icon: MapPin,
        },
        {
          id: "nfc",
          label: "Perangkat NFC",
          icon: Nfc,
        },
        {
          id: "question-builder",
          label: "Checklist",
          icon: ClipboardCheck,
        },
      ],
    },
    {
      label: "Operasional Patroli",
      items: [
        {
          id: "tambah-jadwal",
          label: "Buat Jadwal",
          icon: CalendarPlus,
        },
        {
          id: "jadwal",
          label: "Jadwal Patroli",
          icon: CalendarDays,
        },
        {
          id: "kalender",
          label: "Kalender",
          icon: CalendarRange,
        },
        {
          id: "tukar-shift",
          label: "Tukar Shift",
          icon: ArrowLeftRight,
          badge: "Swap",
        },
        {
          id: "cuti-izin",
          label: "Cuti & Izin",
          icon: UserRoundX,
          badge: "Izin",
        },
        {
          id: "manajemen-ronde",
          label: "Manajemen Ronde",
          icon: Route,
        },
        {
          id: "temuan",
          label: "Temuan",
          icon: TriangleAlert,
          count: openFindingsCount,
        },
      ],
    },
    {
      label: "Manajemen Sistem",
      items: [
        {
          id: "riwayat",
          label: "Riwayat Patroli",
          icon: History,
        },
        {
          id: "monitoring",
          label: "Monitoring",
          icon: ChartNoAxesCombined,
          count: activeIncidentsCount,
        },
        {
          id: "analytic-audit",
          label: "Analitik & Audit",
          icon: ShieldCheck,
        },
      ],
    },
  ];

  return (
    <ShadcnSidebar
      collapsible="icon"
      className="border-r border-[#263653] text-white"
    >
      {/* HEADER / BRAND */}
      <SidebarHeader className="p-3">
        <div className="flex h-10 items-center gap-3 overflow-hidden group-data-[collapsible=icon]:justify-center">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden">
            <img
              src={logo}
              alt="PAMAREA Logo"
              className="size-full object-contain"
            />
          </div>

          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-bold tracking-wide text-white">
              PAMAREA
            </p>
            <p className="truncate text-[9px] tracking-[0.14em] text-slate-400">
              ENTERPRISE SECURITY
            </p>
          </div>
        </div>
      </SidebarHeader>

      <Separator className="bg-[#263653] group-data-[collapsible=icon]:hidden" />

      {/* MENU */}
      <SidebarContent className=" py-3">
        {groups.map((group) => (
          <SidebarGroup
            key={group.label}
            className="py-2 group-data-[collapsible=icon]:py-1"
          >
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 group-data-[collapsible=icon]:hidden">
              {group.label}
            </SidebarGroupLabel>

            <SidebarMenu className="gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <SidebarMenuItem
                    key={item.id}
                    className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                  >
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      onClick={() => onSelectTab(item.id)}
                      className="
    h-10 rounded-lg px-3
    text-slate-300
    transition-all duration-200

    hover:bg-[#0B3B60]
    hover:text-white

    data-[active=true]:!bg-blue-600
    data-[active=true]:!text-orange-500
    data-[active=true]:!font-semibold
    data-[active=true]:shadow-sm

    group-data-[collapsible=icon]:!size-10
    group-data-[collapsible=icon]:!justify-center
    group-data-[collapsible=icon]:!px-0
  "
                    >
                      <Icon
                        className={`
      size-[18px] shrink-0
      ${isActive ? "text-orange-600" : "text-slate-400"}
    `}
                      />

                      <span
                        className={`${isActive ? "text-orange-600" : "text-slate-400"} truncate group-data-[collapsible=icon]:hidden`}
                      >
                        {item.label}
                      </span>
                    </SidebarMenuButton>

                    {typeof item.count === "number" && item.count > 0 && (
                      <SidebarMenuBadge
                        className="
                            border-0 bg-red-500/15 text-red-400
                            group-data-[collapsible=icon]:hidden
                          "
                      >
                        {item.count > 99 ? "99+" : item.count}
                      </SidebarMenuBadge>
                    )}

                    {item.badge && (
                      <SidebarMenuBadge
                        className="
                          border-0 bg-slate-700 text-slate-300
                          group-data-[collapsible=icon]:hidden
                        "
                      >
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter className="p-3">
        <Separator className="mb-3 bg-[#263653] group-data-[collapsible=icon]:hidden" />

        {/* Expanded footer */}
        <div className="flex items-center justify-between gap-2 px-2 group-data-[collapsible=icon]:hidden">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-300">PAMAREA v2.4.1</p>
            <p className="mt-1 text-[10px] text-slate-500">
              Production · ID-JKT
            </p>
          </div>

          <Badge
            variant="outline"
            className="shrink-0 border-emerald-800 bg-emerald-950/40 text-[10px] text-emerald-400"
          >
            <span className="mr-1.5 size-1.5 rounded-full bg-emerald-400" />
            Online
          </Badge>
        </div>

        {/* Collapsed footer */}
        <div className="hidden h-8 items-center justify-center group-data-[collapsible=icon]:flex">
          <div
            className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
            title="System Online"
          />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </ShadcnSidebar>
  );
}
