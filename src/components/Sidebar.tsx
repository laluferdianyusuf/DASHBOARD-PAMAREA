import {
  ArrowLeftRight,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  ChartNoAxesCombined,
  ClipboardCheck,
  History,
  LayoutDashboard,
  Loader2,
  LucideLogOut,
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

import { Separator } from "@/components/ui/separator";
import logo from "@/src/assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useLogout } from "../hooks/auth";
import { UserResponse } from "../types";

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
  user: UserResponse;
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

export function Sidebar({ currentTab, onSelectTab, user }: SidebarProps) {
  const { mutate: logout, isPending } = useLogout();
  const navigate = useNavigate();

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
        },
        {
          id: "cuti-izin",
          label: "Cuti & Izin",
          icon: UserRoundX,
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
          label: "Real-time Monitoring",
          icon: ChartNoAxesCombined,
        },
        {
          id: "analytic-audit",
          label: "Analitik & Audit",
          icon: ShieldCheck,
        },
      ],
    },
  ];

  const clearLocalSession = () => {
    navigate("/login", { replace: true });

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("access_token");
  };

  const handleLogout = () => {
    if (isPending) return;

    logout(undefined, {
      onSuccess: () => {
        clearLocalSession();
      },
      onError: (error) => {
        console.error("Logout API gagal:", error);
        clearLocalSession();
      },
    });
  };

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
              className="h-12 w-auto object-contain"
            />
          </div>

          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-bold tracking-wide text-white">
              PAMAREA
            </p>
            <p className="text-xs font-semibold uppercase text-[#009EDA]">
              Command Center
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
                          border-0 text-orange-600
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

        <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#17466B] text-xs font-semibold text-white">
            {user.fullName
              ?.split(" ")
              .slice(0, 2)
              .map((name) => name.charAt(0))
              .join("")
              .toUpperCase() || "U"}
          </div>

          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium text-white">
              {user.fullName || "Pengguna"}
            </p>
            <p className="truncate text-xs text-slate-400">
              {user.role && user.role.name === "ADMIN"
                ? "Administrator"
                : (user.role?.name ?? "Login")}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isPending}
            title="Logout"
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50 group-data-[collapsible=icon]:hidden"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LucideLogOut size={17} />
            )}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isPending}
            title="Logout"
            className="hidden size-9 items-center justify-center rounded-md text-slate-400 hover:bg-red-500/10 hover:text-red-400 group-data-[collapsible=icon]:flex"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LucideLogOut size={17} />
            )}
          </button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </ShadcnSidebar>
  );
}
