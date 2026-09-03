import { createFileRoute, redirect } from "@tanstack/react-router";

/** Compatibilidad con enlaces antiguos que apuntan a /dashboard. */
export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
