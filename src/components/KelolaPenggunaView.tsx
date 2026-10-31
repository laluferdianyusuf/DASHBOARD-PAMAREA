import React, { useMemo, useState } from "react";

import {
  INITIAL_SQUADS,
  SITES,
  USER_ACCOUNTS,
  type SecuritySquadItem,
  type UserAccount,
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
import { useAuthContext } from "../hooks/auth/useAuthContext";
import {
  useActivateUser,
  useCreateUser,
  useDeactivateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from "../hooks/users/useUsers";
import { useCreateTeam, useTeams } from "../hooks/team/useTeams";
import { useRoles } from "../hooks/role/useRole";
import {
  CreateUserRequest,
  EditUserForm,
  RoleName,
  UpdateUserRequest,
  UserResponse,
} from "../types";
import { CreateTeamPayload } from "../types/team/team";
import { Switch } from "@/components/ui/switch";

interface KelolaPenggunaViewProps {
  selectedSite: string;
}

type ActiveTab = "personel" | "regu";

const USER_ROLES: RoleName[] = [
  "SECURITY",
  "DANRU_SECURITY",
  "DANRU_SECURITY",
  "ADMIN",
];

const inputClass = "rounded text-xs";
const buttonClass = "rounded";

const initialUserForm = {
  employeeNumber: "",
  fullName: "",
  username: "",
  useEmployeeAsUsername: true,
  password: "",
  email: "",
  phone: "",
  role: "SECURITY" as RoleName,
  siteId: "",
  teamId: "",
};

const initialSquadForm = {
  name: "",
  code: "",
  decription: "",
};

const getSiteName = (siteId: string) => {
  return (
    SITES.find((site) => site.id === siteId)?.name.replace(
      /^Site [A-D] - /,
      "",
    ) || "-"
  );
};

const getRoleBadgeClass = (role: RoleName | undefined): string => {
  switch (role) {
    case "ADMIN":
      return "border-purple-200 bg-purple-50 text-purple-700";
    case "DANRU_SECURITY":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "CHIEF_SECURITY":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
};

export const KelolaPenggunaView: React.FC<KelolaPenggunaViewProps> = ({
  selectedSite,
}) => {
  const { user } = useAuthContext();
  const siteId = user?.siteId;
  const { data: users } = useUsers();
  const { data: teams } = useTeams();

  const { mutateAsync: register, isPending: isRegistering } = useCreateUser();
  const { mutateAsync: updateUser, isPending: isUpdatingUser } =
    useUpdateUser();
  const { mutateAsync: removeUser, isPending: isDeletingUser } =
    useDeleteUser();
  const { mutateAsync: deactivated } = useDeactivateUser();
  const { mutateAsync: activated } = useActivateUser();
  const { mutateAsync: createTeam, isPending: isCreateTeam } = useCreateTeam();
  const {
    data: rolesResponse,
    isPending: isRolesPending,
    isError: isRolesError,
  } = useRoles();

  const [activeSubTab, setActiveSubTab] = useState<ActiveTab>("personel");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<EditUserForm | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserResponse | null>(null);

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
  const [registerError, setRegisterError] = useState("");

  const [selectedUserId, setSelectedUserId] = useState("");

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3500);
  };

  const listUser = users?.data ?? [];

  console.log(listUser);

  const roles = rolesResponse?.data ?? [];

  const listTeam = teams ?? [];

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return listUser.filter((user) => {
      if (selectedRole !== "all" && user.role?.name !== selectedRole) {
        return false;
      }

      if (query) {
        const squadName =
          listTeam.find((squad) => squad.id === user.team?.name)?.name || "";

        const matches = [
          user.employeeNumber,
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
  }, [users, listTeam, searchQuery, selectedRole]);

  const filteredSquads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return listTeam.filter((squad) => {
      if (
        selectedSite !== "all" &&
        squad.siteId !== "all" &&
        squad.siteId !== selectedSite
      ) {
        return false;
      }

      if (query) {
        const matches = [squad.id, squad.name, squad.site].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );

        if (!matches) return false;
      }

      return true;
    });
  }, [listTeam, selectedSite, searchQuery]);

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();

    const username = newUser.useEmployeeAsUsername
      ? newUser.employeeNumber.trim()
      : newUser.username.trim();

    if (
      !newUser.employeeNumber.trim() ||
      !newUser.fullName.trim() ||
      !username ||
      !newUser.phone.trim()
    ) {
      setRegisterError("Lengkapi seluruh field wajib.");
      return;
    }

    if (
      listUser.some(
        (user) =>
          user.employeeNumber?.toLowerCase() ===
          newUser.employeeNumber.trim().toLowerCase(),
      )
    ) {
      setRegisterError("NPP sudah terdaftar.");
      return;
    }

    if (
      listUser.some(
        (user) => user.username.toLowerCase() === username.toLowerCase(),
      )
    ) {
      setRegisterError("Username sudah digunakan.");
      return;
    }

    if (newUser.password.length < 8) {
      setRegisterError("Password minimal 8 karakter.");
      return;
    }

    const selectedRoleData = roles.find((role) => role.name === newUser.role);

    if (!selectedRoleData) {
      setRegisterError("Role belum ditemukan. Periksa data role dari backend.");
      return;
    }

    const selectedTeam = teams?.find((team) => team.name === newUser.teamId);

    // if (!selectedTeam) {
    //   showToast("Regu tidak ditemukan. Silakan pilih regu yang valid.");
    //   return;
    // }

    const payload: CreateUserRequest = {
      employeeNumber: newUser.employeeNumber.trim(),
      fullName: newUser.fullName.trim(),
      username,
      phone: newUser.phone.trim(),
      email: newUser.email.trim(),
      password: newUser.password,
      roleId: selectedRoleData.id,
      siteId,
      teamId: selectedTeam?.id,
    };
    try {
      await register(payload);

      showToast("Akun pengguna berhasil dibuat.");
      setIsAddUserOpen(false);
      setNewUser(initialUserForm);
    } catch (error) {
      setRegisterError("Gagal saat membuat user");
    }
  };

  const handleSaveEditUser = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!editingUser || !selectedUserId) return;

    const employeeNumber = editingUser.employeeNumber.trim();
    const fullName = editingUser.fullName.trim();
    const username = editingUser.username.trim();
    const phone = editingUser.phone.trim();
    const email = editingUser.email.trim();

    // Validasi field wajib
    if (!employeeNumber || !fullName || !username || !phone) {
      setRegisterError("Lengkapi seluruh field wajib.");
      return;
    }

    // Validasi duplikasi NPP
    const duplicateNpp = listUser.some(
      (user) =>
        user.id !== selectedUserId &&
        user.employeeNumber?.trim().toLowerCase() ===
          employeeNumber.toLowerCase(),
    );

    if (duplicateNpp) {
      setRegisterError("NPP sudah digunakan akun lain.");
      return;
    }

    // Validasi duplikasi username
    const duplicateUsername = listUser.some(
      (user) =>
        user.id !== selectedUserId &&
        user.username.trim().toLowerCase() === username.toLowerCase(),
    );

    if (duplicateUsername) {
      setRegisterError("Username sudah digunakan akun lain.");
      return;
    }

    // Cari role berdasarkan nama role
    const selectedRoleData = roles.find(
      (role) => role.name === editingUser.role,
    );

    // Pastikan regu yang dipilih valid.
    // renderSquadSelect harus menyimpan team.id ke dalam teamId.
    const selectedTeam = listTeam.find(
      (team) => team.name === editingUser.teamId,
    );

    // if (!selectedTeam) {
    //   showToast("Regu tidak ditemukan. Silakan pilih regu yang valid.");
    //   return;
    // }

    // Payload khusus untuk backend
    const payload: UpdateUserRequest = {
      employeeNumber,
      fullName,
      username,
      email: email || null,
      phone,
      roleId: selectedRoleData?.id,
      teamId: selectedTeam?.id,
      siteId,
    };

    try {
      await updateUser({
        id: selectedUserId,
        payload,
      });

      setSelectedUserId("");
      setEditingUser(null);

      showToast("Data akun berhasil diperbarui.");
    } catch (error) {
      console.error("Gagal saat update user:", error);
      if (error && typeof error === "object" && "response" in error) {
        const response = (
          error as {
            response?: {
              status?: number;
              data?: {
                message?: string | string[];
              };
            };
          }
        ).response;

        if (response?.status === 409) {
          const message = response.data?.message;

          setRegisterError(
            Array.isArray(message)
              ? message.join(", ")
              : message ||
                  "Data bertentangan dengan data yang sudah ada. Periksa Satpam ID, username, dan email.",
          );
          return;
        }

        if (response?.status === 400) {
          const message = response.data?.message;

          setRegisterError(
            Array.isArray(message)
              ? message.join(", ")
              : message || "Data yang dikirim tidak valid.",
          );
          return;
        }
      }
      setRegisterError("Gagal saat update user.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = window.confirm(
      "Apakah kamu yakin ingin mengahpus user ini?",
    );
    if (!confirmed) return;

    try {
      await removeUser(userId);
      setDeletingUser(null);
      showToast("Akun pengguna berhasil dihapus.");
    } catch (error) {
      showToast("Gagal saat menghapus user");
      console.log("Gagal saat mengahpus user", error);
    }
  };

  const deactivatedUser = async (userId: string) => {
    const confirmed = window.confirm(
      "Apakah kamu yakin ingin menonaktifkan user ini?",
    );

    if (!confirmed) return;

    try {
      await deactivated(userId);

      showToast("User berhasil dinonaktifkan.");
      showToast("");
    } catch (error) {
      console.error("Gagal menonaktifkan user:", error);
      showToast("Gagal menonaktifkan user. Silakan coba kembali.");
      showToast("");
    }
  };

  const activatedUser = async (userId: string) => {
    const confirmed = window.confirm(
      "Apakah kamu yakin ingin mengaktifkan user ini?",
    );

    if (!confirmed) return;

    try {
      await activated(userId);

      showToast("User berhasil diaktifkan.");
      showToast("");
    } catch (error) {
      console.error("Gagal mengaktifkan user:", error);
      showToast("Gagal mengaktifkan user. Silakan coba kembali.");
      showToast("");
    }
  };

  const handleCreateSquad = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !newSquad.code.trim() ||
      !newSquad.name.trim() ||
      !newSquad.decription.trim()
    ) {
      showToast("Lengkapi nama regu, Danru, dan sektor.");
      return;
    }

    const payload: CreateTeamPayload = {
      siteId: siteId ?? null,
      name: newSquad.name,
      code: newSquad.code,
      description: newSquad.decription,
    };

    console.log("PAYLOAD", JSON.stringify(payload, null, 2));
    try {
      await createTeam(payload);

      setIsAddSquadOpen(false);
      setNewSquad(initialSquadForm);
      showToast("Regu berhasil ditambahkan.");
    } catch (error) {
      showToast("Gagal Register Regu");
    }
  };

  // const handleSaveEditSquad = (event: React.FormEvent) => {
  //   event.preventDefault();

  //   if (!editingSquad) return;

  //   if (
  //     !editingSquad.name.trim() ||
  //     !editingSquad.danru.trim() ||
  //     !editingSquad.assignedSector.trim()
  //   ) {
  //     showToast("Lengkapi nama regu, Danru, dan sektor.");
  //     return;
  //   }

  //   const updated: SecuritySquadItem = {
  //     ...editingSquad,
  //     name: editingSquad.name.trim(),
  //     danru: editingSquad.danru.trim(),
  //     siteName: getSiteName(editingSquad.siteId),
  //     memberCount: Number(editingSquad.memberCount),
  //   };

  //   setSquads((previous) =>
  //     previous.map((squad) => (squad.id === updated.id ? updated : squad)),
  //   );

  //   setEditingSquad(null);
  //   showToast("Data regu berhasil diperbarui.");
  // };

  // const handleDeleteSquad = () => {
  //   if (!deletingSquad) return;

  //   const assignedUsers = users.filter(
  //     (user) => user.squadId === deletingSquad.id,
  //   );

  //   if (assignedUsers.length > 0) {
  //     showToast(
  //       "Regu masih digunakan oleh akun pengguna. Pindahkan anggota terlebih dahulu.",
  //     );
  //     setDeletingSquad(null);
  //     return;
  //   }

  //   setSquads((previous) =>
  //     previous.filter((squad) => squad.id !== deletingSquad.id),
  //   );

  //   setDeletingSquad(null);
  //   showToast("Regu berhasil dihapus.");
  // };

  const handleOpenEditUser = (user: UserResponse) => {
    setSelectedUserId(user.id);

    setEditingUsernameSameAsNpp(user.username === user.employeeNumber);

    setEditingUser({
      employeeNumber: user.employeeNumber ?? "",
      fullName: user.fullName ?? "",
      username: user.username ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      role: (user.role?.name ?? "SECURITY") as RoleName,
      teamId: user.team?.name ?? "",
    });
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
    value: RoleName,
    onChange: (value: RoleName) => void,
  ) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Peran</Label>
      <Select
        value={value}
        onValueChange={(value) => onChange(value as RoleName)}
      >
        <SelectTrigger className={`${inputClass} w-full`}>
          <SelectValue placeholder="Pilih peran" />
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => (
            <SelectItem key={role.id} value={role.name}>
              {role.name}
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
          {listTeam.map((squad) => (
            <SelectItem key={squad.id} value={squad.name}>
              {squad.name} - {squad.site.name}
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
        <div className="">
          <div className="flex items-center">
            <div className="bg-[#00529C] px-1 py-3 h-[px] rounded-xs" />
            <h1 className="text-xl font-semibold tracking-tight ml-1">
              Kelola Pengguna
            </h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Kelola akun pengguna dan regu pengamanan PAMAREA.
          </p>
        </div>

        <Button
          className="rounded gap-2 bg-[#FED400] text-black hover:bg-yellow-400"
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
            Akun Pengguna ({listUser.length})
          </TabsTrigger>
          <TabsTrigger value="regu" className="rounded px-3 text-xs">
            <Users className="mr-2 size-3.5" />
            Regu ({listTeam.length})
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
                    {/* <TableHead>Username</TableHead> */}
                    <TableHead>No. HP</TableHead>
                    <TableHead>Peran</TableHead>
                    <TableHead>Regu</TableHead>
                    <TableHead>Status</TableHead>
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
                      const squad = listTeam.find(
                        (item) => item.id === user.team?.name,
                      );

                      return (
                        <TableRow key={user.id}>
                          <TableCell className="whitespace-nowrap font-mono text-xs font-medium text-primary">
                            {user.employeeNumber}
                          </TableCell>

                          <TableCell className="min-w-[150px] text-xs font-medium">
                            {user.fullName}
                          </TableCell>

                          {/* <TableCell className="whitespace-nowrap font-mono text-xs">
                            {user.username}
                          </TableCell> */}

                          <TableCell className="whitespace-nowrap text-xs">
                            {user.phone || "-"}
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`rounded font-medium ${getRoleBadgeClass(
                                user.role?.name,
                              )}`}
                            >
                              {user.role?.name}
                            </Badge>
                          </TableCell>

                          <TableCell className="whitespace-nowrap text-xs">
                            {user.team?.name || "-"}
                          </TableCell>

                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            <Switch
                              checked={user.status === "ACTIVE"}
                              aria-label={`${
                                user.status === "ACTIVE"
                                  ? "Nonaktifkan"
                                  : "Aktifkan"
                              } ${user.fullName}`}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  activatedUser(user.id);
                                } else {
                                  deactivatedUser(user.id);
                                }
                              }}
                              className="data-[state=checked]:bg-[#00BB7D] data-[state=unchecked]:bg-gray-300"
                            />
                          </TableCell>
                          {/* <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={user.status === "ACTIVE"}
                              aria-label={`${
                                user.status === "ACTIVE"
                                  ? "Nonaktifkan"
                                  : "Aktifkan"
                              } ${user.fullName}`}
                              onClick={() => {
                                if (user.status === "ACTIVE") {
                                  deactivatedUser(user.id);
                                } else {
                                  activatedUser(user.id);
                                }
                              }}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                user.status === "ACTIVE"
                                  ? "bg-emerald-500 focus:ring-emerald-500"
                                  : "bg-gray-300 focus:ring-gray-400"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                  user.status === "ACTIVE"
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                }`}
                              />
                            </button>
                          </TableCell> */}

                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded"
                                title="Edit akun"
                                // onClick={() => {
                                //   setEditingUsernameSameAsNpp(
                                //     user.username === user.id,
                                //   );
                                //   setEditingUser({ ...user });
                                // }}
                                onClick={() => {
                                  handleOpenEditUser(user);
                                }}
                              >
                                <Edit className="size-3.5" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded text-destructive hover:bg-destructive/10 hover:text-destructive"
                                title="Hapus akun"
                                onClick={() => handleDeleteUser(user.id)}
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
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Site</TableHead>
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
                          {squad.code}
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-xs font-medium">
                          {squad.name}
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-xs">
                          {squad.description}
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-xs">
                          {squad.site.name}
                        </TableCell>

                        {/* <TableCell className="text-center text-xs font-medium">
                          {squad.memberCount}
                        </TableCell> */}

                        {/* <TableCell>
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
                        </TableCell> */}

                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded"
                              title="Edit regu"
                              // onClick={() => setEditingSquad({ ...squad })}
                            >
                              <Edit className="size-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded text-destructive hover:bg-destructive/10 hover:text-destructive"
                              title="Hapus regu"
                              // onClick={() => setDeletingSquad(squad)}
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
        <DialogContent
          onClick={() => setRegisterError("")}
          className="max-h-[90vh] max-w-xl overflow-y-auto rounded"
        >
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
                newUser.employeeNumber,
                (value) =>
                  setNewUser((previous) => ({
                    ...previous,
                    employeeNumber: value,
                    username: previous.useEmployeeAsUsername
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
                    newUser.useEmployeeAsUsername
                      ? newUser.employeeNumber
                      : newUser.username
                  }
                  disabled={newUser.useEmployeeAsUsername}
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
                    checked={newUser.useEmployeeAsUsername}
                    onCheckedChange={(checked) =>
                      setNewUser((previous) => ({
                        ...previous,
                        useEmployeeAsUsername: checked === true,
                        username:
                          checked === true
                            ? previous.employeeNumber
                            : previous.username,
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
                  teamId: "",
                })),
              )}

              {renderSquadSelect(newUser.teamId, (value) =>
                setNewUser((previous) => ({
                  ...previous,
                  teamId: value,
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

            {registerError && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <span>{registerError}</span>
              </div>
            )}

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
          if (!open) {
            setEditingUser(null);
            setSelectedUserId("");
          }
        }}
      >
        <DialogContent
          onClick={() => setRegisterError("")}
          className="max-h-[90vh] max-w-xl overflow-y-auto rounded"
        >
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
                  editingUser.employeeNumber,
                  (value) =>
                    setEditingUser((previous) =>
                      previous
                        ? {
                            ...previous,
                            employeeNumber: value,
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
                    setEditingUser((previous) =>
                      previous ? { ...previous, fullName: value } : previous,
                    ),
                  { required: true },
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Username</Label>

                  <Input
                    value={editingUser.username}
                    disabled={editingUsernameSameAsNpp}
                    onChange={(event) =>
                      setEditingUser((previous) =>
                        previous
                          ? {
                              ...previous,
                              username: event.target.value,
                            }
                          : previous,
                      )
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

                        setEditingUser((previous) =>
                          previous
                            ? {
                                ...previous,
                                username: useNpp
                                  ? previous.employeeNumber
                                  : previous.username ===
                                      previous.employeeNumber
                                    ? ""
                                    : previous.username,
                              }
                            : previous,
                        );
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
                    setEditingUser((previous) =>
                      previous ? { ...previous, email: value } : previous,
                    ),
                  { type: "email" },
                )}

                {renderInput(
                  "No. HP",
                  editingUser.phone,
                  (value) =>
                    setEditingUser((previous) =>
                      previous ? { ...previous, phone: value } : previous,
                    ),
                  { type: "tel", required: true },
                )}

                {renderRoleSelect(editingUser.role, (value) =>
                  setEditingUser((previous) =>
                    previous
                      ? {
                          ...previous,
                          role: value,
                        }
                      : previous,
                  ),
                )}

                {renderSquadSelect(editingUser.teamId, (value) =>
                  setEditingUser((previous) =>
                    previous
                      ? {
                          ...previous,
                          teamId: value,
                        }
                      : previous,
                  ),
                )}
              </div>

              <Separator />
              {registerError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  <span>{registerError}</span>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className={buttonClass}
                  disabled={isUpdatingUser}
                  onClick={() => {
                    setEditingUser(null);
                    setSelectedUserId("");
                  }}
                >
                  Batal
                </Button>

                <Button
                  type="submit"
                  className={buttonClass}
                  disabled={isUpdatingUser}
                >
                  {isUpdatingUser ? "Menyimpan..." : "Simpan Perubahan"}
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
                "Code Regu",
                newSquad.code,
                (value) =>
                  setNewSquad((previous) => ({
                    ...previous,
                    code: value,
                  })),
                { required: true, placeholder: "REGU A" },
              )}

              {renderInput(
                "Description",
                newSquad.decription,
                (value) =>
                  setNewSquad((previous) => ({
                    ...previous,
                    decription: value,
                  })),
                { placeholder: "Deskripsi" },
              )}
            </div>

            <Separator />

            {registerError && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <span>{registerError}</span>
              </div>
            )}

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
      {/* <Dialog
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
      </Dialog> */}

      {/* ==================================================== */}
      {/* KONFIRMASI HAPUS AKUN */}
      {/* ==================================================== */}
      {/* <Dialog
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
      </Dialog> */}

      {/* <Dialog
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
      </Dialog> */}
    </div>
  );
};
