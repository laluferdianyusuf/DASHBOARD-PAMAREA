import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import PLNLOGO from "../assets/54891.png";
import pamareaLogo from "../assets/PAMAREA.png";
import { useLogin } from "../hooks/auth";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const { mutate: login, isPending } = useLogin();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Username dan password wajib diisi.");
      return;
    }

    login(
      {
        username: username.trim(),
        password,
      },
      {
        onSuccess: () => {
          navigate("/", { replace: true });
        },
        onError: () => {
          setError("Username atau password tidak valid.");
        },
      },
    );
  };

  const inputClass =
    "w-full rounded border border-slate-200 bg-white px-4 py-3 h-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus-visible:border-[#135284] focus-visible:ring-4 focus-visible:ring-[#135284]/10";

  const labelClass = "mb-2 block text-sm font-medium text-slate-700";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/70 lg:grid-cols-2">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0B3B60] via-[#135284] to-[#0B3B60] p-10 text-white lg:flex">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[40px] border-white/10" />

          <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full border-[50px] border-[#FFD500]/15" />

          <div className="absolute right-20 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-[#FFD500]/5 blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-5">
              <div className="flex items-center justify-center">
                <img
                  src={PLNLOGO}
                  alt="Logo PLN"
                  className="h-12 w-auto object-contain"
                />
              </div>

              <div className="h-12 w-px bg-white/30" />

              <div className="flex items-center justify-center">
                <img
                  src={pamareaLogo}
                  alt="Logo PAMAREA"
                  className="h-12 w-auto object-contain"
                />
              </div>
            </div>

            <h1 className="mt-10 text-4xl font-bold tracking-tight text-white">
              Selamat Datang
            </h1>

            <div className="mt-5 h-1 w-16 rounded-full bg-[#FFD500]" />

            <p className="mt-5 max-w-sm text-sm leading-7 text-blue-50/90">
              Akses akun Anda dengan mudah dan nikmati pengalaman menggunakan
              aplikasi yang aman, nyaman, dan terintegrasi.
            </p>

            <div className="mt-10 mb-2 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#135284]/70">
                <div className="h-3 w-3 rounded-full bg-[#FFD500] shadow-[0_0_12px_rgba(255,213,0,0.5)]" />
              </div>

              <div>
                <p className="text-sm font-bold text-white">PAMAREA</p>

                <p className="mt-1 text-xs text-blue-100/80">
                  Patroli dan Monitoring Keamanan Area
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <div className="mb-5 h-px w-full bg-white/20" />

            <p className="text-sm text-blue-50/90">
              Satu akun untuk memulai aktivitas Anda.
            </p>

            <p className="mt-2 text-xs text-blue-100/60">
              © {new Date().getFullYear()} PAMAREA. All rights reserved.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-8 sm:px-10 sm:py-12 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-700 font-bold text-white">
                A
              </div>

              <div>
                <p className="font-bold text-slate-900">Aplikasi Anda</p>
                <p className="text-xs text-slate-500">Portal autentikasi</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#135284]">
                Selamat datang kembali
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Login ke akun
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Masukkan informasi akun Anda untuk melanjutkan.
              </p>
            </div>

            {error && (
              <Alert
                variant="destructive"
                role="alert"
                className="mb-5 rounded-xl border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <Label htmlFor="login-username" className={labelClass}>
                  Username atau Email
                </Label>

                <Input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  placeholder="Masukkan username atau email"
                  className={inputClass}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={isPending}
                />
              </div>

              <div>
                <Label htmlFor="login-password" className={labelClass}>
                  Password
                </Label>

                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Masukkan password"
                    className={`${inputClass} pr-20`}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isPending}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowPassword((previous) => !previous)}
                    disabled={isPending}
                    className="absolute right-3 top-1/2 h-auto -translate-y-1/2 p-0 text-xs font-semibold text-slate-500 hover:bg-transparent hover:text-[#135284]"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                size={"lg"}
                disabled={isPending}
                className="w-full rounded bg-[#135284] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-700/20 transition hover:bg-[#135284]/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFD500]/20"
              >
                {isPending ? "Sedang Login..." : "Login"}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
