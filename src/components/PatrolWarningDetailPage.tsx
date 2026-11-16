import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPin,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { formatDateFull } from "../helpers/dateTime";
import { usePatrolWarning } from "../hooks/point-questions/usePatrolWarning";
import { getPhotoUrl } from "../utils/getPhoto";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  patrolId: string;
}

function InfoItem({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="break-words text-sm font-medium text-foreground">
        {value || "-"}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function PatrolWarningDetailPage({ patrolId }: Props) {
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch, isFetching } =
    usePatrolWarning(patrolId);

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="-ml-3"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke dashboard
        </Button>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Detail patrol warning gagal dimuat</AlertTitle>
          <AlertDescription className="mt-2">
            {error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat mengambil data patroli."}
          </AlertDescription>
        </Alert>

        <Button onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Memuat..." : "Coba lagi"}
        </Button>
      </div>
    );
  }

  const unsafeAnswers = data.unsafeAnswers ?? [];

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="-ml-3 text-muted-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke dashboard
        </Button>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                Monitoring keamanan
              </p>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Detail Patrol Warning
            </h1>

            <p className="text-sm text-muted-foreground">
              Pemeriksaan jawaban checklist yang terindikasi tidak aman.
            </p>
          </div>

          <Badge
            variant="destructive"
            className="w-fit gap-1.5 px-3 py-1.5 text-sm"
          >
            <AlertTriangle className="h-4 w-4" />
            {unsafeAnswers.length} temuan
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            Informasi patroli
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Nomor laporan" value={data.patrol.reportNumber} />

            <InfoItem
              label="Site"
              value={data.site.name}
              description={data.site.code}
            />

            <InfoItem
              label="Titik patroli"
              value={data.patrolPoint.name}
              description={data.patrolPoint.code}
            />

            <InfoItem label="Status patroli" value={data.patrol.status} />

            <InfoItem
              label="Tanggal Patrol"
              value={formatDateFull(data.patrol.startedAt)}
            />
          </div>

          <Separator />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <UserRound className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="min-w-0">
              <p className="font-medium">{data.security.fullName}</p>
              <p className="text-sm text-muted-foreground">
                Nomor karyawan: {data.security.employeeNumber || "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Jawaban checklist tidak aman
          </h2>
          <p className="text-sm text-muted-foreground">
            Hanya jawaban yang teridentifikasi tidak aman yang ditampilkan.
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          {unsafeAnswers.length} temuan ditemukan
        </p>
      </div>

      {unsafeAnswers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="mb-3 h-10 w-10 text-green-600" />
            <h3 className="font-medium">Tidak ada jawaban tidak aman</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Tidak ditemukan jawaban checklist yang terindikasi tidak aman pada
              patroli ini.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {unsafeAnswers.map((item, index) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="flex flex-col justify-between gap-3 border-b bg-muted/30 px-5 py-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Temuan #{index + 1}
                    </p>
                    <p className="truncate font-semibold">
                      {item.question.code}
                    </p>
                  </div>
                </div>

                <Badge variant="destructive" className="w-fit">
                  Tidak aman
                </Badge>
              </div>

              <CardContent className="space-y-5 p-5">
                <section className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Pertanyaan
                  </p>
                  <p className="text-sm font-medium leading-relaxed">
                    {item.question.text}
                  </p>
                </section>

                <section className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Jawaban petugas
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="destructive" className="px-3 py-1">
                      <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                      {item.answer.label || item.answer.value || "-"}
                    </Badge>

                    {item.answer.selectedOption && (
                      <span className="text-sm text-muted-foreground">
                        Pilihan: {item.answer.selectedOption.label}
                      </span>
                    )}
                  </div>
                </section>

                <Separator />

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <InfoItem
                    label="Tipe pertanyaan"
                    value={item.question.type}
                  />

                  <InfoItem
                    label="Wajib diisi"
                    value={item.question.isRequired ? "Ya" : "Tidak"}
                  />

                  <InfoItem
                    label="Kebutuhan foto"
                    value={item.question.photoRequirement}
                  />
                </div>

                <Separator />

                <section className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">Foto bukti</h3>
                    </div>

                    <Badge variant="secondary">
                      {item.photos?.length ?? 0} foto
                    </Badge>
                  </div>

                  {!item.photos?.length ? (
                    <div className="rounded-md border border-dashed px-4 py-8 text-center">
                      <Camera className="mx-auto mb-2 h-7 w-7 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Tidak ada foto bukti untuk jawaban ini.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {item.photos.map((photo) => {
                        const photoUrl =
                          typeof photo.fileUrl === "string" &&
                          photo.fileUrl.trim()
                            ? getPhotoUrl(photo.fileUrl)
                            : "";

                        return (
                          <div
                            key={photo.id}
                            className="min-w-0 overflow-hidden rounded-lg border"
                          >
                            {photoUrl ? (
                              <Dialog>
                                <DialogTrigger>
                                  <button
                                    type="button"
                                    className="group block w-full cursor-zoom-in bg-muted p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                                  >
                                    <div className="flex min-h-48 max-h-[420px] w-full items-center justify-center overflow-hidden rounded-md bg-background">
                                      <img
                                        src={photoUrl}
                                        alt={
                                          photo.fileName || "Foto bukti patroli"
                                        }
                                        className="block h-auto max-h-[420px] w-auto max-w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                                        loading="lazy"
                                      />
                                    </div>
                                  </button>
                                </DialogTrigger>

                                <DialogContent className="flex h-[95dvh] w-[96vw] max-w-6xl flex-col gap-3 overflow-hidden p-3 sm:p-5">
                                  <DialogTitle className="shrink-0 truncate pr-8 text-sm font-semibold">
                                    {photo.fileName || "Foto bukti patroli"}
                                  </DialogTitle>

                                  <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-md bg-black p-2">
                                    <img
                                      src={photoUrl}
                                      alt={
                                        photo.fileName || "Foto bukti patroli"
                                      }
                                      className="block h-auto w-auto max-h-full max-w-full object-contain"
                                    />
                                  </div>

                                  <p className="shrink-0 text-center text-xs text-muted-foreground">
                                    Foto bukti patroli
                                  </p>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <div className="flex min-h-48 items-center justify-center bg-muted p-4 text-muted-foreground">
                                <div className="flex flex-col items-center gap-2">
                                  <Camera className="h-8 w-8" />
                                  <span className="text-xs">
                                    URL foto tidak tersedia
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="space-y-2 border-t p-3">
                              <p className="break-all text-sm font-medium">
                                {photo.fileName || "Foto patroli"}
                              </p>

                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                                <span>{formatDateFull(photo.capturedAt)}</span>
                              </div>

                              {photo.latitude != null &&
                                photo.longitude != null && (
                                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span className="break-all">
                                      {photo.latitude}, {photo.longitude}
                                    </span>
                                  </div>
                                )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <Separator />

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span>Waktu jawaban:</span>
                  <span className="font-medium text-foreground">
                    {formatDateFull(item.createdAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
