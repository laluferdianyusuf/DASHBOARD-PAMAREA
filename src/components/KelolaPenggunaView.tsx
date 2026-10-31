import React, { useMemo, useState } from "react";

import {
  INITIAL_SQUADS,
  SITES,
  USER_ACCOUNTS,
  type SecuritySquadItem,
  type UserAccount,
} from "../data/mockData";

import { validateSquadData } from "../utils/security-logic";

import {
  Check,
  CircleAlert,
  Edit,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
import { Label } from "@/components/ui/label";

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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface KelolaPenggunaViewProps {
  selectedSite: string;
}

type ActiveTab = "personel" | "regu";

const inputClass = "h-9 rounded text-xs";

const selectTriggerClass = "h-9 rounded text-xs";

const labelClass = "text-xs font-medium text-foreground";

const buttonClass = "rounded";

const getSiteName = (siteId: string) => {
  return (
    SITES.find((site) => site.id === siteId)?.name.replace(
      /^Site [A-D] - /,
      "",
    ) || "-"
  );
};

const getUserStatusVariant = (status: string) => {
  switch (status) {
    case "Aktif":
      return "success";
    case "Cuti":
      return "warning";
    default:
      return "secondary";
  }
};

const getSquadStatusVariant = (status: string) => {
  switch (status) {
    case "Sedang Bertugas":
      return "success";
    case "Siaga Penuh":
      return "default";
    default:
      return "secondary";
  }
};

const initialUserForm = () => ({
  npp: `NPP-88${Math.floor(1000 + Math.random() * 9000)}`,
  fullName: "",
  role: "Petugas Lapangan" as UserAccount["role"],
  siteId: SITES[0]?.id || "site-a",
  squad: "",
  certification: "Gada Pratama" as UserAccount["certification"],
  phone: "",
  radioCallSign: "",
  email: "",
});

const initialSquadForm = () => ({
  name: "",
  danru: "",
  siteId: SITES[0]?.id || "site-a",
  shiftDefault:
    "Shift Pagi (07:00 - 15:00)" as SecuritySquadItem["shiftDefault"],
  memberCount: 6,
  contactRadio: "",
  assignedSector: "",
  status: "Siaga Penuh" as SecuritySquadItem["status"],
});

export const KelolaPenggunaView: React.FC<KelolaPenggunaViewProps> = ({
  selectedSite,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ActiveTab>("personel");

  const [users, setUsers] = useState<UserAccount[]>(USER_ACCOUNTS);
  const [squads, setSquads] = useState<SecuritySquadItem[]>(INITIAL_SQUADS);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Dialog states
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddSquadOpen, setIsAddSquadOpen] = useState(false);

  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  const [editingSquad, setEditingSquad] = useState<SecuritySquadItem | null>(
    null,
  );

  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);

  const [deletingSquad, setDeletingSquad] = useState<SecuritySquadItem | null>(
    null,
  );

  // Form states
  const [newUser, setNewUser] = useState(initialUserForm);
  const [newSquad, setNewSquad] = useState(initialSquadForm);

  // Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);

    window.setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (
        selectedSite !== "all" &&
        user.siteId !== "all" &&
        user.siteId !== selectedSite
      ) {
        return false;
      }

      if (selectedRole !== "all" && user.role !== selectedRole) {
        return false;
      }

      if (selectedStatus !== "all" && user.status !== selectedStatus) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();

        const matches = [
          user.npp,
          user.fullName,
          user.radioCallSign,
          user.phone,
          user.siteName,
          user.email,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );

        if (!matches) return false;
      }

      return true;
    });
  }, [users, selectedSite, selectedRole, selectedStatus, searchQuery]);

  const filteredSquads = useMemo(() => {
    return squads.filter((squad) => {
      if (
        selectedSite !== "all" &&
        squad.siteId !== "all" &&
        squad.siteId !== selectedSite
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();

        const matches = [
          squad.name,
          squad.danru,
          squad.siteName,
          squad.assignedSector,
          squad.contactRadio,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );

        if (!matches) return false;
      }

      return true;
    });
  }, [squads, selectedSite, searchQuery]);

  const handleCreateUser = (event: React.FormEvent) => {
    event.preventDefault();

    const siteName = getSiteName(newUser.siteId);

    const created: UserAccount = {
      id: `USR-${String(users.length + 1).padStart(3, "0")}`,
      npp: newUser.npp,
      fullName: newUser.fullName,
      role: newUser.role,
      siteId: newUser.siteId,
      siteName,
      squad: newUser.squad,
      certification: newUser.certification,
      phone: newUser.phone,
      radioCallSign: newUser.radioCallSign,
      status: "Aktif",
      email:
        newUser.email ||
        `${newUser.fullName
          .toLowerCase()
          .trim()
          .replace(/\s+/g, ".")}@pamarea.co.id`,
    };

    setUsers((previous) => [created, ...previous]);

    setIsAddUserOpen(false);
    setNewUser(initialUserForm());

    showToast(`Personel ${created.fullName} berhasil didaftarkan.`);
  };

  const handleSaveEditUser = (event: React.FormEvent) => {
    event.preventDefault();

    if (!editingUser) return;

    setUsers((previous) =>
      previous.map((user) =>
        user.id === editingUser.id
          ? {
              ...editingUser,
              siteName: getSiteName(editingUser.siteId),
            }
          : user,
      ),
    );

    const name = editingUser.fullName;

    setEditingUser(null);

    showToast(`Data personel ${name} berhasil diperbarui.`);
  };

  const handleDeleteUser = () => {
    if (!deletingUser) return;

    setUsers((previous) =>
      previous.filter((user) => user.id !== deletingUser.id),
    );

    showToast(`Personel ${deletingUser.fullName} berhasil dihapus.`);

    setDeletingUser(null);
  };

  const handleToggleStatus = (userId: string) => {
    setUsers((previous) =>
      previous.map((user) => {
        if (user.id !== userId) return user;

        return {
          ...user,
          status: user.status === "Aktif" ? "Nonaktif" : "Aktif",
        };
      }),
    );
  };

  const handleCreateSquad = (event: React.FormEvent) => {
    event.preventDefault();

    const validation = validateSquadData({
      name: newSquad.name,
      danru: newSquad.danru,
      memberCount: Number(newSquad.memberCount),
    });

    if (!validation.valid) {
      showToast(validation.error || "Data regu tidak valid.");
      return;
    }

    const created: SecuritySquadItem = {
      id: `SQD-${String(squads.length + 1).padStart(2, "0")}`,
      name: newSquad.name,
      danru: newSquad.danru,
      siteId: newSquad.siteId,
      siteName: getSiteName(newSquad.siteId),
      shiftDefault: newSquad.shiftDefault,
      memberCount: Number(newSquad.memberCount),
      status: newSquad.status,
      contactRadio:
        newSquad.contactRadio ||
        `${newSquad.name.replace(/\s+/g, "")}-01 (CH-01)`,
      assignedSector: newSquad.assignedSector || "Sektor Pengamanan Terpadu",
    };

    setSquads((previous) => [...previous, created]);

    setIsAddSquadOpen(false);
    setNewSquad(initialSquadForm());

    showToast(`Regu ${created.name} berhasil dibentuk.`);
  };

  const handleSaveEditSquad = (event: React.FormEvent) => {
    event.preventDefault();

    if (!editingSquad) return;

    setSquads((previous) =>
      previous.map((squad) =>
        squad.id === editingSquad.id
          ? {
              ...editingSquad,
              siteName: getSiteName(editingSquad.siteId),
            }
          : squad,
      ),
    );

    const name = editingSquad.name;

    setEditingSquad(null);

    showToast(`Data regu ${name} berhasil diperbarui.`);
  };

  const handleDeleteSquad = () => {
    if (!deletingSquad) return;

    setSquads((previous) =>
      previous.filter((squad) => squad.id !== deletingSquad.id),
    );

    showToast(`Regu ${deletingSquad.name} berhasil dihapus.`);

    setDeletingSquad(null);
  };

  const renderInput = (
    label: string,
    value: string | number,
    onChange: (value: string) => void,
    options?: {
      placeholder?: string;
      type?: string;
      required?: boolean;
      min?: number;
      max?: number;
    },
  ) => (
    <div className="space-y-1.5">
      <Label className={labelClass}>{label}</Label>

      <Input
        type={options?.type || "text"}
        value={value}
        required={options?.required}
        min={options?.min}
        max={options?.max}
        placeholder={options?.placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </div>
  );

  const renderSiteSelect = (
    value: string,
    onChange: (value: string) => void,
  ) => (
    <div className="space-y-1.5">
      <Label className={labelClass}>Penempatan Site</Label>

      <Select
        value={value}
        onValueChange={(value) => onChange(value as string)}
      >
        <SelectTrigger className={selectTriggerClass}>
          <SelectValue placeholder="Pilih site" />
        </SelectTrigger>

        <SelectContent>
          {SITES.map((site) => (
            <SelectItem key={site.id} value={site.id}>
              {site.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* NOTIFICATION */}

      {toastMessage && (
        <div className="flex items-center justify-between gap-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <Check className="size-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded text-emerald-700"
            onClick={() => setToastMessage(null)}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Kelola Pengguna
          </h1>

          <p className="mt-1 text-xs text-muted-foreground">
            Kelola akun personel, hak akses, dan regu pengamanan.
          </p>
        </div>

        <Button
          className={`${buttonClass} gap-2`}
          onClick={() => {
            if (activeSubTab === "personel") {
              setNewUser(initialUserForm());
              setIsAddUserOpen(true);
            } else {
              setNewSquad(initialSquadForm());
              setIsAddSquadOpen(true);
            }
          }}
        >
          <Plus className="size-4" />

          {activeSubTab === "personel" ? "Tambah Personel" : "Tambah Regu"}
        </Button>
      </div>

      <Tabs
        value={activeSubTab}
        onValueChange={(value) => {
          setActiveSubTab(value as ActiveTab);
          setSearchQuery("");
        }}
      >
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <TabsList className="h-9 rounded bg-muted p-1">
            <TabsTrigger value="personel" className="rounded px-3 text-xs">
              <UserRound className="mr-2 size-3.5" />
              Personel ({users.length})
            </TabsTrigger>

            <TabsTrigger value="regu" className="rounded px-3 text-xs">
              <Users className="mr-2 size-3.5" />
              Regu ({squads.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="personel" className="mt-4 space-y-3">
          {/* FILTER */}

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari nama, NPP, call sign, telepon..."
                className="h-9 rounded pl-9 text-xs"
              />
            </div>

            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as string)}
            >
              <SelectTrigger className="h-9 w-full rounded text-xs sm:w-[220px]">
                <SelectValue placeholder="Semua Peran" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Semua Peran</SelectItem>
                <SelectItem value="Security Superintendent">
                  Security Superintendent
                </SelectItem>
                <SelectItem value="Komandan Regu (Danru)">
                  Komandan Regu (Danru)
                </SelectItem>
                <SelectItem value="Petugas Lapangan">
                  Petugas Lapangan
                </SelectItem>
                <SelectItem value="Operator Posko / Dispatcher">
                  Operator Posko / Dispatcher
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as string)}
            >
              <SelectTrigger className="h-9 w-full rounded text-xs sm:w-[150px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Aktif">Aktif</SelectItem>
                <SelectItem value="Cuti">Cuti</SelectItem>
                <SelectItem value="Nonaktif">Nonaktif</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery ||
              selectedRole !== "all" ||
              selectedStatus !== "all") && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedRole("all");
                  setSelectedStatus("all");
                }}
              >
                <X className="mr-1 size-3.5" />
                Reset
              </Button>
            )}
          </div>

          {/* TABLE */}

          <div className="overflow-hidden rounded border">
            <div className="flex items-center justify-between border-b px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold">Daftar Personel</p>

                <p className="text-[11px] text-muted-foreground">
                  Data akun dan penugasan personel keamanan
                </p>
              </div>

              <Badge variant="secondary" className="rounded">
                {filteredUsers.length} Personel
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">
                      NPP / NIK
                    </TableHead>

                    <TableHead className="whitespace-nowrap">
                      Nama Personel
                    </TableHead>

                    <TableHead className="whitespace-nowrap">Peran</TableHead>

                    <TableHead className="whitespace-nowrap">Regu</TableHead>

                    <TableHead className="whitespace-nowrap">Kontak</TableHead>

                    <TableHead className="whitespace-nowrap text-center">
                      Status
                    </TableHead>

                    <TableHead className="whitespace-nowrap text-right">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="h-28 text-center text-xs text-muted-foreground"
                      >
                        Tidak ada personel yang ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="whitespace-nowrap font-mono text-xs font-medium text-primary">
                          {user.npp}
                        </TableCell>

                        <TableCell className="min-w-[180px]">
                          <p className="text-xs font-medium">{user.fullName}</p>

                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {user.email}
                          </p>
                        </TableCell>

                        <TableCell className="min-w-[170px]">
                          <Badge
                            variant="outline"
                            className="rounded font-normal"
                          >
                            {user.role}
                          </Badge>
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-xs">
                          {user.squad || "-"}
                        </TableCell>

                        <TableCell className="min-w-[150px]">
                          <p className="text-xs">{user.phone}</p>

                          <p className="mt-0.5 text-[11px] text-primary">
                            HT: {user.radioCallSign}
                          </p>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge
                            variant={
                              getUserStatusVariant(user.status) as
                                | "default"
                                | "secondary"
                                | "destructive"
                                | "outline"
                            }
                            className={`rounded font-medium ${
                              user.status === "Aktif"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : user.status === "Cuti"
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : ""
                            }`}
                          >
                            {user.status}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded"
                              title="Edit personel"
                              onClick={() => setEditingUser({ ...user })}
                            >
                              <Edit className="size-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className={`size-8 rounded ${
                                user.status === "Aktif"
                                  ? "text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                                  : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                              }`}
                              title={
                                user.status === "Aktif"
                                  ? "Nonaktifkan"
                                  : "Aktifkan"
                              }
                              onClick={() => handleToggleStatus(user.id)}
                            >
                              <ShieldCheck className="size-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded text-destructive hover:bg-destructive/10 hover:text-destructive"
                              title="Hapus personel"
                              onClick={() => setDeletingUser(user)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="regu" className="mt-4 space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari regu, Danru, sektor..."
              className="h-9 rounded pl-9 text-xs"
            />
          </div>

          <div className="overflow-hidden rounded border">
            <div className="flex items-center justify-between border-b px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold">Daftar Regu Pengamanan</p>

                <p className="text-[11px] text-muted-foreground">
                  Pengelolaan regu dan wilayah tanggung jawab
                </p>
              </div>

              <Badge variant="secondary" className="rounded">
                {filteredSquads.length} Regu
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Regu</TableHead>
                    <TableHead>Nama Regu</TableHead>
                    <TableHead>Komandan Regu</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Sektor</TableHead>
                    <TableHead>Shift Default</TableHead>
                    <TableHead className="text-center">Anggota</TableHead>
                    <TableHead>Radio HT</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredSquads.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="h-28 text-center text-xs text-muted-foreground"
                      >
                        Tidak ada regu yang ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSquads.map((squad) => (
                      <TableRow key={squad.id}>
                        <TableCell className="whitespace-nowrap font-mono text-xs font-medium text-primary">
                          {squad.id}
                        </TableCell>

                        <TableCell className="min-w-[160px] text-xs font-medium">
                          {squad.name}
                        </TableCell>

                        <TableCell className="min-w-[150px]">
                          <p className="text-xs font-medium">{squad.danru}</p>

                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Danru
                          </p>
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-xs">
                          {squad.siteName}
                        </TableCell>

                        <TableCell className="min-w-[180px] text-xs">
                          {squad.assignedSector}
                        </TableCell>

                        <TableCell className="min-w-[170px] text-xs">
                          {squad.shiftDefault}
                        </TableCell>

                        <TableCell className="text-center text-xs font-medium">
                          {squad.memberCount}
                        </TableCell>

                        <TableCell className="whitespace-nowrap font-mono text-xs text-primary">
                          {squad.contactRadio}
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`rounded font-medium ${
                              squad.status === "Sedang Bertugas"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : squad.status === "Siaga Penuh"
                                  ? "border-blue-200 bg-blue-50 text-blue-700"
                                  : ""
                            }`}
                          >
                            {squad.status}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded"
                              title="Edit regu"
                              onClick={() => setEditingSquad({ ...squad })}
                            >
                              <Edit className="size-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded text-destructive hover:bg-destructive/10 hover:text-destructive"
                              title="Hapus regu"
                              onClick={() => setDeletingSquad(squad)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded">
          <DialogHeader>
            <DialogTitle className="text-base">Tambah Personel</DialogTitle>

            <DialogDescription className="text-xs">
              Masukkan informasi akun dan penempatan personel baru.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {renderInput(
                "NPP / NIK",
                newUser.npp,
                (value) =>
                  setNewUser((previous) => ({
                    ...previous,
                    npp: value,
                  })),
                { required: true },
              )}

              {renderInput(
                "Nama Lengkap",
                newUser.fullName,
                (value) =>
                  setNewUser((previous) => ({
                    ...previous,
                    fullName: value,
                  })),
                {
                  required: true,
                  placeholder: "Nama sesuai KTP",
                },
              )}

              <div className="space-y-1.5">
                <Label className={labelClass}>Peran</Label>

                <Select
                  value={newUser.role}
                  onValueChange={(value) =>
                    setNewUser((previous) => ({
                      ...previous,
                      role: value as UserAccount["role"],
                    }))
                  }
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Petugas Lapangan">
                      Petugas Lapangan
                    </SelectItem>
                    <SelectItem value="Komandan Regu (Danru)">
                      Komandan Regu (Danru)
                    </SelectItem>
                    <SelectItem value="Operator Posko / Dispatcher">
                      Operator Posko / Dispatcher
                    </SelectItem>
                    <SelectItem value="Security Superintendent">
                      Security Superintendent
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className={labelClass}>Sertifikasi</Label>

                <Select
                  value={newUser.certification}
                  onValueChange={(value) =>
                    setNewUser((previous) => ({
                      ...previous,
                      certification: value as UserAccount["certification"],
                    }))
                  }
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Gada Pratama">Gada Pratama</SelectItem>
                    <SelectItem value="Gada Madya">Gada Madya</SelectItem>
                    <SelectItem value="Gada Utama">Gada Utama</SelectItem>
                    <SelectItem value="K3 Umum">
                      K3 Umum & Fire Safety
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {renderSiteSelect(newUser.siteId, (value) =>
                setNewUser((previous) => ({
                  ...previous,
                  siteId: value,
                })),
              )}

              <div className="space-y-1.5">
                <Label className={labelClass}>Regu</Label>

                <Select
                  value={newUser.squad || "none"}
                  onValueChange={(value) =>
                    setNewUser((previous) => ({
                      ...previous,
                      squad: value ?? "",
                    }))
                  }
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Pilih regu" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="none">Tanpa Regu</SelectItem>

                    {squads
                      .filter((squad) => squad.siteId === newUser.siteId)
                      .map((squad) => (
                        <SelectItem key={squad.id} value={squad.name}>
                          {squad.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {renderInput(
                "Nomor Handphone",
                newUser.phone,
                (value) =>
                  setNewUser((previous) => ({
                    ...previous,
                    phone: value,
                  })),
                {
                  required: true,
                  placeholder: "08xxxxxxxxxx",
                },
              )}

              {renderInput(
                "Radio Call Sign",
                newUser.radioCallSign,
                (value) =>
                  setNewUser((previous) => ({
                    ...previous,
                    radioCallSign: value,
                  })),
                {
                  required: true,
                  placeholder: "Alpha-01",
                },
              )}

              <div className="sm:col-span-2">
                {renderInput(
                  "Email",
                  newUser.email,
                  (value) =>
                    setNewUser((previous) => ({
                      ...previous,
                      email: value,
                    })),
                  {
                    type: "email",
                    placeholder: "Opsional, otomatis dibuat jika kosong",
                  },
                )}
              </div>
            </div>

            <Separator />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className={buttonClass}
                onClick={() => setIsAddUserOpen(false)}
              >
                Batal
              </Button>

              <Button type="submit" className={buttonClass}>
                Simpan Personel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* DIALOG EDIT PERSONEL */}
      {/* ======================================================== */}

      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Personel</DialogTitle>

            <DialogDescription className="text-xs">
              Perbarui informasi personel dan penempatannya.
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {renderInput(
                  "NPP / NIK",
                  editingUser.npp,
                  (value) =>
                    setEditingUser({
                      ...editingUser,
                      npp: value,
                    }),
                  { required: true },
                )}

                {renderInput(
                  "Nama Lengkap",
                  editingUser.fullName,
                  (value) =>
                    setEditingUser({
                      ...editingUser,
                      fullName: value,
                    }),
                  { required: true },
                )}

                <div className="space-y-1.5">
                  <Label className={labelClass}>Peran</Label>

                  <Select
                    value={editingUser.role}
                    onValueChange={(value) =>
                      setEditingUser({
                        ...editingUser,
                        role: value as UserAccount["role"],
                      })
                    }
                  >
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="Petugas Lapangan">
                        Petugas Lapangan
                      </SelectItem>
                      <SelectItem value="Komandan Regu (Danru)">
                        Komandan Regu (Danru)
                      </SelectItem>
                      <SelectItem value="Operator Posko / Dispatcher">
                        Operator Posko / Dispatcher
                      </SelectItem>
                      <SelectItem value="Security Superintendent">
                        Security Superintendent
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className={labelClass}>Sertifikasi</Label>

                  <Select
                    value={editingUser.certification}
                    onValueChange={(value) =>
                      setEditingUser({
                        ...editingUser,
                        certification: value as UserAccount["certification"],
                      })
                    }
                  >
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="Gada Pratama">Gada Pratama</SelectItem>
                      <SelectItem value="Gada Madya">Gada Madya</SelectItem>
                      <SelectItem value="Gada Utama">Gada Utama</SelectItem>
                      <SelectItem value="K3 Umum">K3 Umum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {renderSiteSelect(editingUser.siteId, (value) =>
                  setEditingUser({
                    ...editingUser,
                    siteId: value,
                    siteName: getSiteName(value),
                    squad: "",
                  }),
                )}

                <div className="space-y-1.5">
                  <Label className={labelClass}>Regu</Label>

                  <Select
                    value={editingUser.squad || "none"}
                    onValueChange={(value) =>
                      setEditingUser({
                        ...editingUser,
                        squad: value ?? "",
                      })
                    }
                  >
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Pilih regu" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="none">Tanpa Regu</SelectItem>

                      {squads
                        .filter((squad) => squad.siteId === editingUser.siteId)
                        .map((squad) => (
                          <SelectItem key={squad.id} value={squad.name}>
                            {squad.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {renderInput(
                  "Nomor Handphone",
                  editingUser.phone,
                  (value) =>
                    setEditingUser({
                      ...editingUser,
                      phone: value,
                    }),
                  { required: true },
                )}

                {renderInput(
                  "Radio Call Sign",
                  editingUser.radioCallSign,
                  (value) =>
                    setEditingUser({
                      ...editingUser,
                      radioCallSign: value,
                    }),
                  { required: true },
                )}

                {renderInput(
                  "Email",
                  editingUser.email,
                  (value) =>
                    setEditingUser({
                      ...editingUser,
                      email: value,
                    }),
                  { type: "email", required: true },
                )}

                <div className="space-y-1.5">
                  <Label className={labelClass}>Status Akun</Label>

                  <Select
                    value={editingUser.status}
                    onValueChange={(value) =>
                      setEditingUser({
                        ...editingUser,
                        status: value as UserAccount["status"],
                      })
                    }
                  >
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="Aktif">Aktif</SelectItem>
                      <SelectItem value="Cuti">Cuti</SelectItem>
                      <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className={buttonClass}
                  onClick={() => setEditingUser(null)}
                >
                  Batal
                </Button>

                <Button type="submit" className={buttonClass}>
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddSquadOpen} onOpenChange={setIsAddSquadOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded">
          <DialogHeader>
            <DialogTitle className="text-base">
              Tambah Regu Pengamanan
            </DialogTitle>

            <DialogDescription className="text-xs">
              Masukkan informasi regu dan wilayah tanggung jawab.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSquad} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {renderInput(
                "Nama Regu",
                newSquad.name,
                (value) =>
                  setNewSquad((previous) => ({
                    ...previous,
                    name: value,
                  })),
                {
                  required: true,
                  placeholder: "Contoh: Regu Alpha",
                },
              )}

              {renderInput(
                "Komandan Regu",
                newSquad.danru,
                (value) =>
                  setNewSquad((previous) => ({
                    ...previous,
                    danru: value,
                  })),
                {
                  required: true,
                  placeholder: "Nama Danru",
                },
              )}

              {renderSiteSelect(newSquad.siteId, (value) =>
                setNewSquad((previous) => ({
                  ...previous,
                  siteId: value,
                })),
              )}

              <div className="space-y-1.5">
                <Label className={labelClass}>Shift Default</Label>

                <Select
                  value={newSquad.shiftDefault}
                  onValueChange={(value) =>
                    setNewSquad((previous) => ({
                      ...previous,
                      shiftDefault: value as SecuritySquadItem["shiftDefault"],
                    }))
                  }
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Shift Pagi (07:00 - 15:00)">
                      Shift Pagi (07:00 - 15:00)
                    </SelectItem>
                    <SelectItem value="Shift Siang (15:00 - 23:00)">
                      Shift Siang (15:00 - 23:00)
                    </SelectItem>
                    <SelectItem value="Shift Malam (23:00 - 07:00)">
                      Shift Malam (23:00 - 07:00)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {renderInput(
                "Jumlah Anggota",
                newSquad.memberCount,
                (value) =>
                  setNewSquad((previous) => ({
                    ...previous,
                    memberCount: Number(value),
                  })),
                {
                  type: "number",
                  required: true,
                  min: 1,
                  max: 50,
                },
              )}

              {renderInput(
                "Call Sign Radio HT",
                newSquad.contactRadio,
                (value) =>
                  setNewSquad((previous) => ({
                    ...previous,
                    contactRadio: value,
                  })),
                { placeholder: "Contoh: Alpha-01 (CH-01)" },
              )}

              <div className="sm:col-span-2">
                {renderInput(
                  "Sektor Tanggung Jawab",
                  newSquad.assignedSector,
                  (value) =>
                    setNewSquad((previous) => ({
                      ...previous,
                      assignedSector: value,
                    })),
                  {
                    required: true,
                    placeholder: "Contoh: Gedung Utama dan Parkir",
                  },
                )}
              </div>
            </div>

            <Separator />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className={buttonClass}
                onClick={() => setIsAddSquadOpen(false)}
              >
                Batal
              </Button>

              <Button type="submit" className={buttonClass}>
                Simpan Regu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingSquad}
        onOpenChange={(open) => {
          if (!open) setEditingSquad(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded">
          <DialogHeader>
            <DialogTitle className="text-base">
              Edit Regu Pengamanan
            </DialogTitle>

            <DialogDescription className="text-xs">
              Perbarui data dan informasi operasional regu.
            </DialogDescription>
          </DialogHeader>

          {editingSquad && (
            <form onSubmit={handleSaveEditSquad} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {renderInput(
                  "Nama Regu",
                  editingSquad.name,
                  (value) =>
                    setEditingSquad({
                      ...editingSquad,
                      name: value,
                    }),
                  { required: true },
                )}

                {renderInput(
                  "Komandan Regu",
                  editingSquad.danru,
                  (value) =>
                    setEditingSquad({
                      ...editingSquad,
                      danru: value,
                    }),
                  { required: true },
                )}

                {renderSiteSelect(editingSquad.siteId, (value) =>
                  setEditingSquad({
                    ...editingSquad,
                    siteId: value,
                    siteName: getSiteName(value),
                  }),
                )}

                {renderInput(
                  "Jumlah Anggota",
                  editingSquad.memberCount,
                  (value) =>
                    setEditingSquad({
                      ...editingSquad,
                      memberCount: Number(value),
                    }),
                  {
                    type: "number",
                    required: true,
                    min: 1,
                    max: 50,
                  },
                )}

                <div className="space-y-1.5">
                  <Label className={labelClass}>Shift Default</Label>

                  <Select
                    value={editingSquad.shiftDefault}
                    onValueChange={(value) =>
                      setEditingSquad({
                        ...editingSquad,
                        shiftDefault:
                          value as SecuritySquadItem["shiftDefault"],
                      })
                    }
                  >
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="Shift Pagi (07:00 - 15:00)">
                        Shift Pagi (07:00 - 15:00)
                      </SelectItem>
                      <SelectItem value="Shift Siang (15:00 - 23:00)">
                        Shift Siang (15:00 - 23:00)
                      </SelectItem>
                      <SelectItem value="Shift Malam (23:00 - 07:00)">
                        Shift Malam (23:00 - 07:00)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className={labelClass}>Status Operasional</Label>

                  <Select
                    value={editingSquad.status}
                    onValueChange={(value) =>
                      setEditingSquad({
                        ...editingSquad,
                        status: value as SecuritySquadItem["status"],
                      })
                    }
                  >
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="Siaga Penuh">Siaga Penuh</SelectItem>
                      <SelectItem value="Sedang Bertugas">
                        Sedang Bertugas
                      </SelectItem>
                      <SelectItem value="Off / Libur">Off / Libur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {renderInput(
                  "Call Sign Radio HT",
                  editingSquad.contactRadio,
                  (value) =>
                    setEditingSquad({
                      ...editingSquad,
                      contactRadio: value,
                    }),
                )}

                <div className="sm:col-span-2">
                  {renderInput(
                    "Sektor Tanggung Jawab",
                    editingSquad.assignedSector,
                    (value) =>
                      setEditingSquad({
                        ...editingSquad,
                        assignedSector: value,
                      }),
                    { required: true },
                  )}
                </div>
              </div>

              <Separator />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className={buttonClass}
                  onClick={() => setEditingSquad(null)}
                >
                  Batal
                </Button>

                <Button type="submit" className={buttonClass}>
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingUser}
        onOpenChange={(open) => {
          if (!open) setDeletingUser(null);
        }}
      >
        <AlertDialogContent className="rounded">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <CircleAlert className="size-5 text-destructive" />
              Hapus Personel?
            </AlertDialogTitle>

            <AlertDialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus akun{" "}
              <strong className="text-foreground">
                {deletingUser?.fullName}
              </strong>{" "}
              ({deletingUser?.npp})? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className={buttonClass}>Batal</AlertDialogCancel>

            <AlertDialogAction
              className={`${buttonClass} bg-destructive text-destructive-foreground hover:bg-destructive/90`}
              onClick={handleDeleteUser}
            >
              Hapus Personel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingSquad}
        onOpenChange={(open) => {
          if (!open) setDeletingSquad(null);
        }}
      >
        <AlertDialogContent className="rounded">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <CircleAlert className="size-5 text-destructive" />
              Hapus Regu?
            </AlertDialogTitle>

            <AlertDialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus regu{" "}
              <strong className="text-foreground">{deletingSquad?.name}</strong>{" "}
              ({deletingSquad?.id})?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className={buttonClass}>Batal</AlertDialogCancel>

            <AlertDialogAction
              className={`${buttonClass} bg-destructive text-destructive-foreground hover:bg-destructive/90`}
              onClick={handleDeleteSquad}
            >
              Hapus Regu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
