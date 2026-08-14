import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const publicacionesQuery = queryOptions({
  queryKey: ["publicaciones"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("publicaciones")
      .select("*")
      .order("fecha_programada", { ascending: false })
      .order("hora_programada", { ascending: true })
      .limit(120);
    if (error) throw error;
    return data;
  },
});

export const mensajesQuery = queryOptions({
  queryKey: ["mensajes"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("mensajes")
      .select("*, colaboradores(nombre)")
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) throw error;
    return data;
  },
});

export const colaboradoresQuery = queryOptions({
  queryKey: ["colaboradores"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("colaboradores")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },
});

export const cuentasQuery = queryOptions({
  queryKey: ["cuentas_sociales"],
  queryFn: async () => {
    const { data, error } = await supabase.from("cuentas_sociales").select("*").order("red");
    if (error) throw error;
    return data;
  },
});

export const informesQuery = queryOptions({
  queryKey: ["informes"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("informes_diarios")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(14);
    if (error) throw error;
    return data;
  },
});

export const propiedadesQuery = queryOptions({
  queryKey: ["propiedades"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("propiedades")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },
});
