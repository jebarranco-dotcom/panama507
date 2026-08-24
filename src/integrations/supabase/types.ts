export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_credenciales: {
        Row: {
          actualizado_por: string | null
          client_id: string
          client_secret_cifrado: string
          created_at: string
          empresa_id: string
          id: string
          pista_secreto: string
          proveedor: string
          updated_at: string
        }
        Insert: {
          actualizado_por?: string | null
          client_id: string
          client_secret_cifrado: string
          created_at?: string
          empresa_id: string
          id?: string
          pista_secreto?: string
          proveedor: string
          updated_at?: string
        }
        Update: {
          actualizado_por?: string | null
          client_id?: string
          client_secret_cifrado?: string
          created_at?: string
          empresa_id?: string
          id?: string
          pista_secreto?: string
          proveedor?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_credenciales_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          activo: boolean
          correo: string
          created_at: string
          empresa_id: string
          id: string
          leads_atendidos: number
          leads_cerrados: number
          nombre: string
          publicaciones_asignadas: number
          redes_asignadas: string[]
          rol: string
          telefono: string
          whatsapp: string
        }
        Insert: {
          activo?: boolean
          correo?: string
          created_at?: string
          empresa_id: string
          id?: string
          leads_atendidos?: number
          leads_cerrados?: number
          nombre: string
          publicaciones_asignadas?: number
          redes_asignadas?: string[]
          rol?: string
          telefono?: string
          whatsapp?: string
        }
        Update: {
          activo?: boolean
          correo?: string
          created_at?: string
          empresa_id?: string
          id?: string
          leads_atendidos?: number
          leads_cerrados?: number
          nombre?: string
          publicaciones_asignadas?: number
          redes_asignadas?: string[]
          rol?: string
          telefono?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      conexiones_eventos: {
        Row: {
          created_at: string
          empresa_id: string
          estado: string
          id: string
          mensaje: string
          red: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          estado: string
          id?: string
          mensaje?: string
          red: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          estado?: string
          id?: string
          mensaje?: string
          red?: string
        }
        Relationships: [
          {
            foreignKeyName: "conexiones_eventos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      conexiones_redes: {
        Row: {
          autorizada_at: string | null
          created_at: string
          cuenta_externa_id: string
          cuenta_externa_nombre: string
          detalle: string
          empresa_id: string
          estado: string
          expira_at: string | null
          id: string
          permisos_faltantes: string[]
          permisos_otorgados: string[]
          proveedor: string
          red: string
          updated_at: string
        }
        Insert: {
          autorizada_at?: string | null
          created_at?: string
          cuenta_externa_id?: string
          cuenta_externa_nombre?: string
          detalle?: string
          empresa_id: string
          estado?: string
          expira_at?: string | null
          id?: string
          permisos_faltantes?: string[]
          permisos_otorgados?: string[]
          proveedor: string
          red: string
          updated_at?: string
        }
        Update: {
          autorizada_at?: string | null
          created_at?: string
          cuenta_externa_id?: string
          cuenta_externa_nombre?: string
          detalle?: string
          empresa_id?: string
          estado?: string
          expira_at?: string | null
          id?: string
          permisos_faltantes?: string[]
          permisos_otorgados?: string[]
          proveedor?: string
          red?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conexiones_redes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      conexiones_tokens: {
        Row: {
          access_token_cifrado: string
          created_at: string
          empresa_id: string
          expira_at: string | null
          id: string
          red: string
          refresh_token_cifrado: string | null
          updated_at: string
        }
        Insert: {
          access_token_cifrado: string
          created_at?: string
          empresa_id: string
          expira_at?: string | null
          id?: string
          red: string
          refresh_token_cifrado?: string | null
          updated_at?: string
        }
        Update: {
          access_token_cifrado?: string
          created_at?: string
          empresa_id?: string
          expira_at?: string | null
          id?: string
          red?: string
          refresh_token_cifrado?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conexiones_tokens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      cuentas_sociales: {
        Row: {
          alcance_mensual: number
          conectada: boolean
          created_at: string
          empresa_id: string
          id: string
          notas: string
          red: string
          seguidores: number
          updated_at: string
          usuario: string
        }
        Insert: {
          alcance_mensual?: number
          conectada?: boolean
          created_at?: string
          empresa_id: string
          id?: string
          notas?: string
          red: string
          seguidores?: number
          updated_at?: string
          usuario?: string
        }
        Update: {
          alcance_mensual?: number
          conectada?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          notas?: string
          red?: string
          seguidores?: number
          updated_at?: string
          usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "cuentas_sociales_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_roles: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          rol: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          rol?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          rol?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_roles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_usuarios: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          rol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          rol?: string
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          rol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          activa: boolean
          color_acento: string
          color_primario: string
          created_at: string
          giro: string
          id: string
          logo_url: string | null
          nombre: string
          slug: string
          tono: string
          updated_at: string
          whatsapp: string
          zonas: string
        }
        Insert: {
          activa?: boolean
          color_acento?: string
          color_primario?: string
          created_at?: string
          giro?: string
          id?: string
          logo_url?: string | null
          nombre: string
          slug: string
          tono?: string
          updated_at?: string
          whatsapp?: string
          zonas?: string
        }
        Update: {
          activa?: boolean
          color_acento?: string
          color_primario?: string
          created_at?: string
          giro?: string
          id?: string
          logo_url?: string | null
          nombre?: string
          slug?: string
          tono?: string
          updated_at?: string
          whatsapp?: string
          zonas?: string
        }
        Relationships: []
      }
      informes_diarios: {
        Row: {
          alcance_total: number
          created_at: string
          empresa_id: string
          fecha: string
          id: string
          leads_nuevos: number
          logros: string[]
          mejor_red: string
          mensajes_atendidos: number
          mensajes_recibidos: number
          publicaciones_programadas: number
          publicaciones_publicadas: number
          recomendaciones: string[]
          resumen: string
        }
        Insert: {
          alcance_total?: number
          created_at?: string
          empresa_id: string
          fecha?: string
          id?: string
          leads_nuevos?: number
          logros?: string[]
          mejor_red?: string
          mensajes_atendidos?: number
          mensajes_recibidos?: number
          publicaciones_programadas?: number
          publicaciones_publicadas?: number
          recomendaciones?: string[]
          resumen?: string
        }
        Update: {
          alcance_total?: number
          created_at?: string
          empresa_id?: string
          fecha?: string
          id?: string
          leads_nuevos?: number
          logros?: string[]
          mejor_red?: string
          mensajes_atendidos?: number
          mensajes_recibidos?: number
          publicaciones_programadas?: number
          publicaciones_publicadas?: number
          recomendaciones?: string[]
          resumen?: string
        }
        Relationships: [
          {
            foreignKeyName: "informes_diarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      mensajes: {
        Row: {
          colaborador_id: string | null
          created_at: string
          empresa_id: string
          estado: string
          id: string
          intencion: string
          mensaje: string
          notas: string
          prioridad: string
          propiedad_id: string | null
          proximo_seguimiento: string | null
          red: string
          remitente: string
          respondido_at: string | null
          respuesta: string | null
          usuario_remitente: string
        }
        Insert: {
          colaborador_id?: string | null
          created_at?: string
          empresa_id: string
          estado?: string
          id?: string
          intencion?: string
          mensaje?: string
          notas?: string
          prioridad?: string
          propiedad_id?: string | null
          proximo_seguimiento?: string | null
          red?: string
          remitente?: string
          respondido_at?: string | null
          respuesta?: string | null
          usuario_remitente?: string
        }
        Update: {
          colaborador_id?: string | null
          created_at?: string
          empresa_id?: string
          estado?: string
          id?: string
          intencion?: string
          mensaje?: string
          notas?: string
          prioridad?: string
          propiedad_id?: string | null
          proximo_seguimiento?: string | null
          red?: string
          remitente?: string
          respondido_at?: string | null
          respuesta?: string | null
          usuario_remitente?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_propiedad_id_fkey"
            columns: ["propiedad_id"]
            isOneToOne: false
            referencedRelation: "propiedades"
            referencedColumns: ["id"]
          },
        ]
      }
      programacion_redes: {
        Row: {
          activo: boolean
          created_at: string
          empresa_id: string
          formato: string
          hora: string
          id: string
          pilar: string
          red: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          empresa_id: string
          formato?: string
          hora?: string
          id?: string
          pilar?: string
          red: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          empresa_id?: string
          formato?: string
          hora?: string
          id?: string
          pilar?: string
          red?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programacion_redes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      propiedades: {
        Row: {
          area_m2: number
          banos: number
          created_at: string
          descripcion: string
          destacada: boolean
          empresa_id: string
          estado: string
          habitaciones: number
          id: string
          imagen_url: string | null
          moneda: string
          operacion: string
          precio: number
          tipo: string
          titulo: string
          ubicacion: string
        }
        Insert: {
          area_m2?: number
          banos?: number
          created_at?: string
          descripcion?: string
          destacada?: boolean
          empresa_id: string
          estado?: string
          habitaciones?: number
          id?: string
          imagen_url?: string | null
          moneda?: string
          operacion?: string
          precio?: number
          tipo?: string
          titulo: string
          ubicacion?: string
        }
        Update: {
          area_m2?: number
          banos?: number
          created_at?: string
          descripcion?: string
          destacada?: boolean
          empresa_id?: string
          estado?: string
          habitaciones?: number
          id?: string
          imagen_url?: string | null
          moneda?: string
          operacion?: string
          precio?: number
          tipo?: string
          titulo?: string
          ubicacion?: string
        }
        Relationships: [
          {
            foreignKeyName: "propiedades_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      publicaciones: {
        Row: {
          alcance: number
          clics: number
          comentarios: number
          copy: string
          created_at: string
          cta: string
          empresa_id: string
          estado: string
          fecha_programada: string
          formato: string
          generado_por_ia: boolean
          hashtags: string[]
          hora_programada: string
          id: string
          idea_visual: string
          leads: number
          likes: number
          pilar: string
          propiedad_id: string | null
          publicado_at: string | null
          red: string
          titular: string
        }
        Insert: {
          alcance?: number
          clics?: number
          comentarios?: number
          copy?: string
          created_at?: string
          cta?: string
          empresa_id: string
          estado?: string
          fecha_programada?: string
          formato?: string
          generado_por_ia?: boolean
          hashtags?: string[]
          hora_programada?: string
          id?: string
          idea_visual?: string
          leads?: number
          likes?: number
          pilar?: string
          propiedad_id?: string | null
          publicado_at?: string | null
          red?: string
          titular?: string
        }
        Update: {
          alcance?: number
          clics?: number
          comentarios?: number
          copy?: string
          created_at?: string
          cta?: string
          empresa_id?: string
          estado?: string
          fecha_programada?: string
          formato?: string
          generado_por_ia?: boolean
          hashtags?: string[]
          hora_programada?: string
          id?: string
          idea_visual?: string
          leads?: number
          likes?: number
          pilar?: string
          propiedad_id?: string | null
          publicado_at?: string | null
          red?: string
          titular?: string
        }
        Relationships: [
          {
            foreignKeyName: "publicaciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicaciones_propiedad_id_fkey"
            columns: ["propiedad_id"]
            isOneToOne: false
            referencedRelation: "propiedades"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "gestor" | "asesor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "gestor", "asesor"],
    },
  },
} as const
