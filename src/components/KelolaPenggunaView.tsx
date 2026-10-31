import React, { useMemo, useState } from "react";

import {
  INITIAL_SQUADS,
  SITES,
  USER_ACCOUNTS,
  type SecuritySquadItem,
  type UserAccount,
  type UserRole,
} from "../data/mockData";

import {
  Check,
  CircleAlert,
  Edit,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

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

const USER_ROLES: UserRole[] = [
  "Security",
  "Danru Security",
  "Shift Security",
  "Admin Planner",
];

const inputClass = "rounded text-xs";
const buttonClass = "rounded";

const initialUserForm = {
  npp: "",
  fullName: "",
  username: "",
  useNppAsUsername: true,
  password: "",
  confirmPassword: "",
  email: "",
  phone: "",
  role: "Security" as UserRole,
  squadId: "",
};

const initialSquadForm = {
  name: "",
  danru: "",
  siteId: SITES[0]?.id || "site-a",
  shiftDefault:
    "Shift Pagi (07:00 - 15:00)" as SecuritySquadItem["shiftDefault"],
  memberCount: 6,
  contactRadio: "",
  assignedSector: "",
  status: "Siaga Penuh" as SecuritySquadItem["status"],
};

const getSiteName = (siteId: string) => {
  return (
    SITES.find((site) => site.id === siteId)?.name.replace(
      /^Site [A-D] - /,
      "",
    ) || "-"
  );
};

const getRoleBadgeClass = (role: UserRole) => {
  switch (role) {
    case "Admin Planner":
      return "border-purple-200 bg-purple-50 text-purple-700";
    case "Danru Security":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Shift Security":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
};

export const KelolaPenggunaView: React.FC<KelolaPenggunaViewProps> = ({
  selectedSite,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ActiveTab>("personel");

  const [users, setUsers] = useState<UserAccount[]>(USER_ACCOUNTS);
  const [squads, setSquads] = useState<SecuritySquadItem[]>(INITIAL_SQUADS);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);

  const [changingPasswordUser, setChangingPasswordUser] =
    useState<UserAccount | null>(null);

  const [isAddSquadOpen, setIsAddSquadOpen] = useState(false);
  const [editingSquad, setEditingSquad] = useState<SecuritySquadItem | null>(
    null,
  );
  const [deletingSquad, setDeletingSquad] = useState<SecuritySquadItem | null>(
    null,
  );

  const [newUser, setNewUser] = useState(initialUserForm);
  const [editingUsernameSameAsNpp, setEditingUsernameSameAsNpp] =
    useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [newSquad, setNewSquad] = useState(initialSquadForm);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      if (selectedRole !== "all" && user.role !== selectedRole) {
        return false;
      }

      if (query) {
        const squadName =
          squads.find((squad) => squad.id === user.squadId)?.name || "";

        const matches = [
          user.npp,
          user.fullName,
          user.username,
          user.email,
          user.phone,
          user.role,
          squadName,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );

        if (!matches) return false;
      }

      return true;
    });
  }, [users, squads, searchQuery, selectedRole]);

  const filteredSquads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return squads.filter((squad) => {
      if (
        selectedSite !== "all" &&
        squad.siteId !== "all" &&
        squad.siteId !== selectedSite
      ) {
        return false;
      }

      if (query) {
        const matches = [
          squad.id,
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

    const username = newUser.useNppAsUsername
      ? newUser.npp.trim()
      : newUser.username.trim();

    if (
      !newUser.npp.trim() ||
      !newUser.fullName.trim() ||
      !username ||
      !newUser.phone.trim() ||
      !newUser.squadId
    ) {
      showToast("Lengkapi seluruh field wajib.");
      return;
    }

    if (
      users.some(
        (user) => user.npp.toLowerCase() === newUser.npp.trim().toLowerCase(),
      )
    ) {
      showToast("NPP sudah terdaftar.");
      return;
    }

    if (
      users.some(
        (user) => user.username.toLowerCase() === username.toLowerCase(),
      )
    ) {
      showToast("Username sudah digunakan.");
      return;
    }

    if (newUser.password.length < 8) {
      showToast("Password minimal 8 karakter.");
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      showToast("Konfirmasi password tidak sama.");
      return;
    }

    const created: UserAccount = {
      id: `USR-${Date.now()}`,
      npp: newUser.npp.trim(),
      fullName: newUser.fullName.trim(),
      username,
      email: newUser.email.trim(),
      phone: newUser.phone.trim(),
      role: newUser.role,
      squadId: newUser.squadId,
    };

    setUsers((previous) => [created, ...previous]);

    setIsAddUserOpen(false);
    setNewUser(initialUserForm);

    showToast("Akun pengguna berhasil dibuat.");
  };

  const handleSaveEditUser = (event: React.FormEvent) => {
    event.preventDefault();

    if (!editingUser) return;

    if (
      !editingUser.npp.trim() ||
      !editingUser.fullName.trim() ||
      !editingUser.username.trim() ||
      !editingUser.phone.trim() ||
      !editingUser.squadId
    ) {
      showToast("Lengkapi seluruh field wajib.");
      return;
    }

    const duplicateNpp = users.some(
      (user) =>
        user.id !== editingUser.id &&
        user.npp.toLowerCase() === editingUser.npp.trim().toLowerCase(),
    );

    const duplicateUsername = users.some(
      (user) =>
        user.id !== editingUser.id &&
        user.username.toLowerCase() ===
          editingUser.username.trim().toLowerCase(),
    );

    if (duplicateNpp) {
      showToast("NPP sudah digunakan akun lain.");
      return;
    }

    if (duplicateUsername) {
      showToast("Username sudah digunakan akun lain.");
      return;
    }

    const updated: UserAccount = {
      ...editingUser,
      npp: editingUser.npp.trim(),
      fullName: editingUser.fullName.trim(),
      username: editingUser.username.trim(),
      email: editingUser.email.trim(),
      phone: editingUser.phone.trim(),
    };

    setUsers((previous) =>
      previous.map((user) => (user.id === updated.id ? updated : user)),
    );

    setEditingUser(null);
    showToast("Data akun berhasil diperbarui.");
  };

  const handleDeleteUser = () => {
    if (!deletingUser) return;

    setUsers((previous) =>
      previous.filter((user) => user.id !== deletingUser.id),
    );

    setDeletingUser(null);
    showToast("Akun pengguna berhasil dihapus.");
  };

  const handleChangePassword = (event: React.FormEvent) => {
    event.preventDefault();

    if (!changingPasswordUser) return;

    if (newPassword.length < 8) {
      showToast("Password minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showToast("Konfirmasi password tidak sama.");
      return;
    }

    showToast(`Password ${changingPasswordUser.fullName} berhasil diperbarui.`);

    setChangingPasswordUser(null);
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handleCreateSquad = (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !newSquad.name.trim() ||
      !newSquad.danru.trim() ||
      !newSquad.assignedSector.trim()
    ) {
      showToast("Lengkapi nama regu, Danru, dan sektor.");
      return;
    }

    if (Number(newSquad.memberCount) < 1) {
      showToast("Jumlah anggota minimal 1.");
      return;
    }

    const created: SecuritySquadItem = {
      id: `SQD-${String(Date.now()).slice(-5)}`,
      name: newSquad.name.trim(),
      danru: newSquad.danru.trim(),
      siteId: newSquad.siteId,
      siteName: getSiteName(newSquad.siteId),
      shiftDefault: newSquad.shiftDefault,
      memberCount: Number(newSquad.memberCount),
      status: newSquad.status,
      contactRadio: newSquad.contactRadio.trim(),
      assignedSector: newSquad.assignedSector.trim(),
    };

    setSquads((previous) => [...previous, created]);
    setIsAddSquadOpen(false);
    setNewSquad(initialSquadForm);

    showToast("Regu berhasil ditambahkan.");
  };

  const handleSaveEditSquad = (event: React.FormEvent) => {
    event.preventDefault();

    if (!editingSquad) return;

    if (
      !editingSquad.name.trim() ||
      !editingSquad.danru.trim() ||
      !editingSquad.assignedSector.trim()
    ) {
      showToast("Lengkapi nama regu, Danru, dan sektor.");
      return;
    }

    const updated: SecuritySquadItem = {
      ...editingSquad,
      name: editingSquad.name.trim(),
      danru: editingSquad.danru.trim(),
      siteName: getSiteName(editingSquad.siteId),
      memberCount: Number(editingSquad.memberCount),
    };

    setSquads((previous) =>
      previous.map((squad) => (squad.id === updated.id ? updated : squad)),
    );

    setEditingSquad(null);
    showToast("Data regu berhasil diperbarui.");
  };

  const handleDeleteSquad = () => {
    if (!deletingSquad) return;

    const assignedUsers = users.filter(
      (user) => user.squadId === deletingSquad.id,
    );

    if (assignedUsers.length > 0) {
      showToast(
        "Regu masih digunakan oleh akun pengguna. Pindahkan anggota terlebih dahulu.",
      );
      setDeletingSquad(null);
      return;
    }

    setSquads((previous) =>
      previous.filter((squad) => squad.id !== deletingSquad.id),
    );

    setDeletingSquad(null);
    showToast("Regu berhasil dihapus.");
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
      disabled?: boolean;
    },
  ) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Input
        type={options?.type || "text"}
        value={value}
        required={options?.required}
        min={options?.min}
        disabled={options?.disabled}
        placeholder={options?.placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </div>
  );

  const renderRoleSelect = (
    value: UserRole,
    onChange: (value: UserRole) => void,
  ) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Peran</Label>
      <Select
        value={value}
        onValueChange={(value) => onChange(value as UserRole)}
      >
        <SelectTrigger className={`${inputClass} w-full`}>
          <SelectValue placeholder="Pilih peran" />
        </SelectTrigger>
        <SelectContent>
          {USER_ROLES.map((role) => (
            <SelectItem key={role} value={role}>
              {role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderSquadSelect = (
    value: string,
    onChange: (value: string) => void,
  ) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Regu</Label>
      <Select
        value={value}
        onValueChange={(value) => onChange(value as string)}
      >
        <SelectTrigger className={`${inputClass} w-full`}>
          <SelectValue placeholder="Pilih regu" />
        </SelectTrigger>
        <SelectContent>
          {squads.map((squad) => (
            <SelectItem key={squad.id} value={squad.id}>
              {squad.name} - {squad.siteName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderPasswordInput = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    visible: boolean,
    setVisible: (value: boolean) => void,
    placeholder: string,
  ) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          minLength={8}
          required
          className="h-9 rounded pr-10 text-xs"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 size-9 rounded"
          onClick={() => setVisible(!visible)}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* NOTIFICATION */}
      {toastMessage && (
        <div className="flex items-center justify-between gap-3 border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <Check className="size-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded"
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
            Kelola akun pengguna dan regu pengamanan PAMAREA.
          </p>
        </div>

        <Button
          className="rounded gap-2"
          onClick={() => {
            if (activeSubTab === "personel") {
              setNewUser(initialUserForm);
              setIsAddUserOpen(true);
            } else {
              setNewSquad(initialSquadForm);
              setIsAddSquadOpen(true);
            }
          }}
        >
          <Plus className="size-4" />
          {activeSubTab === "personel" ? "Tambah Akun" : "Tambah Regu"}
        </Button>
      </div>

      <Tabs
        value={activeSubTab}
        onValueChange={(value) => {
          setActiveSubTab(value as ActiveTab);
          setSearchQuery("");
          setSelectedRole("all");
        }}
      >
        <TabsList className="h-9 rounded bg-muted p-1">
          <TabsTrigger value="personel" className="rounded px-3 text-xs">
            <UserRound className="mr-2 size-3.5" />
            Akun Pengguna ({users.length})
          </TabsTrigger>
          <TabsTrigger value="regu" className="rounded px-3 text-xs">
            <Users className="mr-2 size-3.5" />
            Regu ({squads.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personel" className="mt-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari NPP, nama, username, email, regu..."
                className="h-9 rounded pl-9 text-xs"
              />
            </div>

            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as string)}
            >
              <SelectTrigger className="h-9 w-full rounded text-xs sm:w-[200px]">
                <SelectValue placeholder="Semua Peran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Peran</SelectItem>
                {USER_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchQuery || selectedRole !== "all") && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedRole("all");
                }}
              >
                <RotateCcw className="mr-1 size-3.5" />
                Reset
              </Button>
            )}
          </div>

          <div className="overflow-hidden rounded border">
            <div className="flex items-center justify-between border-b px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold">Daftar Akun Pengguna</p>
                <p className="text-[11px] text-muted-foreground">
                  Informasi akun dan hak akses pengguna.
                </p>
              </div>
              <Badge variant="secondary" className="rounded">
                {filteredUsers.length} Akun
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NPP</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>No. HP</TableHead>
                    <TableHead>Peran</TableHead>
                    <TableHead>Regu</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-28 text-center text-xs text-muted-foreground"
                      >
                        Tidak ada akun pengguna yang ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => {
                      const squad = squads.find(
                        (item) => item.id === user.squadId,
                      );

                      return (
                        <TableRow key={user.id}>
                          <TableCell className="whitespace-nowrap font-mono text-xs font-medium text-primary">
                            {user.npp}
                          </TableCell>

                          <TableCell className="min-w-[150px] text-xs font-medium">
                            {user.fullName}
                          </TableCell>

                          <TableCell className="whitespace-nowrap font-mono text-xs">
                            {user.username}
                          </TableCell>

                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {user.email || "-"}
                          </TableCell>

                          <TableCell className="whitespace-nowrap text-xs">
                            {user.phone || "-"}
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`rounded font-medium ${getRoleBadgeClass(
                                user.role,
                              )}`}
                            >
                              {user.role}
                            </Badge>
                          </TableCell>

                          <TableCell className="whitespace-nowrap text-xs">
                            {squad?.name || "-"}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded"
                                title="Edit akun"
                                onClick={() => {
                                  setEditingUsernameSameAsNpp(
                                    user.username === user.npp,
                                  );
                                  setEditingUser({ ...user });
                                }}
                              >
                                <Edit className="size-3.5" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                title="Ganti password"
                                onClick={() => {
                                  setChangingPasswordUser(user);
                                  setNewPassword("");
                                  setConfirmNewPassword("");
                                }}
                              >
                                <KeyRound className="size-3.5" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded text-destructive hover:bg-destructive/10 hover:text-destructive"
                                title="Hapus akun"
                                onClick={() => setDeletingUser(user)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="regu" className="mt-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari regu, Danru, sektor..."
                className="h-9 rounded pl-9 text-xs"
              />
            </div>

            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded"
                onClick={() => setSearchQuery("")}
              >
                <RotateCcw className="mr-1 size-3.5" />
                Reset
              </Button>
            )}
          </div>

          <div className="overflow-hidden rounded border">
            <div className="flex items-center justify-between border-b px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold">Daftar Regu Pengamanan</p>
                <p className="text-[11px] text-muted-foreground">
                  Pengelolaan regu dan wilayah tanggung jawab.
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
                    <TableHead>Status</TableHead>
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

                        <TableCell className="whitespace-nowrap text-xs font-medium">
                          {squad.name}
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-xs">
                          {squad.danru}
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-xs">
                          {squad.siteName}
                        </TableCell>

                        <TableCell className="min-w-[150px] text-xs">
                          {squad.assignedSector}
                        </TableCell>

                        <TableCell className="min-w-[170px] text-xs">
                          {squad.shiftDefault}
                        </TableCell>

                        <TableCell className="text-center text-xs font-medium">
                          {squad.memberCount}
                        </TableCell>

                        <TableCell className="whitespace-nowrap font-mono text-xs">
                          {squad.contactRadio}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`rounded ${
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
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded">
          <DialogHeader>
            <DialogTitle className="text-base">
              Tambah Akun Pengguna
            </DialogTitle>
            <DialogDescription className="text-xs">
              Masukkan identitas, informasi login, dan penempatan regu.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {renderInput(
                "NPP",
                newUser.npp,
                (value) =>
                  setNewUser((previous) => ({
                    ...previous,
                    npp: value,
                    username: previous.useNppAsUsername
                      ? value
                      : previous.username,
                  })),
                {
                  required: true,
                  placeholder: "Masukkan NPP",
                },
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
                  placeholder: "Masukkan nama lengkap",
                },
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Username</Label>
                <Input
                  value={
                    newUser.useNppAsUsername ? newUser.npp : newUser.username
                  }
                  disabled={newUser.useNppAsUsername}
                  onChange={(event) =>
                    setNewUser((previous) => ({
                      ...previous,
                      username: event.target.value,
                    }))
                  }
                  placeholder="Masukkan username"
                  required
                  className={inputClass}
                />

                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="new-user-same-npp"
                    checked={newUser.useNppAsUsername}
                    onCheckedChange={(checked) =>
                      setNewUser((previous) => ({
                        ...previous,
                        useNppAsUsername: checked === true,
                        username:
                          checked === true ? previous.npp : previous.username,
                      }))
                    }
                  />
                  <Label
                    htmlFor="new-user-same-npp"
                    className="cursor-pointer text-xs font-normal text-muted-foreground"
                  >
                    Gunakan NPP sebagai username
                  </Label>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newUser.password}
                    onChange={(event) =>
                      setNewUser((previous) => ({
                        ...previous,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Minimal 8 karakter"
                    minLength={8}
                    required
                    className="h-9 rounded pr-10 text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 size-9 rounded"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Konfirmasi Password
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={newUser.confirmPassword}
                    onChange={(event) =>
                      setNewUser((previous) => ({
                        ...previous,
                        confirmPassword: event.target.value,
                      }))
                    }
                    placeholder="Ulangi password"
                    required
                    className="h-9 rounded pr-10 text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 size-9 rounded"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

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
                  placeholder: "nama@email.com",
                },
              )}

              {renderInput(
                "No. HP",
                newUser.phone,
                (value) =>
                  setNewUser((previous) => ({
                    ...previous,
                    phone: value,
                  })),
                {
                  required: true,
                  type: "tel",
                  placeholder: "08xxxxxxxxxx",
                },
              )}

              {renderRoleSelect(newUser.role, (value) =>
                setNewUser((previous) => ({
                  ...previous,
                  role: value,
                })),
              )}

              {renderSquadSelect(newUser.squadId, (value) =>
                setNewUser((previous) => ({
                  ...previous,
                  squadId: value,
                })),
              )}
            </div>

            <div className="border bg-slate-50 p-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <LockKeyhole className="mt-0.5 size-4 shrink-0" />
                <p>
                  Password digunakan untuk login ke PAMAREA. Password wajib
                  di-hash di backend sebelum disimpan ke database.
                </p>
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
                Simpan Akun
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Akun Pengguna</DialogTitle>
            <DialogDescription className="text-xs">
              Perbarui informasi akun dan penempatan regu.
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {renderInput(
                  "NPP",
                  editingUser.npp,
                  (value) =>
                    setEditingUser((previous) =>
                      previous
                        ? {
                            ...previous,
                            npp: value,
                            username: editingUsernameSameAsNpp
                              ? value
                              : previous.username,
                          }
                        : previous,
                    ),
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
                  <Label className="text-xs font-medium">Username</Label>
                  <Input
                    value={editingUser.username}
                    disabled={editingUsernameSameAsNpp}
                    onChange={(event) =>
                      setEditingUser({
                        ...editingUser,
                        username: event.target.value,
                      })
                    }
                    required
                    className={inputClass}
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      id="edit-user-same-npp"
                      checked={editingUsernameSameAsNpp}
                      onCheckedChange={(checked) => {
                        const useNpp = checked === true;

                        setEditingUsernameSameAsNpp(useNpp);
                        setEditingUser({
                          ...editingUser,
                          username: useNpp
                            ? editingUser.npp
                            : editingUser.username === editingUser.npp
                              ? ""
                              : editingUser.username,
                        });
                      }}
                    />
                    <Label
                      htmlFor="edit-user-same-npp"
                      className="cursor-pointer text-xs font-normal text-muted-foreground"
                    >
                      Gunakan NPP sebagai username
                    </Label>
                  </div>
                </div>

                {renderInput(
                  "Email",
                  editingUser.email,
                  (value) =>
                    setEditingUser({
                      ...editingUser,
                      email: value,
                    }),
                  { type: "email" },
                )}

                {renderInput(
                  "No. HP",
                  editingUser.phone,
                  (value) =>
                    setEditingUser({
                      ...editingUser,
                      phone: value,
                    }),
                  { type: "tel", required: true },
                )}

                {renderRoleSelect(editingUser.role, (value) =>
                  setEditingUser({
                    ...editingUser,
                    role: value,
                  }),
                )}

                {renderSquadSelect(editingUser.squadId, (value) =>
                  setEditingUser({
                    ...editingUser,
                    squadId: value,
                  }),
                )}
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

      <Dialog
        open={!!changingPasswordUser}
        onOpenChange={(open) => {
          if (!open) {
            setChangingPasswordUser(null);
            setNewPassword("");
            setConfirmNewPassword("");
            setShowPassword(false);
            setShowConfirmPassword(false);
          }
        }}
      >
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <KeyRound className="size-5 text-blue-600" />
              Ganti Password
            </DialogTitle>
            <DialogDescription className="text-xs">
              Atur password baru untuk akun pengguna.
            </DialogDescription>
          </DialogHeader>

          {changingPasswordUser && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="border bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground">Akun pengguna</p>
                <p className="mt-1 text-sm font-semibold">
                  {changingPasswordUser.fullName}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {changingPasswordUser.username}
                </p>
              </div>

              {renderPasswordInput(
                "Password Baru",
                newPassword,
                setNewPassword,
                showPassword,
                setShowPassword,
                "Minimal 8 karakter",
              )}

              {renderPasswordInput(
                "Konfirmasi Password Baru",
                confirmNewPassword,
                setConfirmNewPassword,
                showConfirmPassword,
                setShowConfirmPassword,
                "Ulangi password baru",
              )}

              <Separator />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className={buttonClass}
                  onClick={() => setChangingPasswordUser(null)}
                >
                  Batal
                </Button>
                <Button type="submit" className={buttonClass}>
                  Simpan Password
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
                { required: true, placeholder: "Contoh: Regu Alpha" },
              )}

              {renderInput(
                "Komandan Regu",
                newSquad.danru,
                (value) =>
                  setNewSquad((previous) => ({
                    ...previous,
                    danru: value,
                  })),
                { required: true, placeholder: "Nama Danru" },
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Site</Label>
                <Select
                  value={newSquad.siteId}
                  onValueChange={(value) =>
                    setNewSquad((previous) => ({
                      ...previous,
                      siteId: value ?? "",
                    }))
                  }
                >
                  <SelectTrigger className={inputClass}>
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

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Shift Default</Label>
                <Select
                  value={newSquad.shiftDefault}
                  onValueChange={(value) =>
                    setNewSquad((previous) => ({
                      ...previous,
                      shiftDefault: value as SecuritySquadItem["shiftDefault"],
                    }))
                  }
                >
                  <SelectTrigger className={inputClass}>
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
                { type: "number", required: true, min: 1 },
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

      {/* ==================================================== */}
      {/* DIALOG EDIT REGU */}
      {/* ==================================================== */}
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

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Site</Label>
                  <Select
                    value={editingSquad.siteId}
                    onValueChange={(value) =>
                      setEditingSquad({
                        ...editingSquad,
                        siteId: value as string,
                        siteName: getSiteName(value as string),
                      })
                    }
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue />
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

                {renderInput(
                  "Jumlah Anggota",
                  editingSquad.memberCount,
                  (value) =>
                    setEditingSquad({
                      ...editingSquad,
                      memberCount: Number(value),
                    }),
                  { type: "number", required: true, min: 1 },
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Shift Default</Label>
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
                    <SelectTrigger className={inputClass}>
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
                  <Label className="text-xs font-medium">
                    Status Operasional
                  </Label>
                  <Select
                    value={editingSquad.status}
                    onValueChange={(value) =>
                      setEditingSquad({
                        ...editingSquad,
                        status: value as SecuritySquadItem["status"],
                      })
                    }
                  >
                    <SelectTrigger className={inputClass}>
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

      {/* ==================================================== */}
      {/* KONFIRMASI HAPUS AKUN */}
      {/* ==================================================== */}
      <Dialog
        open={!!deletingUser}
        onOpenChange={(open) => {
          if (!open) setDeletingUser(null);
        }}
      >
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <CircleAlert className="size-5 text-destructive" />
              Hapus Akun Pengguna?
            </DialogTitle>
            <DialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus akun{" "}
              <strong className="text-foreground">
                {deletingUser?.fullName}
              </strong>
              ? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              className={buttonClass}
              onClick={() => setDeletingUser(null)}
            >
              Batal
            </Button>
            <Button
              className={`${buttonClass} bg-destructive text-destructive-foreground hover:bg-destructive/90`}
              onClick={handleDeleteUser}
            >
              Hapus Akun
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deletingSquad}
        onOpenChange={(open) => {
          if (!open) setDeletingSquad(null);
        }}
      >
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <CircleAlert className="size-5 text-destructive" />
              Hapus Regu?
            </DialogTitle>
            <DialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus regu{" "}
              <strong className="text-foreground">{deletingSquad?.name}</strong>
              ?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              className={buttonClass}
              onClick={() => setDeletingSquad(null)}
            >
              Batal
            </Button>
            <Button
              className={`${buttonClass} bg-destructive text-destructive-foreground hover:bg-destructive/90`}
              onClick={handleDeleteSquad}
            >
              Hapus Regu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
