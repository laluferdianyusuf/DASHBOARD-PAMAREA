import React, { useMemo, useState } from "react";
import { PATROL_LOGS, PatrolLogHistory } from "../data/mockData";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  AlertCircle,
  CheckCircle2,
  Download,
  History,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";

interface RiwayatPatroliViewProps {
  selectedSite: string;
}

export const RiwayatPatroliView: React.FC<RiwayatPatroliViewProps> = ({
  selectedSite,
}) => {
  const [logs] = useState<PatrolLogHistory[]>(PATROL_LOGS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDetailLog, setSelectedDetailLog] =
    useState<PatrolLogHistory | null>(null);

  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return logs.filter((log) => {
      if (selectedSite !== "all" && log.siteId !== selectedSite) {
        return false;
      }

      if (selectedStatus !== "all" && log.status !== selectedStatus) {
        return false;
      }

      if (query) {
        const searchableValues = [
          log.id,
          log.squad,
          log.danru,
          log.siteName,
          log.notes,
          log.supervisorSignOff,
        ];

        const matches = searchableValues.some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query),
        );

        if (!matches) return false;
      }

      return true;
    });
  }, [logs, selectedSite, selectedStatus, searchQuery]);

  const summary = useMemo(() => {
    const total = filteredLogs.length;

    const averageCompliance =
      total > 0
        ? filteredLogs.reduce((sum, log) => sum + log.complianceRate, 0) / total
        : 0;

    const averageDuration =
      total > 0
        ? filteredLogs.reduce((sum, log) => sum + log.durationMinutes, 0) /
          total
        : 0;

    const completed = filteredLogs.filter(
      (log) => log.complianceRate === 100,
    ).length;

    return {
      total,
      averageCompliance,
      averageDuration,
      completed,
    };
  }, [filteredLogs]);

  const exportCSV = () => {
    const headers = [
      "ID Sesi",
      "Site",
      "Regu",
      "Danru",
      "Tanggal",
      "Jam Mulai",
      "Jam Selesai",
      "Durasi (Menit)",
      "Titik Terpindai",
      "Total Titik",
      "Titik Terlewat",
      "Kepatuhan",
      "Status",
      "Pengawas",
      "Catatan",
    ];

    const escapeCSV = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = filteredLogs.map((log) => [
      log.id,
      log.siteName,
      log.squad,
      log.danru,
      log.date,
      log.startTime,
      log.endTime,
      log.durationMinutes,
      log.scannedPoints,
      log.totalPoints,
      log.missedPoints,
      `${log.complianceRate}%`,
      log.status,
      log.supervisorSignOff,
      log.notes,
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "Riwayat_Patroli_PAMAREA.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
  };

  const getStatusBadge = (complianceRate: number) => {
    if (complianceRate === 100) {
      return (
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-emerald-700"
        >
          <CheckCircle2 className="mr-1 size-3" />
          Lengkap Tuntas
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className="border-amber-200 bg-amber-50 text-amber-700"
      >
        <AlertCircle className="mr-1 size-3" />
        Sebagian Terlewat
      </Badge>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Riwayat Patroli
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Arsip pelaksanaan patroli dan catatan audit keamanan.
          </p>
        </div>

        <Button
          onClick={exportCSV}
          variant="outline"
          size="sm"
          disabled={filteredLogs.length === 0}
        >
          <Download className="mr-2 size-4" />
          Ekspor CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari ID sesi, site, regu, Danru, atau catatan..."
            className="pl-9"
          />
        </div>

        <Select
          value={selectedStatus}
          onValueChange={(value) => setSelectedStatus(value as string)}
        >
          <SelectTrigger className="w-full sm:w-[210px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="Lengkap Tuntas">Lengkap Tuntas</SelectItem>
            <SelectItem value="Sebagian Terlewat">Sebagian Terlewat</SelectItem>
          </SelectContent>
        </Select>

        {(searchQuery || selectedStatus !== "all") && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw className="mr-2 size-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden border bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Data Riwayat Patroli
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Menampilkan {filteredLogs.length} dari {logs.length} catatan
            </p>
          </div>
        </div>

        <Separator />

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="whitespace-nowrap">ID Sesi</TableHead>
                <TableHead className="whitespace-nowrap">Site</TableHead>
                <TableHead className="whitespace-nowrap">
                  Regu / Danru
                </TableHead>
                <TableHead className="whitespace-nowrap">Waktu</TableHead>
                <TableHead className="whitespace-nowrap text-center">
                  Titik Terpindai
                </TableHead>
                <TableHead className="whitespace-nowrap text-center">
                  Kepatuhan
                </TableHead>
                <TableHead className="whitespace-nowrap">Pengawas</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Tidak ada riwayat patroli yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap font-mono text-xs font-medium text-blue-700">
                      {log.id}
                    </TableCell>

                    <TableCell>
                      <div className="min-w-[150px]">
                        <p className="font-medium text-slate-900">
                          {log.siteName}
                        </p>
                        <p className="mt-0.5 max-w-[220px] truncate text-xs text-muted-foreground">
                          {log.notes}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="whitespace-nowrap">
                        <p className="font-medium text-slate-900">
                          {log.squad}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Danru: {log.danru}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="whitespace-nowrap">
                        <p className="font-medium text-slate-900">{log.date}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {log.startTime} - {log.endTime}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.durationMinutes} menit
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <p className="font-medium tabular-nums text-slate-900">
                        {log.scannedPoints} / {log.totalPoints}
                      </p>
                      {log.missedPoints > 0 && (
                        <p className="mt-0.5 text-xs text-rose-600">
                          {log.missedPoints} terlewat
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="font-semibold tabular-nums text-slate-900">
                        {log.complianceRate}%
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2 whitespace-nowrap text-sm">
                        <ShieldCheck className="size-4 text-emerald-600" />
                        <span className="text-slate-700">
                          {log.supervisorSignOff}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDetailLog(log)}
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedDetailLog}
        onOpenChange={(open) => {
          if (!open) setSelectedDetailLog(null);
        }}
      >
        <DialogContent className="max-w-xl">
          {selectedDetailLog && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <History className="size-5 text-blue-600" />
                  Detail Riwayat Patroli
                </DialogTitle>
                <DialogDescription>
                  Informasi lengkap sesi {selectedDetailLog.id}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 border p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">ID Sesi</p>
                    <p className="mt-1 font-mono font-medium text-slate-900">
                      {selectedDetailLog.id}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Site</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {selectedDetailLog.siteName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Regu</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {selectedDetailLog.squad}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Danru</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {selectedDetailLog.danru}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Tanggal dan Waktu
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {selectedDetailLog.date}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedDetailLog.startTime} -{" "}
                      {selectedDetailLog.endTime}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Durasi</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {selectedDetailLog.durationMinutes} menit
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Titik Terpindai
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {selectedDetailLog.scannedPoints} /{" "}
                      {selectedDetailLog.totalPoints}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Titik Terlewat
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {selectedDetailLog.missedPoints}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Kepatuhan</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedDetailLog.complianceRate}%
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(selectedDetailLog.complianceRate)}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">
                    Catatan Lapangan dan Temuan
                  </h3>
                  <div className="border bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                    {selectedDetailLog.notes || "Tidak ada catatan."}
                  </div>
                </div>

                <div className="border p-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-5 text-emerald-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Verifikasi Pengawas
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">
                        {selectedDetailLog.supervisorSignOff ||
                          "Belum diverifikasi"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedDetailLog(null)}
                >
                  Tutup
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
