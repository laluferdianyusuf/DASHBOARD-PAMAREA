import { useEffect, useMemo, useState } from "react";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";

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
  X,
} from "lucide-react";

import type { PatrolPointResponse } from "@/src/types/patrol-point/patrolPoint";
import { usePatrolPoints } from "../../hooks/patrol-point/usePatrolPoints";

interface MapsCheckpointProps {
  siteId?: string;
}

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

interface CheckpointGroup {
  key: string;
  latitude: number;
  longitude: number;
  items: PatrolPointResponse[];
}

const getCoordinateKey = (latitude: number, longitude: number) => {
  return `${latitude.toFixed(7)}:${longitude.toFixed(7)}`;
};

const createMarkerIcon = (active: boolean, findingCount: number) => {
  return L.divIcon({
    className: "checkpoint-marker-wrapper",
    html: `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
      ">
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

        ${
          findingCount > 0
            ? `
              <div style="
                position: absolute;
                top: -7px;
                right: -7px;
                min-width: 20px;
                height: 20px;
                padding: 0 5px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid white;
                border-radius: 999px;
                background: #DC2626;
                color: white;
                font-size: 10px;
                font-weight: 800;
                box-shadow: 0 2px 5px rgba(0,0,0,0.25);
              ">
                ${findingCount > 99 ? "99+" : findingCount}
              </div>
            `
            : ""
        }
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

const createStackIcon = (count: number) => {
  return L.divIcon({
    className: "checkpoint-stack-wrapper",
    html: `
      <div style="
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 4px solid white;
        border-radius: 50%;
        background: #2563EB;
        color: white;
        font-size: 15px;
        font-weight: 800;
        box-shadow: 0 3px 12px rgba(0,0,0,0.35);
        cursor: pointer;
      ">
        ${count}
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -20],
  });
};

const getSpreadPosition = (
  latitude: number,
  longitude: number,
  index: number,
  total: number,
): [number, number] => {
  const radiusInMeters = total <= 3 ? 7 : total <= 5 ? 10 : 13;

  const angle = (2 * Math.PI * index) / total - Math.PI / 2;

  const northOffset = Math.cos(angle) * radiusInMeters;
  const eastOffset = Math.sin(angle) * radiusInMeters;

  const latitudeOffset = northOffset / 111320;

  const longitudeOffset =
    eastOffset / (111320 * Math.cos((latitude * Math.PI) / 180));

  return [latitude + latitudeOffset, longitude + longitudeOffset];
};

function CheckpointTooltip({ item }: { item: PatrolPointResponse }) {
  const findingCount = item._count?.findings ?? 0;
  const isActive = item.status === "ACTIVE";

  return (
    <Tooltip
      direction="top"
      offset={[0, -12]}
      opacity={1}
      sticky={false}
      className="checkpoint-tooltip"
    >
      <div className="min-w-[170px] space-y-2 p-1">
        <div>
          <p className="text-xs font-semibold text-gray-900">{item.name}</p>

          <p className="text-[10px] text-gray-500">{item.code}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span
            className={`text-[10px] font-semibold ${
              isActive ? "text-green-600" : "text-gray-500"
            }`}
          >
            {isActive ? "● Aktif" : "● Nonaktif"}
          </span>

          {findingCount > 0 ? (
            <span className="text-[10px] font-semibold text-red-600">
              {findingCount} Temuan
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-green-600">
              Aman
            </span>
          )}
        </div>
      </div>
    </Tooltip>
  );
}

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

    map.flyTo([latitude, longitude], 19, {
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

interface MapClickHandlerProps {
  onMapClick: () => void;
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click: () => {
      onMapClick();
    },
  });

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
          <Skeleton className="h-[450px] w-full rounded" />
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

  const [expandedGroupKey, setExpandedGroupKey] = useState<string | null>(null);

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

  const coordinateGroups = useMemo<CheckpointGroup[]>(() => {
    const groups = new Map<string, CheckpointGroup>();

    validCheckpoints.forEach((item) => {
      const latitude = Number(item.latitude);
      const longitude = Number(item.longitude);

      const key = getCoordinateKey(latitude, longitude);

      const existingGroup = groups.get(key);

      if (existingGroup) {
        existingGroup.items.push(item);
      } else {
        groups.set(key, {
          key,
          latitude,
          longitude,
          items: [item],
        });
      }
    });

    return Array.from(groups.values());
  }, [validCheckpoints]);

  const overlappingGroups = useMemo(() => {
    return coordinateGroups.filter((group) => group.items.length > 1);
  }, [coordinateGroups]);

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

  const totalFindings = checkpoints.reduce(
    (total, item) => total + (item._count?.findings ?? 0),
    0,
  );

  const checkpointsWithFindings = checkpoints.filter(
    (item) => (item._count?.findings ?? 0) > 0,
  ).length;

  const handleResetFilter = () => {
    setSearchQuery("");
    setFilterStatus("ALL");
    setExpandedGroupKey(null);
    setSelectedCheckpoint(null);
  };

  const handleSelectCheckpoint = (checkpoint: PatrolPointResponse) => {
    setSelectedCheckpoint(checkpoint);

    const latitude = Number(checkpoint.latitude);
    const longitude = Number(checkpoint.longitude);

    const key = getCoordinateKey(latitude, longitude);

    const group = coordinateGroups.find((item) => item.key === key);

    if (group && group.items.length > 1) {
      setExpandedGroupKey(key);
    }
  };

  useEffect(() => {
    if (!selectedCheckpoint) return;

    const latitude = Number(selectedCheckpoint.latitude);
    const longitude = Number(selectedCheckpoint.longitude);

    const key = getCoordinateKey(latitude, longitude);

    const group = coordinateGroups.find((item) => item.key === key);

    if (group && group.items.length > 1) {
      setExpandedGroupKey(key);
    }
  }, [selectedCheckpoint, coordinateGroups]);

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

                <MapClickHandler onMapClick={() => setExpandedGroupKey(null)} />

                {coordinateGroups.map((group) => {
                  const isExpanded = expandedGroupKey === group.key;

                  if (group.items.length === 1) {
                    const item = group.items[0];

                    const isActive = item.status === "ACTIVE";
                    const findingCount = item._count?.findings ?? 0;

                    return (
                      <Marker
                        key={item.id}
                        position={[group.latitude, group.longitude]}
                        icon={createMarkerIcon(isActive, findingCount)}
                        eventHandlers={{
                          click: () => setSelectedCheckpoint(item),
                        }}
                      >
                        <CheckpointTooltip item={item} />

                        <Popup>
                          <div className="min-w-[190px] space-y-2">
                            <div>
                              <p className="text-sm font-semibold">
                                {item.name}
                              </p>

                              <p className="text-xs text-gray-500">
                                {item.code}
                              </p>
                            </div>

                            <Separator />

                            <p className="text-xs">
                              {item.description || "Tidak ada deskripsi"}
                            </p>

                            <div className="flex items-center justify-between gap-2">
                              <Badge
                                className={
                                  isActive
                                    ? "bg-green-600 hover:bg-green-600"
                                    : "bg-gray-500 hover:bg-gray-500"
                                }
                              >
                                {isActive ? "Aktif" : "Nonaktif"}
                              </Badge>

                              {findingCount > 0 ? (
                                <Badge variant="destructive">
                                  <AlertCircle className="mr-1 size-3" />
                                  {findingCount} Temuan
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-green-200 bg-green-50 text-green-700"
                                >
                                  <CheckCircle2 className="mr-1 size-3" />
                                  Tidak Ada Temuan
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  }

                  if (!isExpanded) {
                    return (
                      <Marker
                        key={group.key}
                        position={[group.latitude, group.longitude]}
                        icon={createStackIcon(group.items.length)}
                        eventHandlers={{
                          click: () => setExpandedGroupKey(group.key),
                        }}
                      >
                        <Tooltip direction="top" offset={[0, -15]} opacity={1}>
                          <div className="min-w-[190px] space-y-1">
                            <p className="text-xs font-semibold">
                              {group.items.length} Checkpoint Bertumpuk
                            </p>

                            {group.items.map((item) => (
                              <p key={item.id} className="text-[10px]">
                                <span className="font-semibold">
                                  {item.code}
                                </span>
                                {" - "}
                                {item.name}
                              </p>
                            ))}

                            <p className="pt-1 text-[10px] font-semibold text-blue-600">
                              Klik untuk melihat semua checkpoint
                            </p>
                          </div>
                        </Tooltip>

                        <Popup>
                          <div className="min-w-[190px] space-y-2">
                            <p className="text-sm font-semibold">
                              {group.items.length} Checkpoint Bertumpuk
                            </p>

                            <p className="text-xs text-gray-500">
                              Pilih tombol di bawah untuk melihat setiap
                              checkpoint.
                            </p>

                            <Separator />

                            <div className="space-y-1">
                              {group.items.map((item) => (
                                <p key={item.id} className="text-xs">
                                  <span className="font-mono font-semibold">
                                    {item.code}
                                  </span>
                                  {" - "}
                                  {item.name}
                                </p>
                              ))}
                            </div>

                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => setExpandedGroupKey(group.key)}
                            >
                              Tampilkan Semua Checkpoint
                            </Button>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  }

                  return group.items.map((item, index) => {
                    const isActive = item.status === "ACTIVE";
                    const findingCount = item._count?.findings ?? 0;

                    const position = getSpreadPosition(
                      group.latitude,
                      group.longitude,
                      index,
                      group.items.length,
                    );

                    return (
                      <Marker
                        key={item.id}
                        position={position}
                        icon={createMarkerIcon(isActive, findingCount)}
                        eventHandlers={{
                          click: () => setSelectedCheckpoint(item),
                        }}
                      >
                        <CheckpointTooltip item={item} />

                        <Popup>
                          <div className="min-w-[190px] space-y-2">
                            <div>
                              <p className="text-sm font-semibold">
                                {item.name}
                              </p>

                              <p className="text-xs text-gray-500">
                                {item.code}
                              </p>
                            </div>

                            <Separator />

                            <p className="text-xs">
                              {item.description || "Tidak ada deskripsi"}
                            </p>

                            <div className="flex items-center justify-between gap-2">
                              <Badge
                                className={
                                  isActive
                                    ? "bg-green-600 hover:bg-green-600"
                                    : "bg-gray-500 hover:bg-gray-500"
                                }
                              >
                                {isActive ? "Aktif" : "Nonaktif"}
                              </Badge>

                              {findingCount > 0 ? (
                                <Badge variant="destructive">
                                  <AlertCircle className="mr-1 size-3" />
                                  {findingCount} Temuan
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-green-200 bg-green-50 text-green-700"
                                >
                                  <CheckCircle2 className="mr-1 size-3" />
                                  Tidak Ada Temuan
                                </Badge>
                              )}
                            </div>

                            <p className="text-[10px] text-gray-500">
                              Posisi marker disebarkan secara visual. Koordinat
                              GPS asli tetap tersimpan.
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  });
                })}
              </MapContainer>

              {expandedGroupKey && (
                <div className="absolute right-3 top-3 z-[1000]">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-2 shadow-md"
                    onClick={() => setExpandedGroupKey(null)}
                  >
                    <X className="size-4" />
                    Tutup Sebaran
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-5 border-t px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-2.5 rounded-full bg-green-600" />
                Aktif
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-2.5 rounded-full bg-gray-400" />
                Nonaktif
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-2.5 rounded-full bg-red-600" />
                Memiliki Temuan
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex size-2.5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white"></span>
                Marker bertumpuk
              </div>

              <div className="ml-auto text-xs text-muted-foreground">
                {validCheckpoints.length} marker
              </div>
            </div>
          </CardContent>
        </Card>

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

                    const findingCount = checkpoint._count?.findings ?? 0;

                    return (
                      <button
                        key={checkpoint.id}
                        type="button"
                        onClick={() => handleSelectCheckpoint(checkpoint)}
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

                          <div className="mt-1 flex items-center justify-between gap-2">
                            <p className="truncate text-xs font-semibold">
                              {checkpoint.name}
                            </p>

                            {findingCount > 0 && (
                              <Badge
                                variant="destructive"
                                className="h-5 shrink-0 gap-1 px-1.5 text-[9px]"
                              >
                                <AlertCircle className="size-3" />
                                {findingCount} Temuan
                              </Badge>
                            )}
                          </div>

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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-3 rounded border bg-card px-4 py-3">
          <div className="flex size-9 items-center justify-center rounded bg-muted">
            <MapPin className="size-4 text-muted-foreground" />
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Total Checkpoint</p>

            <p className="text-lg font-semibold tabular-nums">
              {checkpoints.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded border bg-card px-4 py-3">
          <div className="flex size-9 items-center justify-center rounded bg-green-50">
            <CheckCircle2 className="size-4 text-green-600" />
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Checkpoint Aktif</p>

            <p className="text-lg font-semibold tabular-nums">{activeCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded border bg-card px-4 py-3">
          <div className="flex size-9 items-center justify-center rounded bg-muted">
            <Circle className="size-4 text-muted-foreground" />
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Checkpoint Nonaktif</p>

            <p className="text-lg font-semibold tabular-nums">
              {inactiveCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded border bg-card px-4 py-3">
          <div className="flex size-9 items-center justify-center rounded bg-red-50">
            <AlertCircle className="size-4 text-red-600" />
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Total Temuan</p>

            <p className="text-lg font-semibold tabular-nums text-red-600">
              {totalFindings}
            </p>

            <p className="text-[10px] text-muted-foreground">
              Pada {checkpointsWithFindings} checkpoint
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
