import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { EmpresaProvider } from "@/lib/empresa";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        href: `/auth?returnTo=${encodeURIComponent(location.href)}`,
      });
    }
    return { user: data.user };
  },
  component: () => (
    <EmpresaProvider>
      <Outlet />
    </EmpresaProvider>
  ),
});
