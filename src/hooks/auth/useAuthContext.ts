import { useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuthContext harus digunakan di dalam AuthProvider");
  }

  return context;
}
