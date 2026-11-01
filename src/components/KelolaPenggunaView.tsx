import {
  Check,
  Edit,
  LockKeyhole,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
import { useRoles } from "../hooks/role/useRole";
import {
  useCreateTeam,
  useDeleteTeam,
  useTeams,
  useUpdateTeam,
} from "../hooks/team/useTeams";
import {
  useActivateUser,
  useChangePassword,
  useCreateUser,
  useDeactivateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from "../hooks/users/useUsers";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import type {
  CreateUserRequest,
  EditUserForm,
  RoleName,
  UpdateUserRequest,
  UserResponse,
} from "../types";
import type { CreateTeamPayload } from "../types/team/team";
import { getPhotoUrl } from "../utils/getPhoto";
import { PaginationComponent } from "./PaginationComponent";
import { UserDialogs } from "./UserDialogs";

interface KelolaPenggunaViewProps {
  selectedSite: string;
}

type ActiveTab = "personel" | "regu";

type TeamForm = {
  id: string;
  name: string;
  code: string;
  description: string;
  siteId: string;
};

type UserStatusAction = {
  user: UserResponse;
  activate: boolean;
};

const inputClass = "h-9 rounded text-xs";
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
  description: "",
};

const getRoleBadgeClass = (role?: string) => {
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

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
          };
        };
      }
    ).response;

    const message = response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (message) {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export const KelolaPenggunaView: React.FC<KelolaPenggunaViewProps> = ({
  selectedSite,
}) => {
  const { user } = useAuthContext();
  const siteId = user?.siteId;

  const {
    data: users,
    isLoading: isUsersLoading,
    isFetching: isUsersFetching,
    refetch: refetchUsers,
  } = useUsers();

  const {
    data: teams,
    isLoading: isTeamsLoading,
    isFetching: isTeamsFetching,
    refetch: refetchTeams,
  } = useTeams();
  const {
    data: rolesResponse,
    isLoading: isRolesLoading,
    isError: isRolesError,
  } = useRoles();

  const { mutateAsync: register, isPending: isRegistering } = useCreateUser();

  const { mutateAsync: updateUser, isPending: isUpdatingUser } =
    useUpdateUser();

  const { mutateAsync: removeUser, isPending: isDeletingUser } =
    useDeleteUser();

  const { mutateAsync: deactivateUser, isPending: isDeactivatingUser } =
    useDeactivateUser();

  const { mutateAsync: activateUser, isPending: isActivatingUser } =
    useActivateUser();

  const { mutateAsync: changePassword, isPending: isChangingPassword } =
    useChangePassword();

  const { mutateAsync: createTeam, isPending: isCreatingTeam } =
    useCreateTeam();

  const { mutateAsync: updateTeam, isPending: isUpdatingTeam } =
    useUpdateTeam();

  const { mutateAsync: deleteTeam, isPending: isDeletingTeam } =
    useDeleteTeam();

  const [activeSubTab, setActiveSubTab] = useState<ActiveTab>("personel");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<EditUserForm | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [isAddSquadOpen, setIsAddSquadOpen] = useState(false);
  const [editingSquad, setEditingSquad] = useState<TeamForm | null>(null);
  const [deletingSquad, setDeletingSquad] = useState<TeamForm | null>(null);

  const [deletingUser, setDeletingUser] = useState<UserResponse | null>(null);
  const [statusAction, setStatusAction] = useState<UserStatusAction | null>(
    null,
  );

  const [changingPasswordUser, setChangingPasswordUser] =
    useState<UserResponse | null>(null);

  const [newUser, setNewUser] = useState(initialUserForm);
  const [editingUsernameSameAsNpp, setEditingUsernameSameAsNpp] =
    useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [newSquad, setNewSquad] = useState(initialSquadForm);

  const [registerError, setRegisterError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [squadError, setSquadError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [userColumnFilters, setUserColumnFilters] = useState({
    npp: "",
    name: "",
    phone: "",
    role: "",
    team: "",
    status: "",
  });

  const [teamColumnFilters, setTeamColumnFilters] = useState({
    code: "",
    name: "",
    description: "",
    site: "",
  });

  const [previewPhoto, setPreviewPhoto] = useState<{
    url: string;
    name: string;
  } | null>(null);

  const isRefreshing = isUsersFetching || isTeamsFetching;

  const handleRefresh = async () => {
    await Promise.all([refetchUsers(), refetchTeams()]);
  };

  const handleUserColumnFilter = (
    key: keyof typeof userColumnFilters,
    value: string,
  ) => {
    setUserColumnFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const handleTeamColumnFilter = (
    key: keyof typeof teamColumnFilters,
    value: string,
  ) => {
    setTeamColumnFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const listUser = users?.data ?? [];
  const listTeam = teams ?? [];
  const roles = rolesResponse?.data ?? [];

  const roleOptions = useMemo(
    () => [...new Set(roles.map((role) => role.name))],
    [roles],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRole, activeSubTab, selectedSite, pageSize]);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return listUser.filter((item) => {
      const squadName = item.team?.name ?? "";
      const roleName = item.role?.name ?? "";
      const statusLabel = item.status === "ACTIVE" ? "Aktif" : "Nonaktif";

      if (selectedRole !== "all" && roleName !== selectedRole) {
        return false;
      }

      const globalMatch =
        !query ||
        [
          item.employeeNumber,
          item.fullName,
          item.username,
          item.email,
          item.phone,
          roleName,
          squadName,
          statusLabel,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query),
        );

      const columnMatch =
        String(item.employeeNumber ?? "")
          .toLowerCase()
          .includes(userColumnFilters.npp.trim().toLowerCase()) &&
        String(item.fullName ?? "")
          .toLowerCase()
          .includes(userColumnFilters.name.trim().toLowerCase()) &&
        String(item.phone ?? "")
          .toLowerCase()
          .includes(userColumnFilters.phone.trim().toLowerCase()) &&
        roleName
          .toLowerCase()
          .includes(userColumnFilters.role.trim().toLowerCase()) &&
        squadName
          .toLowerCase()
          .includes(userColumnFilters.team.trim().toLowerCase()) &&
        statusLabel
          .toLowerCase()
          .includes(userColumnFilters.status.trim().toLowerCase());

      return globalMatch && columnMatch;
    });
  }, [listUser, searchQuery, selectedRole, userColumnFilters]);
  const filteredSquads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return listTeam.filter((squad) => {
      if (selectedSite !== "all" && squad.siteId !== selectedSite) {
        return false;
      }

      const globalMatch =
        !query ||
        [squad.code, squad.name, squad.description, squad.site?.name].some(
          (value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(query),
        );

      const columnMatch =
        String(squad.code ?? "")
          .toLowerCase()
          .includes(teamColumnFilters.code.trim().toLowerCase()) &&
        String(squad.name ?? "")
          .toLowerCase()
          .includes(teamColumnFilters.name.trim().toLowerCase()) &&
        String(squad.description ?? "")
          .toLowerCase()
          .includes(teamColumnFilters.description.trim().toLowerCase()) &&
        String(squad.site?.name ?? "")
          .toLowerCase()
          .includes(teamColumnFilters.site.trim().toLowerCase());

      return globalMatch && columnMatch;
    });
  }, [listTeam, selectedSite, searchQuery, teamColumnFilters]);
  const activeData =
    activeSubTab === "personel" ? filteredUsers : filteredSquads;

  const totalItems = activeData.length;
  const numericPageSize = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / numericPageSize));

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * numericPageSize;
  const endIndex = Math.min(startIndex + numericPageSize, totalItems);

  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  const paginatedSquads = filteredSquads.slice(startIndex, endIndex);

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setRegisterError("");

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
        (item) =>
          item.employeeNumber?.toLowerCase() ===
          newUser.employeeNumber.trim().toLowerCase(),
      )
    ) {
      setRegisterError("NPP sudah terdaftar.");
      return;
    }

    if (
      listUser.some(
        (item) => item.username.toLowerCase() === username.toLowerCase(),
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

    const selectedTeam = listTeam.find((team) => team.id === newUser.teamId);

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

      setIsAddUserOpen(false);
      setNewUser(initialUserForm);
      showToast("Akun pengguna berhasil dibuat.");
    } catch (error) {
      setRegisterError(getErrorMessage(error, "Gagal membuat akun pengguna."));
    }
  };

  const handleOpenEditUser = (selectedUser: UserResponse) => {
    setRegisterError("");
    setSelectedUserId(selectedUser.id);

    const sameAsNpp = selectedUser.username === selectedUser.employeeNumber;

    setEditingUsernameSameAsNpp(sameAsNpp);

    setEditingUser({
      employeeNumber: selectedUser.employeeNumber ?? "",
      fullName: selectedUser.fullName ?? "",
      username: selectedUser.username ?? "",
      email: selectedUser.email ?? "",
      phone: selectedUser.phone ?? "",
      role: (selectedUser.role?.name ?? "SECURITY") as RoleName,
      teamId: selectedUser.team?.id ?? "",
    });
  };

  const handleSaveEditUser = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setRegisterError("");

    if (!editingUser || !selectedUserId) return;

    const employeeNumber = editingUser.employeeNumber.trim();
    const fullName = editingUser.fullName.trim();
    const username = editingUser.username.trim();
    const phone = editingUser.phone.trim();
    const email = editingUser.email.trim();

    if (!employeeNumber || !fullName || !username || !phone) {
      setRegisterError("Lengkapi seluruh field wajib.");
      return;
    }

    const duplicateNpp = listUser.some(
      (item) =>
        item.id !== selectedUserId &&
        item.employeeNumber?.trim().toLowerCase() ===
          employeeNumber.toLowerCase(),
    );

    if (duplicateNpp) {
      setRegisterError("NPP sudah digunakan akun lain.");
      return;
    }

    const duplicateUsername = listUser.some(
      (item) =>
        item.id !== selectedUserId &&
        item.username.trim().toLowerCase() === username.toLowerCase(),
    );

    if (duplicateUsername) {
      setRegisterError("Username sudah digunakan akun lain.");
      return;
    }

    const selectedRoleData = roles.find(
      (role) => role.name === editingUser.role,
    );

    if (!selectedRoleData) {
      setRegisterError("Role tidak ditemukan.");
      return;
    }

    const selectedTeam = listTeam.find(
      (team) => team.id === editingUser.teamId,
    );

    const payload: UpdateUserRequest = {
      employeeNumber,
      fullName,
      username,
      email: email || null,
      phone,
      roleId: selectedRoleData.id,
      teamId: selectedTeam?.id ?? null,
      siteId,
    };

    try {
      await updateUser({
        id: selectedUserId,
        payload,
      });

      setEditingUser(null);
      setSelectedUserId("");
      showToast("Data akun berhasil diperbarui.");
    } catch (error) {
      setRegisterError(getErrorMessage(error, "Gagal memperbarui akun."));
    }
  };

  const handleChangePassword = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setPasswordError("");

    if (!changingPasswordUser) return;

    if (newPassword.length < 8) {
      setPasswordError("Password baru minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("Konfirmasi password tidak sama.");
      return;
    }

    try {
      await changePassword({
        userId: changingPasswordUser.id,
        payload: {
          newPassword,
        },
      });

      setChangingPasswordUser(null);
      setNewPassword("");
      setConfirmNewPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);

      showToast("Password pengguna berhasil diperbarui.");
    } catch (error) {
      setPasswordError(
        getErrorMessage(error, "Gagal mengubah password pengguna."),
      );
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!statusAction) return;

    try {
      if (statusAction.activate) {
        await activateUser(statusAction.user.id);
        showToast("Pengguna berhasil diaktifkan.");
      } else {
        await deactivateUser(statusAction.user.id);
        showToast("Pengguna berhasil dinonaktifkan.");
      }

      setStatusAction(null);
    } catch (error) {
      showToast(
        getErrorMessage(
          error,
          statusAction.activate
            ? "Gagal mengaktifkan pengguna."
            : "Gagal menonaktifkan pengguna.",
        ),
      );
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      await removeUser(deletingUser.id);
      setDeletingUser(null);
      showToast("Akun pengguna berhasil dihapus.");
    } catch (error) {
      showToast(getErrorMessage(error, "Gagal menghapus akun pengguna."));
    }
  };

  const handleCreateSquad = async (event: React.FormEvent) => {
    event.preventDefault();
    setSquadError("");

    if (!newSquad.name.trim() || !newSquad.code.trim()) {
      setSquadError("Nama regu dan kode regu wajib diisi.");
      return;
    }

    const payload: CreateTeamPayload = {
      siteId: siteId ?? null,
      name: newSquad.name.trim(),
      code: newSquad.code.trim(),
      description: newSquad.description.trim(),
    };

    try {
      await createTeam(payload);

      setIsAddSquadOpen(false);
      setNewSquad(initialSquadForm);
      showToast("Regu berhasil ditambahkan.");
    } catch (error) {
      setSquadError(getErrorMessage(error, "Gagal menambahkan regu."));
    }
  };

  const handleOpenEditSquad = (squad: (typeof listTeam)[number]) => {
    setSquadError("");

    setEditingSquad({
      id: squad.id,
      name: squad.name ?? "",
      code: squad.code ?? "",
      description: squad.description ?? "",
      siteId: squad.siteId ?? "",
    });
  };

  const handleSaveEditSquad = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setSquadError("");

    if (!editingSquad) return;

    if (!editingSquad.name.trim() || !editingSquad.code.trim()) {
      setSquadError("Nama regu dan kode regu wajib diisi.");
      return;
    }

    try {
      await updateTeam({
        id: editingSquad.id,
        payload: {
          name: editingSquad.name.trim(),
          code: editingSquad.code.trim(),
          description: editingSquad.description.trim(),
        },
      });

      setEditingSquad(null);
      showToast("Data regu berhasil diperbarui.");
    } catch (error) {
      setSquadError(getErrorMessage(error, "Gagal memperbarui regu."));
    }
  };

  const handleDeleteSquad = async () => {
    if (!deletingSquad) return;

    try {
      await deleteTeam(deletingSquad.id);
      setDeletingSquad(null);
      showToast("Regu berhasil dihapus.");
    } catch (error) {
      showToast(getErrorMessage(error, "Gagal menghapus regu."));
    }
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
        type={options?.type ?? "text"}
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
        onValueChange={(selectedValue) => onChange(selectedValue as RoleName)}
      >
        <SelectTrigger className={`${inputClass} w-full`}>
          <SelectValue placeholder="Pilih peran">
            {roles.find((role) => role.name === value)?.name ?? "Pilih peran"}
          </SelectValue>
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
        value={value || "none"}
        onValueChange={(selectedValue) => onChange(selectedValue ?? "")}
      >
        <SelectTrigger className={`${inputClass} w-full`}>
          <SelectValue placeholder="Pilih regu">
            {value && value !== "none"
              ? (listTeam.find((squad) => squad.id === value)?.name ??
                "Pilih regu")
              : "Pilih regu"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Tanpa regu</SelectItem>
          {listTeam.map((squad) => (
            <SelectItem key={squad.id} value={squad.id}>
              {squad.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-5">
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
          <div className="flex items-center">
            <h1 className="text-xl font-semibold tracking-tight">
              Kelola Pengguna
            </h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Kelola akun pengguna dan regu pengamanan PAMAREA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh data"
          >
            <RotateCcw
              className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            className="gap-2 rounded text-black bg-[#FED400] hover:bg-[#e9c300]"
            onClick={() => {
              if (activeSubTab === "personel") {
                setRegisterError("");
                setNewUser(initialUserForm);
                setIsAddUserOpen(true);
              } else {
                setSquadError("");
                setNewSquad(initialSquadForm);
                setIsAddSquadOpen(true);
              }
            }}
          >
            <Plus className="size-4" />
            {activeSubTab === "personel" ? "Tambah Akun" : "Tambah Regu"}
          </Button>
        </div>
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
            <InputGroup className="rounded">
              <InputGroupAddon>
                <Search className="size-4 text-slate-400" />
              </InputGroupAddon>

              <InputGroupInput
                placeholder="Cari NPP, nama, username, email, regu..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </InputGroup>

            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value ?? "")}
            >
              <SelectTrigger className="h-9 w-full rounded text-xs sm:w-[200px]">
                <SelectValue placeholder="Semua Peran">
                  {selectedRole === "all"
                    ? "Semua Peran"
                    : (roleOptions.find((role) => role === selectedRole) ??
                      "Semua Peran")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Peran</SelectItem>
                {roleOptions.map((role) => (
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

          <div className="">
            <PaginationComponent
              totalItems={filteredUsers.length}
              startItem={totalItems === 0 ? 0 : startIndex + 1}
              endItem={endIndex}
              pageSize={pageSize}
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              onPageSizeChange={(value) => {
                setPageSize(String(value));
                setCurrentPage(1);
              }}
              onPageChange={(page) => {
                setCurrentPage(Math.max(1, Math.min(page, totalPages)));
              }}
            />
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
                    <TableHead>Foto</TableHead>
                    <TableHead>NPP</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>No. HP</TableHead>
                    <TableHead>Peran</TableHead>
                    <TableHead>Regu</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>

                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead></TableHead>
                    <TableHead>
                      <Input
                        value={userColumnFilters.npp}
                        onChange={(e) =>
                          handleUserColumnFilter("npp", e.target.value)
                        }
                        placeholder="Cari NPP..."
                        className="h-7 min-w-24 rounded text-[11px] font-normal"
                      />
                    </TableHead>

                    <TableHead>
                      <Input
                        value={userColumnFilters.name}
                        onChange={(e) =>
                          handleUserColumnFilter("name", e.target.value)
                        }
                        placeholder="Cari nama..."
                        className="h-7 min-w-28 rounded text-[11px] font-normal"
                      />
                    </TableHead>

                    <TableHead>
                      <Input
                        value={userColumnFilters.phone}
                        onChange={(e) =>
                          handleUserColumnFilter("phone", e.target.value)
                        }
                        placeholder="Cari HP..."
                        className="h-7 min-w-24 rounded text-[11px] font-normal"
                      />
                    </TableHead>

                    <TableHead>
                      <Input
                        value={userColumnFilters.role}
                        onChange={(e) =>
                          handleUserColumnFilter("role", e.target.value)
                        }
                        placeholder="Cari peran..."
                        className="h-7 min-w-24 rounded text-[11px] font-normal"
                      />
                    </TableHead>

                    <TableHead>
                      <Input
                        value={userColumnFilters.team}
                        onChange={(e) =>
                          handleUserColumnFilter("team", e.target.value)
                        }
                        placeholder="Cari regu..."
                        className="h-7 min-w-24 rounded text-[11px] font-normal"
                      />
                    </TableHead>

                    <TableHead>
                      <Input
                        value={userColumnFilters.status}
                        onChange={(e) =>
                          handleUserColumnFilter("status", e.target.value)
                        }
                        placeholder="Cari status..."
                        className="h-7 min-w-24 rounded text-[11px] font-normal"
                      />
                    </TableHead>

                    <TableHead />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isUsersLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-28 text-center text-xs text-muted-foreground"
                      >
                        Memuat data pengguna...
                      </TableCell>
                    </TableRow>
                  ) : paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-28 text-center text-xs text-muted-foreground"
                      >
                        Tidak ada akun pengguna yang ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <button
                            type="button"
                            disabled={!item.photoUrl}
                            onClick={() =>
                              item.photoUrl &&
                              setPreviewPhoto({
                                url: item.photoUrl,
                                name: item.fullName,
                              })
                            }
                            className="flex size-10 items-center justify-center overflow-hidden rounded-full border bg-slate-100 transition hover:opacity-80 disabled:cursor-default"
                            title={
                              item.photoUrl
                                ? "Lihat foto"
                                : "Foto tidak tersedia"
                            }
                          >
                            {item.photoUrl ? (
                              <img
                                src={getPhotoUrl(item.photoUrl)}
                                alt={item.fullName}
                                className="size-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="text-xs font-semibold text-slate-600">
                                {item.fullName
                                  ?.split(" ")
                                  .slice(0, 2)
                                  .map((name) => name.charAt(0))
                                  .join("")
                                  .toUpperCase() || "U"}
                              </span>
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-xs font-medium text-primary">
                          {item.employeeNumber}
                        </TableCell>

                        <TableCell className="min-w-[150px] text-xs font-medium">
                          {item.fullName}
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-xs">
                          {item.phone || "-"}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`rounded font-medium ${getRoleBadgeClass(
                              item.role?.name,
                            )}`}
                          >
                            {item.role?.name ?? "-"}
                          </Badge>
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-xs">
                          {item.team?.name || "-"}
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          <Switch
                            size="sm"
                            checked={item.status === "ACTIVE"}
                            disabled={isActivatingUser || isDeactivatingUser}
                            aria-label={`${
                              item.status === "ACTIVE"
                                ? "Nonaktifkan"
                                : "Aktifkan"
                            } ${item.fullName}`}
                            onCheckedChange={(checked) => {
                              setStatusAction({
                                user: item,
                                activate: checked,
                              });
                            }}
                            className="data-[state=checked]:bg-[#00BB7D] data-[state=unchecked]:bg-gray-300"
                          />
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              className="rounded"
                              title="Edit akun"
                              onClick={() => handleOpenEditUser(item)}
                            >
                              <Edit className="size-3.5" />
                              Edit
                            </Button>

                            <Button
                              variant="outline"
                              className="rounded"
                              title="Ganti"
                              onClick={() => {
                                setPasswordError("");
                                setNewPassword("");
                                setConfirmNewPassword("");
                                setChangingPasswordUser(item);
                              }}
                            >
                              <LockKeyhole className="size-3.5" />
                              Ganti
                            </Button>

                            <Button
                              variant="outline"
                              size="icon"
                              className="size-8 rounded text-destructive hover:bg-destructive/10 hover:text-destructive"
                              title="Hapus akun"
                              onClick={() => setDeletingUser(item)}
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
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari kode, nama regu, deskripsi..."
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

          <div className="">
            <PaginationComponent
              totalItems={filteredSquads.length}
              startItem={totalItems === 0 ? 0 : startIndex + 1}
              endItem={endIndex}
              pageSize={pageSize}
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              onPageSizeChange={(value) => {
                setPageSize(String(value));
                setCurrentPage(1);
              }}
              onPageChange={(page) => {
                setCurrentPage(Math.max(1, Math.min(page, totalPages)));
              }}
            />
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
                    <TableHead>ID Regu</TableHead>
                    <TableHead>Nama Regu</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>

                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead>
                      <Input
                        value={teamColumnFilters.code}
                        onChange={(e) =>
                          handleTeamColumnFilter("code", e.target.value)
                        }
                        placeholder="Cari kode..."
                        className="h-7 min-w-24 rounded text-[11px] font-normal"
                      />
                    </TableHead>

                    <TableHead>
                      <Input
                        value={teamColumnFilters.name}
                        onChange={(e) =>
                          handleTeamColumnFilter("name", e.target.value)
                        }
                        placeholder="Cari nama..."
                        className="h-7 min-w-28 rounded text-[11px] font-normal"
                      />
                    </TableHead>

                    <TableHead>
                      <Input
                        value={teamColumnFilters.description}
                        onChange={(e) =>
                          handleTeamColumnFilter("description", e.target.value)
                        }
                        placeholder="Cari deskripsi..."
                        className="h-7 min-w-28 rounded text-[11px] font-normal"
                      />
                    </TableHead>

                    <TableHead>
                      <Input
                        value={teamColumnFilters.site}
                        onChange={(e) =>
                          handleTeamColumnFilter("site", e.target.value)
                        }
                        placeholder="Cari site..."
                        className="h-7 min-w-24 rounded text-[11px] font-normal"
                      />
                    </TableHead>

                    <TableHead />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isTeamsLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-28 text-center text-xs text-muted-foreground"
                      >
                        Memuat data regu...
                      </TableCell>
                    </TableRow>
                  ) : paginatedSquads.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-28 text-center text-xs text-muted-foreground"
                      >
                        Tidak ada regu yang ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSquads.map((squad) => (
                      <TableRow key={squad.id}>
                        <TableCell className="whitespace-nowrap font-mono text-xs font-medium text-blue-600">
                          {squad.code}
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-xs font-medium">
                          {squad.name}
                        </TableCell>

                        <TableCell className="max-w-[260px] text-xs">
                          {squad.description || "-"}
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-xs">
                          {squad.site?.name ?? "-"}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              className="rounded"
                              title="Edit regu"
                              onClick={() => handleOpenEditSquad(squad)}
                            >
                              <Edit className="size-3.5" />
                              Edit
                            </Button>

                            <Button
                              variant="outline"
                              className="rounded text-destructive hover:bg-destructive/10 hover:text-destructive"
                              title="Hapus regu"
                              onClick={() =>
                                setDeletingSquad({
                                  id: squad.id,
                                  name: squad.name,
                                  code: squad.code,
                                  description: squad.description ?? "",
                                  siteId: squad.siteId ?? "",
                                })
                              }
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

      <UserDialogs
        dialogs={{
          // Preview foto
          previewPhoto,
          setPreviewPhoto,

          // Tambah pengguna
          isAddUserOpen,
          setIsAddUserOpen,
          newUser,
          setNewUser,
          handleCreateUser,
          registerError,
          setRegisterError,
          isRegistering,
          isRolesLoading,
          isRolesError,

          // Edit pengguna
          editingUser,
          setEditingUser,
          selectedUserId,
          setSelectedUserId,
          editingUsernameSameAsNpp,
          setEditingUsernameSameAsNpp,
          handleSaveEditUser,
          isUpdatingUser,

          // Ganti password
          changingPasswordUser,
          setChangingPasswordUser,
          newPassword,
          setNewPassword,
          confirmNewPassword,
          setConfirmNewPassword,
          passwordError,
          setPasswordError,
          handleChangePassword,
          isChangingPassword,
          showPassword,
          setShowPassword,
          showConfirmPassword,
          setShowConfirmPassword,

          // Tambah regu
          isAddSquadOpen,
          setIsAddSquadOpen,
          newSquad,
          setNewSquad,
          handleCreateSquad,
          squadError,
          setSquadError,
          isCreatingTeam,

          // Edit regu
          editingSquad,
          setEditingSquad,
          handleSaveEditSquad,
          isUpdatingTeam,

          // Konfirmasi status pengguna
          statusAction,
          setStatusAction,
          handleConfirmStatusChange,
          isActivatingUser,
          isDeactivatingUser,

          // Hapus pengguna
          deletingUser,
          setDeletingUser,
          handleDeleteUser,
          isDeletingUser,

          // Hapus regu
          deletingSquad,
          setDeletingSquad,
          handleDeleteSquad,
          isDeletingTeam,

          // Helper input
          renderInput,
          renderRoleSelect,
          renderSquadSelect,
        }}
      />
    </div>
  );
};
