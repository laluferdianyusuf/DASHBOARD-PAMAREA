import { Eye, EyeOff, LockKeyhole } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";

const buttonClass = "rounded";
const inputClass = "h-9 rounded text-xs";

interface UserDialogsProps {
  dialogs: Record<string, any>;
}

export const UserDialogs = ({ dialogs: d }: UserDialogsProps) => {
  return (
    <>
      {/* Preview Foto */}
      <Dialog
        open={!!d.previewPhoto}
        onOpenChange={(open) => {
          if (!open) d.setPreviewPhoto(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Foto Personel</DialogTitle>
            <DialogDescription>{d.previewPhoto?.name}</DialogDescription>
          </DialogHeader>

          {d.previewPhoto && (
            <div className="flex justify-center">
              <img
                src={d.previewPhoto.url}
                alt={d.previewPhoto.name}
                className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tambah Akun */}
      <Dialog
        open={d.isAddUserOpen}
        onOpenChange={(open) => {
          d.setIsAddUserOpen(open);
          if (!open) d.setRegisterError("");
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded">
          <DialogHeader>
            <DialogTitle className="text-base">
              Tambah Akun Pengguna
            </DialogTitle>
            <DialogDescription className="text-xs">
              Masukkan identitas, informasi login, dan penempatan regu.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={d.handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {d.renderInput(
                "NPP",
                d.newUser.employeeNumber,
                (value: string) =>
                  d.setNewUser((previous: any) => ({
                    ...previous,
                    employeeNumber: value,
                    username: previous.useEmployeeAsUsername
                      ? value
                      : previous.username,
                  })),
                { required: true, placeholder: "Masukkan NPP" },
              )}

              {d.renderInput(
                "Nama Lengkap",
                d.newUser.fullName,
                (value: string) =>
                  d.setNewUser((previous: any) => ({
                    ...previous,
                    fullName: value,
                  })),
                { required: true, placeholder: "Masukkan nama lengkap" },
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Username</Label>
                <Input
                  value={
                    d.newUser.useEmployeeAsUsername
                      ? d.newUser.employeeNumber
                      : d.newUser.username
                  }
                  disabled={d.newUser.useEmployeeAsUsername}
                  onChange={(event) =>
                    d.setNewUser((previous: any) => ({
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
                    checked={d.newUser.useEmployeeAsUsername}
                    onCheckedChange={(checked) =>
                      d.setNewUser((previous: any) => ({
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
                    type={d.showPassword ? "text" : "password"}
                    value={d.newUser.password}
                    onChange={(event) =>
                      d.setNewUser((previous: any) => ({
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
                    onClick={() =>
                      d.setShowPassword((previous: boolean) => !previous)
                    }
                  >
                    {d.showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              {d.renderInput(
                "Email",
                d.newUser.email,
                (value: string) =>
                  d.setNewUser((previous: any) => ({
                    ...previous,
                    email: value,
                  })),
                { type: "email", placeholder: "nama@email.com" },
              )}

              {d.renderInput(
                "No. HP",
                d.newUser.phone,
                (value: string) =>
                  d.setNewUser((previous: any) => ({
                    ...previous,
                    phone: value,
                  })),
                {
                  required: true,
                  type: "tel",
                  placeholder: "08xxxxxxxxxx",
                },
              )}

              {d.renderRoleSelect(d.newUser.role, (value: any) =>
                d.setNewUser((previous: any) => ({
                  ...previous,
                  role: value,
                  teamId: "",
                })),
              )}

              {d.renderSquadSelect(d.newUser.teamId, (value: string) =>
                d.setNewUser((previous: any) => ({
                  ...previous,
                  teamId: value,
                })),
              )}
            </div>

            <div className="border bg-slate-50 p-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <LockKeyhole className="mt-0.5 size-4 shrink-0" />
                <p>
                  Password digunakan untuk login ke PAMAREA. Password harus
                  di-hash di backend sebelum disimpan ke database.
                </p>
              </div>
            </div>

            {d.registerError && (
              <div
                role="alert"
                className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700"
              >
                {d.registerError}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className={buttonClass}
                disabled={d.isRegistering}
                onClick={() => d.setIsAddUserOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className={buttonClass}
                disabled={d.isRegistering || d.isRolesLoading || d.isRolesError}
              >
                {d.isRegistering ? "Menyimpan..." : "Simpan Akun"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Akun */}
      <Dialog
        open={!!d.editingUser}
        onOpenChange={(open) => {
          if (!open && !d.isUpdatingUser) {
            d.setEditingUser(null);
            d.setSelectedUserId("");
            d.setRegisterError("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Akun Pengguna</DialogTitle>
            <DialogDescription className="text-xs">
              Perbarui informasi akun dan penempatan regu.
            </DialogDescription>
          </DialogHeader>

          {d.editingUser && (
            <form onSubmit={d.handleSaveEditUser} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {d.renderInput(
                  "NPP",
                  d.editingUser.employeeNumber,
                  (value: string) =>
                    d.setEditingUser((previous: any) =>
                      previous
                        ? {
                            ...previous,
                            employeeNumber: value,
                            username: d.editingUsernameSameAsNpp
                              ? value
                              : previous.username,
                          }
                        : previous,
                    ),
                  { required: true },
                )}

                {d.renderInput(
                  "Nama Lengkap",
                  d.editingUser.fullName,
                  (value: string) =>
                    d.setEditingUser((previous: any) =>
                      previous ? { ...previous, fullName: value } : previous,
                    ),
                  { required: true },
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Username</Label>
                  <Input
                    value={d.editingUser.username}
                    disabled={d.editingUsernameSameAsNpp}
                    onChange={(event) =>
                      d.setEditingUser((previous: any) =>
                        previous
                          ? { ...previous, username: event.target.value }
                          : previous,
                      )
                    }
                    required
                    className={inputClass}
                  />

                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      id="edit-user-same-npp"
                      checked={d.editingUsernameSameAsNpp}
                      onCheckedChange={(checked) => {
                        const useNpp = checked === true;
                        d.setEditingUsernameSameAsNpp(useNpp);

                        d.setEditingUser((previous: any) =>
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

                {d.renderInput(
                  "Email",
                  d.editingUser.email,
                  (value: string) =>
                    d.setEditingUser((previous: any) =>
                      previous ? { ...previous, email: value } : previous,
                    ),
                  { type: "email" },
                )}

                {d.renderInput(
                  "No. HP",
                  d.editingUser.phone,
                  (value: string) =>
                    d.setEditingUser((previous: any) =>
                      previous ? { ...previous, phone: value } : previous,
                    ),
                  { type: "tel", required: true },
                )}

                {d.renderRoleSelect(d.editingUser.role, (value: any) =>
                  d.setEditingUser((previous: any) =>
                    previous ? { ...previous, role: value } : previous,
                  ),
                )}

                {d.renderSquadSelect(d.editingUser.teamId, (value: string) =>
                  d.setEditingUser((previous: any) =>
                    previous ? { ...previous, teamId: value } : previous,
                  ),
                )}
              </div>

              {d.registerError && (
                <div
                  role="alert"
                  className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700"
                >
                  {d.registerError}
                </div>
              )}

              <Separator />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className={buttonClass}
                  disabled={d.isUpdatingUser}
                  onClick={() => {
                    d.setEditingUser(null);
                    d.setSelectedUserId("");
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className={buttonClass}
                  disabled={d.isUpdatingUser}
                >
                  {d.isUpdatingUser ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Ganti Password */}
      <Dialog
        open={!!d.changingPasswordUser}
        onOpenChange={(open) => {
          if (!open && !d.isChangingPassword) {
            d.setChangingPasswordUser(null);
            d.setNewPassword("");
            d.setConfirmNewPassword("");
            d.setPasswordError("");
            d.setShowPassword(false);
            d.setShowConfirmPassword(false);
          }
        }}
      >
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <LockKeyhole className="size-4" />
              Ganti Password
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ganti password untuk akun{" "}
              <strong className="text-foreground">
                {d.changingPasswordUser?.fullName}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={d.handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Password Baru</Label>
              <div className="relative">
                <Input
                  type={d.showPassword ? "text" : "password"}
                  value={d.newPassword}
                  onChange={(event) => d.setNewPassword(event.target.value)}
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
                  onClick={() =>
                    d.setShowPassword((previous: boolean) => !previous)
                  }
                >
                  {d.showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Konfirmasi Password Baru
              </Label>
              <div className="relative">
                <Input
                  type={d.showConfirmPassword ? "text" : "password"}
                  value={d.confirmNewPassword}
                  onChange={(event) =>
                    d.setConfirmNewPassword(event.target.value)
                  }
                  placeholder="Ulangi password baru"
                  minLength={8}
                  required
                  className="h-9 rounded pr-10 text-xs"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 size-9 rounded"
                  onClick={() =>
                    d.setShowConfirmPassword((previous: boolean) => !previous)
                  }
                >
                  {d.showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            {d.passwordError && (
              <div
                role="alert"
                className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700"
              >
                {d.passwordError}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className={buttonClass}
                disabled={d.isChangingPassword}
                onClick={() => d.setChangingPasswordUser(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className={buttonClass}
                disabled={d.isChangingPassword}
              >
                {d.isChangingPassword ? "Memproses..." : "Simpan Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tambah Regu */}
      <Dialog
        open={d.isAddSquadOpen}
        onOpenChange={(open) => {
          d.setIsAddSquadOpen(open);
          if (!open) d.setSquadError("");
        }}
      >
        <DialogContent className="max-w-xl rounded">
          <DialogHeader>
            <DialogTitle className="text-base">
              Tambah Regu Pengamanan
            </DialogTitle>
            <DialogDescription className="text-xs">
              Masukkan informasi regu dan wilayah tanggung jawab.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={d.handleCreateSquad} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {d.renderInput(
                "Nama Regu",
                d.newSquad.name,
                (value: string) =>
                  d.setNewSquad((previous: any) => ({
                    ...previous,
                    name: value,
                  })),
                {
                  required: true,
                  placeholder: "Contoh: Regu Alpha",
                },
              )}

              {d.renderInput(
                "Kode Regu",
                d.newSquad.code,
                (value: string) =>
                  d.setNewSquad((previous: any) => ({
                    ...previous,
                    code: value,
                  })),
                {
                  required: true,
                  placeholder: "Contoh: REGU-A",
                },
              )}

              <div className="sm:col-span-2">
                {d.renderInput(
                  "Deskripsi",
                  d.newSquad.description,
                  (value: string) =>
                    d.setNewSquad((previous: any) => ({
                      ...previous,
                      description: value,
                    })),
                  { placeholder: "Deskripsi regu" },
                )}
              </div>
            </div>

            {d.squadError && (
              <div
                role="alert"
                className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700"
              >
                {d.squadError}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className={buttonClass}
                disabled={d.isCreatingTeam}
                onClick={() => d.setIsAddSquadOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className={buttonClass}
                disabled={d.isCreatingTeam}
              >
                {d.isCreatingTeam ? "Menyimpan..." : "Simpan Regu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Regu */}
      <Dialog
        open={!!d.editingSquad}
        onOpenChange={(open) => {
          if (!open && !d.isUpdatingTeam) {
            d.setEditingSquad(null);
            d.setSquadError("");
          }
        }}
      >
        <DialogContent className="max-w-xl rounded">
          <DialogHeader>
            <DialogTitle className="text-base">
              Edit Regu Pengamanan
            </DialogTitle>
            <DialogDescription className="text-xs">
              Perbarui nama, kode, dan deskripsi regu.
            </DialogDescription>
          </DialogHeader>

          {d.editingSquad && (
            <form onSubmit={d.handleSaveEditSquad} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {d.renderInput(
                  "Nama Regu",
                  d.editingSquad.name,
                  (value: string) =>
                    d.setEditingSquad((previous: any) =>
                      previous ? { ...previous, name: value } : previous,
                    ),
                  { required: true },
                )}

                {d.renderInput(
                  "Kode Regu",
                  d.editingSquad.code,
                  (value: string) =>
                    d.setEditingSquad((previous: any) =>
                      previous ? { ...previous, code: value } : previous,
                    ),
                  { required: true },
                )}

                <div className="sm:col-span-2">
                  {d.renderInput(
                    "Deskripsi",
                    d.editingSquad.description,
                    (value: string) =>
                      d.setEditingSquad((previous: any) =>
                        previous
                          ? { ...previous, description: value }
                          : previous,
                      ),
                  )}
                </div>
              </div>

              {d.squadError && (
                <div
                  role="alert"
                  className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700"
                >
                  {d.squadError}
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className={buttonClass}
                  disabled={d.isUpdatingTeam}
                  onClick={() => d.setEditingSquad(null)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className={buttonClass}
                  disabled={d.isUpdatingTeam}
                >
                  {d.isUpdatingTeam ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Konfirmasi Aktif / Nonaktif */}
      <AlertDialog
        open={!!d.statusAction}
        onOpenChange={(open) => {
          if (!open && !d.isActivatingUser && !d.isDeactivatingUser) {
            d.setStatusAction(null);
          }
        }}
      >
        <AlertDialogContent className="rounded">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">
              {d.statusAction?.activate
                ? "Aktifkan Akun Pengguna?"
                : "Nonaktifkan Akun Pengguna?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              {d.statusAction?.activate ? (
                <>
                  Apakah Anda yakin ingin mengaktifkan akun{" "}
                  <strong className="text-foreground">
                    {d.statusAction.user.fullName}
                  </strong>
                  ? Pengguna dapat kembali mengakses aplikasi PAMAREA.
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin menonaktifkan akun{" "}
                  <strong className="text-foreground">
                    {d.statusAction?.user.fullName}
                  </strong>
                  ? Pengguna tidak dapat menggunakan akun selama statusnya
                  nonaktif.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              className={buttonClass}
              disabled={d.isActivatingUser || d.isDeactivatingUser}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className={`${buttonClass} ${
                d.statusAction?.activate
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }`}
              disabled={d.isActivatingUser || d.isDeactivatingUser}
              onClick={(event) => {
                event.preventDefault();
                void d.handleConfirmStatusChange();
              }}
            >
              {d.isActivatingUser || d.isDeactivatingUser
                ? "Memproses..."
                : d.statusAction?.activate
                  ? "Ya, Aktifkan"
                  : "Ya, Nonaktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Konfirmasi Hapus Akun */}
      <AlertDialog
        open={!!d.deletingUser}
        onOpenChange={(open) => {
          if (!open && !d.isDeletingUser) d.setDeletingUser(null);
        }}
      >
        <AlertDialogContent className="rounded">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">
              Hapus Akun Pengguna?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus akun{" "}
              <strong className="text-foreground">
                {d.deletingUser?.fullName}
              </strong>
              ? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              className={buttonClass}
              disabled={d.isDeletingUser}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className={`${buttonClass} bg-destructive text-destructive-foreground hover:bg-destructive/90`}
              disabled={d.isDeletingUser}
              onClick={(event) => {
                event.preventDefault();
                void d.handleDeleteUser();
              }}
            >
              {d.isDeletingUser ? "Menghapus..." : "Hapus Akun"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Konfirmasi Hapus Regu */}
      <AlertDialog
        open={!!d.deletingSquad}
        onOpenChange={(open) => {
          if (!open && !d.isDeletingTeam) d.setDeletingSquad(null);
        }}
      >
        <AlertDialogContent className="rounded">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">
              Hapus Regu?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus regu{" "}
              <strong className="text-foreground">
                {d.deletingSquad?.name}
              </strong>
              ? Pastikan regu tidak sedang digunakan oleh pengguna.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              className={buttonClass}
              disabled={d.isDeletingTeam}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className={`${buttonClass} bg-destructive text-destructive-foreground hover:bg-destructive/90`}
              disabled={d.isDeletingTeam}
              onClick={(event) => {
                event.preventDefault();
                void d.handleDeleteSquad();
              }}
            >
              {d.isDeletingTeam ? "Menghapus..." : "Hapus Regu"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
