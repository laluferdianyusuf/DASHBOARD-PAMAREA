import { useMemo } from "react";

import { CalendarDays, Clock, MapPin, ShieldCheck, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { usePatrolPoints } from "../hooks/patrol-point/usePatrolPoints";
import { usePatrolSchedules } from "../hooks/schedule/usePatrolSchedules";
import { useSecurityUsers } from "../hooks/users/useUsers";

import MapsCheckpoint from "./mapsCheckpoint/MapsCheckpoint";

interface SummaryItem {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  iconClassName: string;
}

export const DashboardView = () => {
  const { data: security, isPending: securityLoading } = useSecurityUsers();

  const { data: checkpoints, isPending: checkpointsLoading } =
    usePatrolPoints();

  const { data: shift, isPending: shiftLoading } = usePatrolSchedules();

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }, []);

  const securityCount = security?.data?.length ?? 0;
  const checkpointCount = checkpoints?.length ?? 0;

  const activeCheckpointCount =
    checkpoints?.filter((item) => item.status === "ACTIVE").length ?? 0;

  const shiftActive = shift?.data?.find((item) => item.name);

  const summaryCardData: SummaryItem[] = [
    {
      title: "Total Security",
      value: securityCount,
      description: "Security terdaftar",
      icon: <Users className="size-5" />,
      iconClassName: "bg-blue-50 text-blue-600",
    },
    {
      title: "Total Checkpoint",
      value: checkpointCount,
      description: `${activeCheckpointCount} checkpoint aktif`,
      icon: <MapPin className="size-5" />,
      iconClassName: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Checkpoint Aktif",
      value: activeCheckpointCount,
      description: "Lokasi patroli aktif",
      icon: <ShieldCheck className="size-5" />,
      iconClassName: "bg-green-50 text-green-600",
    },
  ];

  const isSummaryLoading = securityLoading || checkpointsLoading;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Peta & Titik Patrol
          </h1>

          <p className="text-sm text-muted-foreground">
            Pemantauan kepatuhan patroli dan pengawasan area operasional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded border bg-card px-3 py-2">
            <CalendarDays className="size-4 text-muted-foreground" />

            <div>
              <p className="text-[10px] text-muted-foreground">Periode</p>

              <p className="text-xs font-medium capitalize">{todayFormatted}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded border bg-card px-3 py-2">
            <Clock className="size-4 text-muted-foreground" />

            <div>
              <p className="text-[10px] text-muted-foreground">Shift</p>

              {shiftLoading ? (
                <Skeleton className="mt-1 h-3 w-24" />
              ) : shiftActive ? (
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium">{shiftActive.name}</p>

                  {!shiftLoading && shiftActive && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {shiftActive.startTime} - {shiftActive.endTime}
                    </p>
                  )}
                  <Badge
                    variant="outline"
                    className="border-green-200 bg-green-50 px-1.5 py-0 text-[9px] text-green-700"
                  >
                    Aktif
                  </Badge>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Belum ada shift</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCardData.map((item) => (
          <Card key={item.title}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </p>

                {isSummaryLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-semibold tracking-tight tabular-nums">
                    {item.value}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>

              <div
                className={`flex size-11 items-center justify-center rounded-lg ${item.iconClassName}`}
              >
                {item.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <MapsCheckpoint />
    </div>
  );
};
