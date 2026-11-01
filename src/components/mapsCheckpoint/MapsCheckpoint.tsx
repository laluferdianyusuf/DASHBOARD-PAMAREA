import { useEffect, useMemo, useState } from "react";

import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import {
  AlertCircle,
  CheckCircle2,
  Circle,
  MapPin,
  RotateCcw,
  Search,
  Wifi,
} from "lucide-react";

import type { PatrolPointResponse } from "@/src/types/patrol-point/patrolPoint";
import { usePatrolPoints } from "../../hooks/patrol-point/usePatrolPoints";

interface MapsCheckpointProps {
  siteId?: string;
}

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

const createMarkerIcon = (active: boolean) => {
  return L.divIcon({
    className: "checkpoint-marker-wrapper",
    html: `
      <div style="
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        border-radius: 50%;
        background: ${active ? "#16A34A" : "#9CA3AF"};
        color: white;
        font-size: 12px;
        font-weight: 700;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      ">
        ●
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

interface MapControllerProps {
  selectedCheckpoint: PatrolPointResponse | null;
}

function MapController({ selectedCheckpoint }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!selectedCheckpoint) return;

    const latitude = Number(selectedCheckpoint.latitude);
    const longitude = Number(selectedCheckpoint.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return;
    }

    map.flyTo([latitude, longitude], 18, {
      animate: true,
      duration: 0.8,
    });
  }, [
    map,
    selectedCheckpoint?.id,
    selectedCheckpoint?.latitude,
    selectedCheckpoint?.longitude,
  ]);

  return null;
}

function MapLoading() {
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-56" />
        </CardHeader>

        <CardContent className="p-3">
          <Skeleton className="h-[450px] w-full rounded-md" />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="space-y-3 border-b">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-3 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function MapsCheckpoint({ siteId }: MapsCheckpointProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("ALL");

  const [selectedCheckpoint, setSelectedCheckpoint] =
    useState<PatrolPointResponse | null>(null);

  const {
    data: patrolPoints,
    isPending,
    isError,
    error,
  } = usePatrolPoints(siteId ? { siteId } : undefined);

  const checkpoints = useMemo<PatrolPointResponse[]>(() => {
    return Array.isArray(patrolPoints) ? patrolPoints : [];
  }, [patrolPoints]);

  const filteredCheckpoints = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return checkpoints.filter((item) => {
      const matchesStatus =
        filterStatus === "ALL" || item.status === filterStatus;

      const matchesSearch =
        !keyword ||
        item.name?.toLowerCase().includes(keyword) ||
        item.code?.toLowerCase().includes(keyword) ||
        item.description?.toLowerCase().includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [checkpoints, filterStatus, searchQuery]);

  const validCheckpoints = useMemo(() => {
    return filteredCheckpoints.filter((item) => {
      const latitude = Number(item.latitude);
      const longitude = Number(item.longitude);

      return (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
      );
    });
  }, [filteredCheckpoints]);

  const center = useMemo<[number, number]>(() => {
    if (validCheckpoints.length > 0) {
      return [
        Number(validCheckpoints[0].latitude),
        Number(validCheckpoints[0].longitude),
      ];
    }

    return [-8.421514, 116.707336];
  }, [validCheckpoints]);

  const activeCount = checkpoints.filter(
    (item) => item.status === "ACTIVE",
  ).length;

  const inactiveCount = checkpoints.filter(
    (item) => item.status === "INACTIVE",
  ).length;

  const handleResetFilter = () => {
    setSearchQuery("");
    setFilterStatus("ALL");
  };

  if (isPending) {
    return <MapLoading />;
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="size-4" />

        <AlertTitle>Gagal memuat checkpoint</AlertTitle>

        <AlertDescription>
          {error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat mengambil data dari server."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* MAP */}

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-3 border-b px-4 py-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold">
                Peta Patroli
              </CardTitle>

              <p className="text-xs text-muted-foreground">
                Lokasi pemeriksaan area operasional
              </p>
            </div>

            <Badge variant="secondary" className="font-medium">
              {validCheckpoints.length} Lokasi
            </Badge>
          </CardHeader>

          <CardContent className="p-0">
            <div className="relative z-0 isolate h-[450px] w-full">
              <MapContainer
                center={center}
                zoom={18}
                minZoom={5}
                maxZoom={20}
                scrollWheelZoom
                className="h-full w-full"
              >
                <TileLayer
                  attribution="Tiles © Esri"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxNativeZoom={18}
                  maxZoom={20}
                />

                <MapController selectedCheckpoint={selectedCheckpoint} />

                {validCheckpoints.map((item) => {
                  const isActive = item.status === "ACTIVE";

                  return (
                    <Marker
                      key={item.id}
                      position={[Number(item.latitude), Number(item.longitude)]}
                      icon={createMarkerIcon(isActive)}
                      eventHandlers={{
                        click: () => setSelectedCheckpoint(item),
                      }}
                    >
                      <Popup>
                        <div className="min-w-[180px] space-y-2">
                          <div>
                            <p className="text-sm font-semibold">{item.name}</p>

                            <p className="text-xs text-gray-500">{item.code}</p>
                          </div>

                          <Separator />

                          <p className="text-xs">
                            {item.description || "Tidak ada deskripsi"}
                          </p>

                          <Badge
                            className={
                              isActive
                                ? "bg-green-600 hover:bg-green-600"
                                : "bg-gray-500 hover:bg-gray-500"
                            }
                          >
                            {isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>

            {/* LEGEND */}

            <div className="flex flex-wrap items-center gap-5 border-t px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-2.5 rounded-full bg-green-600" />
                Aktif
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-2.5 rounded-full bg-gray-400" />
                Nonaktif
              </div>

              <div className="ml-auto text-xs text-muted-foreground">
                {validCheckpoints.length} marker
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CHECKPOINT LIST */}

        <Card className="flex min-h-0 flex-col overflow-hidden">
          <CardHeader className="space-y-3 border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold">
                  Daftar Titik Patroli
                </CardTitle>

                <p className="text-xs text-muted-foreground">
                  {filteredCheckpoints.length} checkpoint ditemukan
                </p>
              </div>

              <Badge variant="secondary">{filteredCheckpoints.length}</Badge>
            </div>

            {/* SEARCH */}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari checkpoint..."
                className="h-9 pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={filterStatus}
                onValueChange={(value) =>
                  setFilterStatus(value as StatusFilter)
                }
              >
                <SelectTrigger className="h-9 flex-1 text-xs">
                  <SelectValue placeholder="Filter status">
                    {{
                      ALL: "Semua Status",
                      ACTIVE: "Aktif",
                      INACTIVE: "Nonaktif",
                    }[filterStatus] ?? "Filter status"}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="ACTIVE">Aktif</SelectItem>
                  <SelectItem value="INACTIVE">Nonaktif</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={handleResetFilter}
                title="Reset filter"
              >
                <RotateCcw className="size-4" />
              </Button>
            </div>
          </CardHeader>

          {/* LIST */}

          <CardContent className="min-h-0 flex-1 p-0">
            {filteredCheckpoints.length === 0 ? (
              <div className="flex min-h-[250px] flex-col items-center justify-center gap-2 p-6 text-center">
                <MapPin className="size-8 text-muted-foreground/40" />

                <p className="text-sm font-medium">Tidak ada checkpoint</p>

                <p className="text-xs text-muted-foreground">
                  Coba ubah filter atau kata pencarian.
                </p>

                <Button variant="outline" size="sm" onClick={handleResetFilter}>
                  Reset Filter
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[450px]">
                <div className="divide-y">
                  {filteredCheckpoints.map((checkpoint) => {
                    const isSelected = selectedCheckpoint?.id === checkpoint.id;

                    const isActive = checkpoint.status === "ACTIVE";

                    return (
                      <button
                        key={checkpoint.id}
                        type="button"
                        onClick={() => setSelectedCheckpoint(checkpoint)}
                        className={`flex w-full items-start gap-3 border-l-2 p-3 text-left transition-colors ${
                          isSelected
                            ? "border-l-primary bg-primary/5"
                            : "border-l-transparent hover:bg-muted/50"
                        }`}
                      >
                        <span
                          className={`mt-1.5 size-2.5 shrink-0 rounded-full ${
                            isActive ? "bg-green-600" : "bg-gray-400"
                          }`}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[10px] font-semibold text-primary">
                              {checkpoint.code}
                            </span>

                            <Badge
                              variant="outline"
                              className={`h-5 px-1.5 text-[9px] ${
                                isActive
                                  ? "border-green-200 bg-green-50 text-green-700"
                                  : "border-gray-200 bg-gray-50 text-gray-600"
                              }`}
                            >
                              {isActive ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </div>

                          <p className="mt-1 truncate text-xs font-semibold">
                            {checkpoint.name}
                          </p>

                          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Wifi className="size-3 shrink-0" />

                            <span className="truncate">
                              {checkpoint.description || "Tidak ada deskripsi"}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-muted">
            <MapPin className="size-4 text-muted-foreground" />
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Total Checkpoint</p>

            <p className="text-lg font-semibold tabular-nums">
              {checkpoints.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-green-50">
            <CheckCircle2 className="size-4 text-green-600" />
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Checkpoint Aktif</p>

            <p className="text-lg font-semibold tabular-nums">{activeCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-muted">
            <Circle className="size-4 text-muted-foreground" />
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Checkpoint Nonaktif</p>

            <p className="text-lg font-semibold tabular-nums">
              {inactiveCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
