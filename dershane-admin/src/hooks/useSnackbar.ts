import { useState } from "react";

export function useSnackbar() {
  const [snack, setSnack] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", severity: "info" });

  const show = (message: string, severity: typeof snack.severity = "info") => {
    setSnack({ open: true, message, severity });
  };

  const close = () => setSnack((s) => ({ ...s, open: false }));

  return { snack, show, close };
}
