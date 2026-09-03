import { createFileRoute, redirect } from "@tanstack/react-router";

/** URL canónica alternativa para integraciones y enlaces externos. */
export const Route = createFileRoute("/app")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
