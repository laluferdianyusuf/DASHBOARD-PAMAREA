import React, { useEffect, useMemo, useState } from "react";

import {
  CHECKPOINTS,
  FINDINGS,
  SITES,
  type CheckpointItem,
  type FindingItem,
} from "../data/mockData";

import { getOpenFindingsForCheckpoint } from "../utils/security-logic";
import type { NavTab } from "./Sidebar";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  CircleAlert,
  Crosshair,
  Map as MapIcon,
  MapPin,
  Minus,
  Navigation,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Wifi,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface DashboardViewProps {
  selectedSite: string;
  onNavigate: (tab: NavTab) => void;
  checkpoints?: CheckpointItem[];
  findings?: FindingItem[];
}

type StatusFilter = "all" | "with-open-findings" | "normal" | "calibration";

type MapLayer = "blueprint" | "satellite" | "tactical";

export const DashboardView: React.FC<DashboardViewProps> = ({
  selectedSite,
  onNavigate,
  checkpoints = CHECKPOINTS,
  findings = FINDINGS,
}) => {
  const [siteFilter, setSiteFilter] = useState(selectedSite || "all");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedCheckpointId, setSelectedCheckpointId] = useState<
    string | null
  >("CP-SDR-014");

  const [mapLayer, setMapLayer] = useState<MapLayer>("blueprint");

  const [zoomLevel, setZoomLevel] = useState(1);

  // Synchronize selected site from parent.
  useEffect(() => {
    if (selectedSite) {
      setSiteFilter(selectedSite);
    }
  }, [selectedSite]);

  // Open findings per checkpoint.
  const openFindingsMap = useMemo(() => {
    const map = new Map<string, FindingItem[]>();

    for (const checkpoint of checkpoints) {
      const openFindings = getOpenFindingsForCheckpoint(
        {
          id: checkpoint.id,
          name: checkpoint.name,
          zoneFloor: checkpoint.zoneFloor,
        },
        findings,
      ) as FindingItem[];

      map.set(checkpoint.id, openFindings);
    }

    return map;
  }, [checkpoints, findings]);

  // Filter checkpoints.
  const filteredCheckpoints = useMemo(() => {
    return checkpoints.filter((checkpoint) => {
      if (siteFilter !== "all" && checkpoint.siteId !== siteFilter) {
        return false;
      }

      const checkpointFindings = openFindingsMap.get(checkpoint.id) || [];

      if (
        statusFilter === "with-open-findings" &&
        checkpointFindings.length === 0
      ) {
        return false;
      }

      if (
        statusFilter === "normal" &&
        (checkpointFindings.length > 0 || checkpoint.status !== "Aktif Normal")
      ) {
        return false;
      }

      if (
        statusFilter === "calibration" &&
        checkpoint.status !== "Perlu Kalibrasi"
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();

        const matches = [
          checkpoint.name,
          checkpoint.id,
          checkpoint.zoneFloor,
          checkpoint.siteName,
          checkpoint.tagUid,
          checkpoint.lastGuard,
        ].some((value) => value.toLowerCase().includes(query));

        if (!matches) {
          return false;
        }
      }

      return true;
    });
  }, [checkpoints, siteFilter, statusFilter, searchQuery, openFindingsMap]);

  // Summary.
  const totalOpenFindings = useMemo(() => {
    return filteredCheckpoints.reduce(
      (total, checkpoint) =>
        total + (openFindingsMap.get(checkpoint.id)?.length || 0),
      0,
    );
  }, [filteredCheckpoints, openFindingsMap]);

  const checkpointsWithFindings = useMemo(() => {
    return filteredCheckpoints.filter(
      (checkpoint) => (openFindingsMap.get(checkpoint.id)?.length || 0) > 0,
    ).length;
  }, [filteredCheckpoints, openFindingsMap]);

  const selectedCheckpoint = filteredCheckpoints.find(
    (checkpoint) => checkpoint.id === selectedCheckpointId,
  );

  const selectedSiteName =
    SITES.find((site) => site.id === siteFilter)?.name ||
    "Seluruh Area Patroli";

  const handleZoomIn = () => {
    setZoomLevel((zoom) => Math.min(1.8, zoom + 0.2));
  };

  const handleZoomOut = () => {
    setZoomLevel((zoom) => Math.max(0.8, zoom - 0.2));
  };

  const getCheckpointStatus = (checkpoint: CheckpointItem) => {
    const checkpointFindings = openFindingsMap.get(checkpoint.id) || [];

    if (checkpointFindings.length > 0) {
      const isCritical = checkpointFindings.some(
        (finding) =>
          finding.severity === "Kritis" || finding.severity === "Tinggi",
      );

      return isCritical ? "critical" : "finding";
    }

    if (checkpoint.status === "Perlu Kalibrasi") {
      return "calibration";
    }

    return "normal";
  };

  const getMarkerColor = (checkpoint: CheckpointItem) => {
    const status = getCheckpointStatus(checkpoint);

    switch (status) {
      case "critical":
        return "bg-rose-600 border-rose-300 text-white";

      case "finding":
        return "bg-amber-600 border-amber-300 text-white";

      case "calibration":
        return "bg-amber-500 border-amber-200 text-white";

      default:
        return "bg-emerald-600 border-emerald-300 text-white";
    }
  };

  const getLayerButtonVariant = (layer: MapLayer) => {
    return mapLayer === layer ? "secondary" : "ghost";
  };

  return (
    <div className="space-y-5">
      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <MapIcon className="size-5" />
            </div>

            <h1 className="text-xl font-semibold tracking-tight">
              Peta Titik Patroli
            </h1>
          </div>

          <p className="pl-11 text-sm text-muted-foreground">
            Monitoring checkpoint NFC/RFID dan status temuan lapangan.
          </p>
        </div>

        {/* Summary */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
            <MapPin className="size-4 text-blue-600" />

            <div>
              <p className="text-[11px] text-muted-foreground">Total Titik</p>

              <p className="text-sm font-semibold tabular-nums">
                {filteredCheckpoints.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
            {totalOpenFindings > 0 ? (
              <AlertTriangle className="size-4 text-amber-600" />
            ) : (
              <ShieldCheck className="size-4 text-emerald-600" />
            )}

            <div>
              <p className="text-[11px] text-muted-foreground">
                Temuan Terbuka
              </p>

              <p className="text-sm font-semibold tabular-nums">
                {totalOpenFindings}
                <span className="ml-1 font-normal text-muted-foreground">
                  / {checkpointsWithFindings} titik
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Site filter */}
          <Select
            value={siteFilter}
            onValueChange={(value) => setSiteFilter(value as string)}
          >
            <SelectTrigger className="w-full sm:w-[190px]">
              <SelectValue placeholder="Pilih lokasi" />
            </SelectTrigger>

            <SelectContent>
              {SITES.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">Semua Status Titik</SelectItem>

              <SelectItem value="with-open-findings">
                Ada Temuan Terbuka
              </SelectItem>

              <SelectItem value="normal">Normal / Bebas Temuan</SelectItem>

              <SelectItem value="calibration">Perlu Kalibrasi</SelectItem>
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari nama titik, kode, lantai, tag UID..."
              className="pl-9"
            />
          </div>

          {(searchQuery || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
            >
              <X className="mr-1 size-4" />
              Reset filter
            </Button>
          )}
        </div>

        {/* Map layer and zoom */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-r-none"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.8}
              title="Perkecil peta"
            >
              <Minus className="size-4" />
            </Button>

            <span className="min-w-[48px] text-center text-xs font-medium tabular-nums">
              {Math.round(zoomLevel * 100)}%
            </span>

            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-l-none"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 1.8}
              title="Perbesar peta"
            >
              <Plus className="size-4" />
            </Button>

            <Separator orientation="vertical" className="h-5" />

            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-l-none"
              onClick={() => setZoomLevel(1)}
              title="Reset zoom"
            >
              <RefreshCw className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* MAIN WORKSPACE */}
      {/* ================================================== */}

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
        {/* ================================================== */}
        {/* MAP */}
        {/* ================================================== */}

        <Card className="overflow-hidden xl:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-muted/30 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <Navigation className="size-4 shrink-0 text-blue-600" />

              <div className="min-w-0">
                <CardTitle className="truncate text-sm font-semibold">
                  {selectedSiteName}
                </CardTitle>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {filteredCheckpoints.length} checkpoint
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="hidden flex-wrap items-center gap-3 text-xs text-muted-foreground md:flex">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                Normal
              </div>

              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-rose-500" />
                Temuan
              </div>

              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-500" />
                Kalibrasi
              </div>
            </div>
          </CardHeader>

          <CardContent className="h-[620px] p-0">
            <div
              onClick={() => setSelectedCheckpointId(null)}
              className={`relative h-full overflow-hidden select-none ${
                mapLayer === "blueprint"
                  ? "bg-[#0f172a]"
                  : mapLayer === "satellite"
                    ? "bg-[#0a1120]"
                    : "bg-[#182234]"
              }`}
              style={{ cursor: "crosshair" }}
            >
              {/* MAP CANVAS */}
              <div
                className="absolute inset-0 origin-center transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel})`,
                }}
              >
                {/* Blueprint */}
                {mapLayer === "blueprint" && (
                  <svg
                    className="absolute inset-0 size-full opacity-40"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <pattern
                        id="blueprint-grid"
                        width="40"
                        height="40"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 40 0 L 0 0 0 40"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="0.5"
                        />
                      </pattern>

                      <pattern
                        id="blueprint-grid-small"
                        width="10"
                        height="10"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 10 0 L 0 0 0 10"
                          fill="none"
                          stroke="#1d4ed8"
                          strokeWidth="0.2"
                        />
                      </pattern>
                    </defs>

                    <rect
                      width="100%"
                      height="100%"
                      fill="url(#blueprint-grid-small)"
                    />

                    <rect
                      width="100%"
                      height="100%"
                      fill="url(#blueprint-grid)"
                    />

                    <rect
                      x="10%"
                      y="15%"
                      width="80%"
                      height="70%"
                      fill="none"
                      stroke="#60a5fa"
                      strokeWidth="1.5"
                      strokeDasharray="6 3"
                    />

                    <rect
                      x="20%"
                      y="22%"
                      width="32%"
                      height="56%"
                      fill="#1e3a8a"
                      fillOpacity="0.2"
                      stroke="#93c5fd"
                      strokeWidth="1"
                    />

                    <rect
                      x="56%"
                      y="22%"
                      width="30%"
                      height="56%"
                      fill="#1e3a8a"
                      fillOpacity="0.2"
                      stroke="#93c5fd"
                      strokeWidth="1"
                    />

                    <line
                      x1="10%"
                      y1="50%"
                      x2="90%"
                      y2="50%"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />

                    <line
                      x1="54%"
                      y1="15%"
                      x2="54%"
                      y2="85%"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />

                    <circle
                      cx="50%"
                      cy="50%"
                      r="5%"
                      fill="none"
                      stroke="#60a5fa"
                      strokeWidth="1"
                    />
                  </svg>
                )}

                {/* Satellite */}
                {mapLayer === "satellite" && (
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1e293b,#020617)] opacity-90">
                    <svg
                      className="size-full opacity-30"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="50%"
                        cy="50%"
                        r="40%"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="1"
                        strokeDasharray="8 4"
                      />

                      <circle
                        cx="50%"
                        cy="50%"
                        r="20%"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="0.5"
                      />

                      <line
                        x1="50%"
                        y1="0%"
                        x2="50%"
                        y2="100%"
                        stroke="#22c55e"
                        strokeWidth="0.5"
                        strokeDasharray="2 4"
                      />

                      <line
                        x1="0%"
                        y1="50%"
                        x2="100%"
                        y2="50%"
                        stroke="#22c55e"
                        strokeWidth="0.5"
                        strokeDasharray="2 4"
                      />
                    </svg>
                  </div>
                )}

                {/* Tactical */}
                {mapLayer === "tactical" && (
                  <div className="absolute inset-0 bg-[#0b1329]">
                    <svg
                      className="size-full opacity-50"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 960 620"
                      preserveAspectRatio="none"
                    >
                      <polygon
                        points="120,80 820,80 880,500 80,500"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1"
                      />

                      <polygon
                        points="200,140 480,140 480,440 200,440"
                        fill="#0369a1"
                        fillOpacity="0.15"
                        stroke="#0ea5e9"
                        strokeWidth="1.2"
                      />

                      <polygon
                        points="520,140 800,140 800,440 520,440"
                        fill="#0369a1"
                        fillOpacity="0.15"
                        stroke="#0ea5e9"
                        strokeWidth="1.2"
                      />
                    </svg>
                  </div>
                )}

                {/* CHECKPOINT MARKERS */}
                {filteredCheckpoints.map((checkpoint) => {
                  const isSelected = checkpoint.id === selectedCheckpointId;

                  const checkpointFindings =
                    openFindingsMap.get(checkpoint.id) || [];

                  const hasOpenFindings = checkpointFindings.length > 0;

                  const positionX = checkpoint.mapX ?? 50;
                  const positionY = checkpoint.mapY ?? 50;

                  return (
                    <div
                      key={checkpoint.id}
                      onClick={(event) => {
                        event.stopPropagation();

                        setSelectedCheckpointId(
                          isSelected ? null : checkpoint.id,
                        );
                      }}
                      style={{
                        left: `${positionX}%`,
                        top: `${positionY}%`,
                      }}
                      className={`group absolute z-30 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-150 ${
                        isSelected
                          ? "z-50 scale-110"
                          : "hover:z-40 hover:scale-125"
                      }`}
                    >
                      {/* Selected glow */}
                      {isSelected && (
                        <span className="pointer-events-none absolute -inset-3 animate-ping rounded-full bg-blue-500/30" />
                      )}

                      {/* Findings glow */}
                      {hasOpenFindings && (
                        <span className="pointer-events-none absolute -inset-2.5 animate-ping rounded-full bg-rose-500/30" />
                      )}

                      {/* Marker */}
                      <div
                        className={`relative flex items-center justify-center rounded-full border-2 shadow-lg transition-all ${
                          isSelected ? "size-10 ring-4 ring-white" : "size-8"
                        } ${getMarkerColor(checkpoint)}`}
                      >
                        {hasOpenFindings ? (
                          <CircleAlert className="size-4" />
                        ) : checkpoint.tagType.includes("RFID") ? (
                          <Wifi className="size-4" />
                        ) : (
                          <MapPin className="size-4" />
                        )}

                        {hasOpenFindings && (
                          <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full border-2 border-white bg-rose-600 text-[9px] font-bold text-white">
                            {checkpointFindings.length}
                          </span>
                        )}
                      </div>

                      {/* Marker label */}
                      {!isSelected && (
                        <div className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-slate-950/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                          {checkpoint.id}

                          {hasOpenFindings && (
                            <span className="ml-1 text-rose-300">
                              ({checkpointFindings.length})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Checkpoint detail */}
                      {isSelected && (
                        <div
                          onClick={(event) => event.stopPropagation()}
                          className={`absolute z-[60] w-64 rounded-lg border border-slate-700 bg-slate-950/95 p-3 text-white shadow-2xl backdrop-blur-md ${
                            positionY < 45
                              ? "top-full mt-3"
                              : "bottom-full mb-3"
                          } ${
                            positionX > 75
                              ? "right-[-12px]"
                              : positionX < 25
                                ? "left-[-12px]"
                                : "left-1/2 -translate-x-1/2"
                          }`}
                        >
                          {/* Detail header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Badge className="border-blue-400/30 bg-blue-500/20 text-[10px] text-blue-300 hover:bg-blue-500/20">
                                  {checkpoint.id}
                                </Badge>

                                <span className="truncate text-[10px] text-slate-400">
                                  {checkpoint.zoneFloor}
                                </span>
                              </div>

                              <h4
                                className="mt-1 text-sm font-semibold"
                                title={checkpoint.name}
                              >
                                {checkpoint.name}
                              </h4>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 shrink-0 text-slate-400 hover:bg-slate-800 hover:text-white"
                              onClick={() => setSelectedCheckpointId(null)}
                            >
                              <X className="size-4" />
                            </Button>
                          </div>

                          <Separator className="my-2 bg-slate-700" />

                          {/* Findings status */}
                          {hasOpenFindings ? (
                            <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="size-4 text-rose-400" />

                                  <span className="text-xs font-semibold text-rose-200">
                                    {checkpointFindings.length} Temuan Terbuka
                                  </span>
                                </div>

                                <Badge className="bg-rose-600 text-[10px] text-white hover:bg-rose-600">
                                  Open
                                </Badge>
                              </div>

                              <p className="mt-1 text-[10px] text-rose-300">
                                {checkpointFindings
                                  .map((finding) => finding.severity)
                                  .join(", ")}
                              </p>

                              <Button
                                size="sm"
                                variant="destructive"
                                className="mt-2 h-7 w-full text-xs"
                                onClick={() => onNavigate("temuan")}
                              >
                                Lihat Temuan
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2.5">
                              <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />

                              <div>
                                <p className="text-xs font-semibold text-emerald-200">
                                  0 Temuan
                                </p>

                                <p className="text-[10px] text-emerald-300/80">
                                  Kondisi titik normal
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Sensor details */}
                          <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                            <span className="flex min-w-0 items-center gap-1.5">
                              <Wifi className="size-3.5 shrink-0 text-blue-400" />

                              <span className="truncate">
                                {checkpoint.tagType.replace(
                                  " (Unassigned)",
                                  "",
                                )}
                              </span>
                            </span>

                            <span className="shrink-0">
                              Scan:{" "}
                              <strong className="text-slate-200">
                                {checkpoint.lastScanned}
                              </strong>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Map hint */}
              <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-[11px] text-white backdrop-blur">
                <Crosshair className="size-3.5 text-sky-400" />

                <span>Pilih marker untuk melihat detail checkpoint</span>
              </div>

              {/* Selected checkpoint indicator */}
              {selectedCheckpoint && (
                <div className="absolute right-3 top-3 z-20 rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white backdrop-blur">
                  <span className="text-slate-400">Dipilih:</span>{" "}
                  <span className="font-semibold">{selectedCheckpoint.id}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ================================================== */}
        {/* CHECKPOINT LIST */}
        {/* ================================================== */}

        <Card className="overflow-hidden xl:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-muted/30 px-4 py-3">
            <div>
              <CardTitle className="text-sm font-semibold">
                Daftar Titik Patroli
              </CardTitle>

              <p className="mt-0.5 text-xs text-muted-foreground">
                {filteredCheckpoints.length} checkpoint ditemukan
              </p>
            </div>

            <Badge variant="secondary">{filteredCheckpoints.length}</Badge>
          </CardHeader>

          <CardContent className="h-[620px] overflow-y-auto p-0">
            {filteredCheckpoints.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
                <MapPin className="size-8 text-muted-foreground/50" />

                <p className="text-sm font-medium">Tidak ada checkpoint</p>

                <p className="text-xs text-muted-foreground">
                  Coba ubah filter atau kata pencarian.
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setSiteFilter("all");
                  }}
                >
                  Reset Filter
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {filteredCheckpoints.map((checkpoint) => {
                  const isSelected = checkpoint.id === selectedCheckpointId;

                  const checkpointFindings =
                    openFindingsMap.get(checkpoint.id) || [];

                  const hasOpenFindings = checkpointFindings.length > 0;

                  const status = getCheckpointStatus(checkpoint);

                  return (
                    <button
                      key={checkpoint.id}
                      type="button"
                      onClick={() => {
                        setSelectedCheckpointId(
                          isSelected ? null : checkpoint.id,
                        );
                      }}
                      className={`flex w-full items-center justify-between gap-3 border-l-2 p-3 text-left transition-colors ${
                        isSelected
                          ? "border-l-blue-600 bg-blue-50/70 dark:bg-blue-950/20"
                          : "border-l-transparent hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-white ${
                            status === "critical"
                              ? "bg-rose-600"
                              : status === "finding"
                                ? "bg-amber-600"
                                : status === "calibration"
                                  ? "bg-amber-500"
                                  : "bg-emerald-600"
                          }`}
                        >
                          {hasOpenFindings ? (
                            <AlertTriangle className="size-4" />
                          ) : (
                            <MapPin className="size-4" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-[10px] font-semibold text-blue-600">
                              {checkpoint.id}
                            </span>

                            {checkpoint.status === "Perlu Kalibrasi" && (
                              <Badge
                                variant="outline"
                                className="h-5 border-amber-300 px-1.5 text-[9px] text-amber-700"
                              >
                                Kalibrasi
                              </Badge>
                            )}
                          </div>

                          <p className="mt-0.5 truncate text-xs font-semibold">
                            {checkpoint.name}
                          </p>

                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {checkpoint.zoneFloor}
                          </p>

                          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Wifi className="size-3" />

                            <span className="truncate">
                              {checkpoint.tagType.replace(" (Unassigned)", "")}
                            </span>

                            <span>·</span>

                            <span className="shrink-0">
                              {checkpoint.lastScanned}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Finding badge */}
                      <div className="shrink-0">
                        {hasOpenFindings ? (
                          <Badge
                            variant="destructive"
                            className="gap-1 text-[10px]"
                          >
                            <AlertTriangle className="size-3" />
                            {checkpointFindings.length} Open
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="gap-1 border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400"
                          >
                            <Check className="size-3" />
                            Normal
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
