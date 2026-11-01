import React, { useMemo, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  History,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";

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

import { usePatrolHistoryGroupedByUser } from "../hooks/schedule/usePatrolHistory";
import { getPatrolHistoryGroupedByUser } from "../services/patrol/patrol-history.service";
import { getPhotoUrl } from "../utils/getPhoto";
import { PaginationComponent } from "./PaginationComponent";
interface RiwayatPatroliViewProps {
  selectedSite: string;
}

type PatrolHistoryResponse = Awaited<
  ReturnType<typeof getPatrolHistoryGroupedByUser>
>;

type PatrolGroup = PatrolHistoryResponse["data"][number];

type PatrolRecord = PatrolGroup["patrols"][number] & {
  user: PatrolGroup["user"];
};

const PAGE_SIZE_OPTIONS = ["10", "20", "50", "100"];

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatDuration = (
  startedAt?: string | Date | null,
  completedAt?: string | Date | null,
) => {
  if (!startedAt || !completedAt) return "-";

  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return "-";
  }

  const minutes = Math.floor((end - start) / 60000);

  if (minutes < 60) return `${minutes} menit`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours} jam ${remainingMinutes} menit`;
};

const getStatusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    STARTED: "Dimulai",
    VALIDATED: "Tervalidasi",
    IN_PROGRESS: "Berlangsung",
    SUBMITTED: "Selesai",
    FAILED: "Gagal",
    CANCELLED: "Dibatalkan",
  };

  return labels[status ?? ""] ?? status ?? "-";
};

const getStatusBadge = (status?: string) => {
  switch (status) {
    case "SUBMITTED":
      return (
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-emerald-700"
        >
          <CheckCircle2 className="mr-1 size-3" />
          Selesai
        </Badge>
      );

    case "FAILED":
      return (
        <Badge
          variant="outline"
          className="border-rose-200 bg-rose-50 text-rose-700"
        >
          <AlertCircle className="mr-1 size-3" />
          Gagal
        </Badge>
      );

    case "CANCELLED":
      return (
        <Badge
          variant="outline"
          className="border-slate-200 bg-slate-50 text-slate-600"
        >
          Dibatalkan
        </Badge>
      );

    case "IN_PROGRESS":
      return (
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50 text-amber-700"
        >
          Berlangsung
        </Badge>
      );

    default:
      return <Badge variant="outline">{getStatusLabel(status)}</Badge>;
  }
};

interface PhotoItem {
  id: string;
  fileUrl: string;
  fileName?: string | null;
}

interface PhotoGalleryProps {
  photos?: PhotoItem[];
  onPreview: (url: string, name: string) => void;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos = [],
  onPreview,
}) => {
  if (photos.length === 0) {
    return <p className="text-sm text-muted-foreground">Tidak ada foto.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((photo) => {
        const imageUrl = getPhotoUrl(photo.fileUrl);
        const imageName = photo.fileName || "Foto";

        return (
          <button
            key={photo.id}
            type="button"
            onClick={() => onPreview(imageUrl, imageName)}
            className="group overflow-hidden rounded-lg border text-left"
          >
            <div className="aspect-square overflow-hidden bg-muted">
              <img
                src={imageUrl}
                alt={imageName}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>

            <p className="truncate p-2 text-xs text-muted-foreground">
              {imageName}
            </p>
          </button>
        );
      })}
    </div>
  );
};

export const RiwayatPatroliView: React.FC<RiwayatPatroliViewProps> = ({
  selectedSite,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");

  const [previewPhoto, setPreviewPhoto] = useState<{
    url: string;
    name: string;
  } | null>(null);

  const [selectedDetailLog, setSelectedDetailLog] =
    useState<PatrolRecord | null>(null);

  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: Number(pageSize),
      ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
      ...(selectedStatus !== "all"
        ? {
            status: selectedStatus as NonNullable<
              Parameters<typeof getPatrolHistoryGroupedByUser>[0]
            >["status"],
          }
        : {}),
    }),
    [currentPage, pageSize, searchQuery, selectedStatus],
  );

  const {
    data: patrolHistory,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = usePatrolHistoryGroupedByUser(queryParams);

  const logs = useMemo<PatrolRecord[]>(() => {
    return (
      patrolHistory?.data?.flatMap((group) =>
        group.patrols.map((patrol) => ({
          ...patrol,
          user: group.user,
        })),
      ) ?? []
    );
  }, [patrolHistory]);

  const filteredLogs = useMemo(() => {
    if (selectedSite === "all") return logs;

    return logs.filter((log) => log.site?.id === selectedSite);
  }, [logs, selectedSite]);

  const totalItems = patrolHistory?.pagination?.total ?? 0;

  const totalPages = patrolHistory?.pagination?.totalPages ?? 1;

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);
  };

  const handlePageSizeChange = (value: string | null) => {
    if (!value) return;

    setPageSize(value);
    setCurrentPage(1);
  };

  const getGpsBadge = (status?: string | null) => {
    if (status === "VALID") {
      return (
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-emerald-700"
        >
          Valid
        </Badge>
      );
    }

    if (status === "INVALID") {
      return (
        <Badge
          variant="outline"
          className="border-rose-200 bg-rose-50 text-rose-700"
        >
          Tidak Valid
        </Badge>
      );
    }

    return <Badge variant="outline">{status ?? "-"}</Badge>;
  };

  return (
    <div className="space-y-5">
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
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RotateCcw
            className={`mr-2 size-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Data Riwayat Patroli
            </h2>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Menampilkan {filteredLogs.length} data pada halaman ini dari{" "}
              {totalItems} catatan
            </p>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center my-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={searchQuery}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Cari ID sesi, atau security..."
              className="pl-9"
            />
          </div>

          <Select
            value={selectedStatus}
            onValueChange={(value) => handleStatusChange(value ?? "all")}
          >
            <SelectTrigger className="w-full sm:w-[210px]">
              <SelectValue placeholder="Filter status">
                {selectedStatus === "all" && "Semua Status"}
                {selectedStatus === "SUBMITTED" && "Selesai"}
                {selectedStatus === "FAILED" && "Gagal"}
                {selectedStatus === "CANCELLED" && "Dibatalkan"}
                {selectedStatus === "IN_PROGRESS" && "Berlangsung"}
              </SelectValue>
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="SUBMITTED">Selesai</SelectItem>
              <SelectItem value="FAILED">Gagal</SelectItem>
              <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
              <SelectItem value="IN_PROGRESS">Berlangsung</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || selectedStatus !== "all") && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <RotateCcw className="mr-2 size-4" />
              Reset
            </Button>
          )}
        </div>

        <div className="my-2">
          <PaginationComponent
            totalItems={totalItems}
            startItem={
              totalItems === 0 ? 0 : (currentPage - 1) * Number(pageSize) + 1
            }
            endItem={Math.min(currentPage * Number(pageSize), totalItems)}
            pageSize={pageSize}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageSizeChange={handlePageSizeChange}
            onPageChange={handlePageChange}
          />
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Memuat riwayat patroli...
          </div>
        ) : isError ? (
          <div className="flex h-40 flex-col items-center justify-center gap-3">
            <p className="text-sm text-rose-600">
              Gagal mengambil riwayat patroli.
            </p>

            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Coba Lagi
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="whitespace-nowrap">ID Sesi</TableHead>

                    <TableHead className="whitespace-nowrap">Site</TableHead>

                    <TableHead className="whitespace-nowrap">
                      Security
                    </TableHead>

                    <TableHead className="whitespace-nowrap">
                      Titik Patroli
                    </TableHead>

                    <TableHead className="whitespace-nowrap">
                      Waktu Mulai
                    </TableHead>

                    <TableHead className="whitespace-nowrap">GPS</TableHead>

                    <TableHead className="whitespace-nowrap">Status</TableHead>

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
                          {log.reportNumber}
                        </TableCell>

                        <TableCell>
                          <div className="min-w-[150px]">
                            <p className="font-medium text-slate-900">
                              {log.site?.name ?? "-"}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {log.patrolPoint?.code ?? "-"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="whitespace-nowrap">
                            <p className="font-medium text-slate-900">
                              {log.user?.fullName ?? "-"}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {log.user?.employeeNumber ?? "-"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="min-w-[140px]">
                            <p className="font-medium text-slate-900">
                              {log.patrolPoint?.name ?? "-"}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {log.patrolPoint?.code ?? "-"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          <p className="font-medium text-slate-900">
                            {formatDateTime(log.startedAt)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Durasi:{" "}
                            {formatDuration(log.startedAt, log.completedAt)}
                          </p>
                        </TableCell>

                        <TableCell>
                          {getGpsBadge(log.gpsValidationStatus)}
                        </TableCell>

                        <TableCell>{getStatusBadge(log.status)}</TableCell>

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
          </>
        )}
      </div>

      <Dialog
        open={!!selectedDetailLog}
        onOpenChange={(open) => {
          if (!open) setSelectedDetailLog(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded sm:max-w-2xl">
          {selectedDetailLog && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <History className="size-5 text-blue-600" />
                  Detail Riwayat Patroli
                </DialogTitle>

                <DialogDescription>
                  Informasi lengkap sesi {selectedDetailLog.reportNumber}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 border p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">ID Sesi</p>
                    <p className="mt-1 break-all font-mono text-sm font-medium text-slate-900">
                      {selectedDetailLog.reportNumber}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(selectedDetailLog.status)}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Site</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {selectedDetailLog.site?.name ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Security</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {selectedDetailLog.user?.fullName ?? "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedDetailLog.user?.employeeNumber ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Titik Patroli
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {selectedDetailLog.patrolPoint?.name ?? "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedDetailLog.patrolPoint?.code ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Urutan Titik
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {selectedDetailLog.checkpoint?.sequence ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Waktu Mulai</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {formatDateTime(selectedDetailLog.startedAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Waktu Selesai
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {formatDateTime(selectedDetailLog.completedAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Durasi</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {formatDuration(
                        selectedDetailLog.startedAt,
                        selectedDetailLog.completedAt,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Status Checkpoint
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {selectedDetailLog.checkpoint?.status ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Validasi GPS
                    </p>
                    <div className="mt-1">
                      {getGpsBadge(selectedDetailLog.gpsValidationStatus)}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Validasi NFC
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {selectedDetailLog.nfcValidationStatus ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Akurasi GPS</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {selectedDetailLog.gpsAccuracy != null
                        ? `${selectedDetailLog.gpsAccuracy} meter`
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Jarak dari Titik
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {selectedDetailLog.distanceFromPoint != null
                        ? `${selectedDetailLog.distanceFromPoint} meter`
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">NFC Bypass</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {selectedDetailLog.nfcBypass ? "Ya" : "Tidak"}
                    </p>
                  </div>

                  {selectedDetailLog.nfcBypass && (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Alasan NFC Bypass
                        </p>
                        <p className="mt-1 font-medium text-slate-900">
                          {selectedDetailLog.nfcBypassReason ?? "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Catatan NFC Bypass
                        </p>
                        <p className="mt-1 font-medium text-slate-900">
                          {selectedDetailLog.nfcBypassNote ?? "-"}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">
                    Jawaban Pertanyaan
                  </h3>

                  {selectedDetailLog.answers.length === 0 ? (
                    <div className="border bg-slate-50 p-3 text-sm text-muted-foreground">
                      Tidak ada jawaban.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDetailLog.answers.map((answer) => (
                        <div key={answer.id} className="border p-3">
                          <p className="text-sm font-medium text-slate-900">
                            {answer.questionTextSnapshot}
                          </p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {answer.answerLabelSnapshot ??
                              answer.answerValue ??
                              "-"}
                          </p>

                          <div className="mt-3">
                            <PhotoGallery
                              photos={answer.photos}
                              onPreview={(url, name) =>
                                setPreviewPhoto({ url, name })
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">
                    Temuan Patroli
                  </h3>

                  {selectedDetailLog.findings.length === 0 ? (
                    <div className="border bg-slate-50 p-3 text-sm text-muted-foreground">
                      Tidak ada temuan pada sesi patroli ini.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDetailLog.findings.map((finding) => (
                        <div key={finding.id} className="border p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-900">
                              {finding.title}
                            </p>

                            <Badge variant="outline">{finding.status}</Badge>
                          </div>

                          <p className="mt-2 text-sm text-muted-foreground">
                            {finding.description}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>Severity: {finding.severity}</span>

                            {finding.resolvedAt && (
                              <span>
                                · Diselesaikan:{" "}
                                {formatDateTime(finding.resolvedAt)}
                              </span>
                            )}
                          </div>

                          {finding.resolutionNote && (
                            <p className="mt-2 border-l-2 border-emerald-500 pl-3 text-sm text-slate-700">
                              {finding.resolutionNote}
                            </p>
                          )}

                          <div className="mt-3">
                            <p className="mb-2 text-xs font-medium text-slate-700">
                              Foto Temuan
                            </p>

                            <PhotoGallery
                              photos={finding.photos}
                              onPreview={(url, name) =>
                                setPreviewPhoto({ url, name })
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border p-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-5 text-emerald-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Validasi Pelaksanaan
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">
                        GPS dan NFC tercatat pada sesi patroli.
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

      <Dialog
        open={!!previewPhoto}
        onOpenChange={(open) => {
          if (!open) setPreviewPhoto(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded">
          <DialogHeader>
            <DialogTitle>Preview Foto</DialogTitle>

            <DialogDescription>{previewPhoto?.name}</DialogDescription>
          </DialogHeader>

          {previewPhoto && (
            <div className="flex max-h-[70vh] items-center justify-center overflow-hidden bg-slate-100">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.name}
                className="max-h-[65vh] max-w-full object-contain"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewPhoto(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
