import React, { useMemo } from "react";

import { Calendar, LocationEdit, Sun } from "lucide-react";
import { useSecurityUsers } from "../hooks/users/useUsers";
import { usePatrolSchedules } from "../hooks/schedule/usePatrolSchedules";
import { usePatrolPoints } from "../hooks/patrol-point/usePatrolPoints";
import { UserGearIcon, WarningIcon } from "@phosphor-icons/react";
import MapsCheckpoint from "./mapsCheckpoint/MapsCheckpoint";

export const DashboardView = () => {
  const { data: security } = useSecurityUsers();
  const { data: checkpoints } = usePatrolPoints();
  const { data: shift } = usePatrolSchedules();
  console.log("SECURITY", JSON.stringify(security, null, 2));

  const shiftActive = shift?.data.find((s) => s.name);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  const summaryCardData = [
    {
      title: "Total Security",
      value: security?.data.length,
      type: "Security",
      icon: <UserGearIcon size={22} color="#2563EB" />,
      bg: "bg-blue-50",
    },
    {
      title: "Jumlah Area Patrol",
      value: checkpoints?.length,
      type: "Area",
      icon: <LocationEdit size={22} color="#4F46E5" />,
      bg: "bg-indigo-50",
    },
    {
      title: "Jumlah Temuan Patrol",
      value: 5,
      type: "Temuan",
      icon: <WarningIcon size={22} color="#DC2626" />,
      bg: "bg-red-50",
    },
  ];
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-4 border-b pb-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Peta Titik Patroli
              </h1>
              <p className="text-sm text-muted-foreground">
                Pemantauan kepatuhan patroli keamanan dan pengawasan perimeter
                operasional secara real-time.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:items-center justify-start">
          <div className="flex shrink-0 lg:items-center gap-2 md:mt-5 sm:mt-5 xs:mt-5">
            {/* Date */}
            <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              <Calendar size={17} color="#6B7280" />

              <div>
                <p className="text-[11px] text-gray-400">Periode</p>

                <p className="text-xs font-semibold text-gray-700">
                  {todayFormatted ?? "Hari Ini"}
                </p>
              </div>
            </div>

            {/* Shift */}
            <div className=" flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              <Sun size={17} color="#6B7280" />

              <div>
                <p className="text-[11px] text-gray-400">Shift Aktif</p>
                {(shift?.data.length ?? 0 > 0) ? (
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-semibold text-gray-700">
                      {shiftActive?.name}
                    </p>
                    <div className="h-[1px] p-0.5 rounded-full bg-emerald-500 animate-ping" />
                    <p className="text-xs font-semibold text-gray-700">
                      {shiftActive?.startTime} - {shiftActive?.endTime}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Belum ada shift</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid sm:grid-cols-2 gap-3 md:grid-cols-3">
        {/* Total Patrol */}
        {summaryCardData.map((item) => (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {item.title}
                </p>

                <div className="mt-5 flex items-end gap-1">
                  <h1 className="text-2xl font-bold text-gray-800">
                    {item.value}
                  </h1>

                  <p className="mb-0.5 text-sm text-gray-500 ml-1">
                    {item.type}
                  </p>
                </div>
              </div>

              <div className={`rounded-lg p-2.5 ${item.bg}`}>{item.icon}</div>
            </div>

            {/* <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">Target</span>

                  <span className="text-xs font-medium text-gray-600">
                    40 officers
                  </span>
                </div>

                <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-600">
                  +2 above target
                </span>
              </div> */}
          </div>
        ))}

        {/* Active Checkpoints */}
        {/* <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Active Patrol Checkpoints
                </p>

                <div className="mt-5 flex items-end gap-1">
                  <h1 className="text-2xl font-bold text-gray-800">128</h1>

                  <p className="mb-0.5 text-sm text-gray-500">Points</p>
                </div>
              </div>

              <div className="rounded-lg bg-indigo-50 p-2.5">
                <Location size={22} color="#4F46E5" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">Status</span>

                <span className="text-xs font-medium text-gray-600">
                  All systems active
                </span>
              </div>

              <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600">
                128 / 128
              </span>
            </div>
          </div> */}

        {/* Out Of Radius Alert */}
        {/* <div className="rounded-lg border border-red-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Out-Of-Radius Alert
                </p>

                <div className="mt-5 flex items-end gap-1">
                  <h1 className="text-2xl font-bold text-red-600">2</h1>

                  <p className="mb-0.5 text-sm text-gray-500">Incidents</p>
                </div>
              </div>

              <div className="rounded-lg bg-red-50 p-2.5">
                <Warning2 size={22} color="#DC2626" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">
                  Requires attention
                </span>
              </div>

              <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
                2 Active
              </span>
            </div>
          </div> */}
      </div>

      <div className="mx-auto max-w-7xl mt-5">
        <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">
            Monitoring Area Patroli
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Pantau lokasi dan checkpoint patroli satpam.
          </p>
          <MapsCheckpoint />
        </div>
      </div>
    </div>
  );
};
