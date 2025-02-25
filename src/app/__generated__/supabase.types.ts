export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agentsmith_users: {
        Row: {
          auth_user_id: string
          created_at: string
          id: number
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          id?: number
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      global_contexts: {
        Row: {
          content: Json
          created_at: string
          id: number
          project_id: number | null
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: number
          project_id?: number | null
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: number
          project_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_contexts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_logs: {
        Row: {
          created_at: string
          end_time: string | null
          id: number
          project_id: number
          prompt_variables: Json
          prompt_version_id: number
          raw_input: Json
          raw_output: Json | null
          start_time: string
          updated_at: string
          uuid: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: number
          project_id: number
          prompt_variables: Json
          prompt_version_id: number
          raw_input: Json
          raw_output?: Json | null
          start_time: string
          updated_at?: string
          uuid?: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: number
          project_id?: number
          prompt_variables?: Json
          prompt_version_id?: number
          raw_input?: Json
          raw_output?: Json | null
          start_time?: string
          updated_at?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "llm_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_logs_prompt_version_id_fkey"
            columns: ["prompt_version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_users: {
        Row: {
          created_at: string
          id: number
          organization_id: number
          role: Database["public"]["Enums"]["organization_user_role"]
          updated_at: string
          user_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          organization_id: number
          role: Database["public"]["Enums"]["organization_user_role"]
          updated_at?: string
          user_id: number
        }
        Update: {
          created_at?: string
          id?: number
          organization_id?: number
          role?: Database["public"]["Enums"]["organization_user_role"]
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "agentsmith_users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: number
          name: string
          tier: Database["public"]["Enums"]["organization_tier"]
          updated_at: string
          uuid: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          tier: Database["public"]["Enums"]["organization_tier"]
          updated_at?: string
          uuid?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          tier?: Database["public"]["Enums"]["organization_tier"]
          updated_at?: string
          uuid?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          created_by: number | null
          id: number
          name: string
          organization_id: number | null
          updated_at: string
          uuid: string
        }
        Insert: {
          created_at?: string
          created_by?: number | null
          id?: number
          name: string
          organization_id?: number | null
          updated_at?: string
          uuid?: string
        }
        Update: {
          created_at?: string
          created_by?: number | null
          id?: number
          name?: string
          organization_id?: number | null
          updated_at?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "agentsmith_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_variables: {
        Row: {
          created_at: string
          id: number
          name: string
          prompt_version_id: number | null
          required: boolean
          type: Database["public"]["Enums"]["variable_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          prompt_version_id?: number | null
          required: boolean
          type: Database["public"]["Enums"]["variable_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          prompt_version_id?: number | null
          required?: boolean
          type?: Database["public"]["Enums"]["variable_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_variables_prompt_version_id_fkey"
            columns: ["prompt_version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          content: string
          created_at: string
          id: number
          model: string
          prompt_id: number | null
          status: Database["public"]["Enums"]["prompt_status"]
          updated_at: string
          uuid: string
          version: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          model: string
          prompt_id?: number | null
          status: Database["public"]["Enums"]["prompt_status"]
          updated_at?: string
          uuid?: string
          version: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          model?: string
          prompt_id?: number | null
          status?: Database["public"]["Enums"]["prompt_status"]
          updated_at?: string
          uuid?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_versions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          created_at: string
          id: number
          name: string
          project_id: number | null
          slug: string
          updated_at: string
          uuid: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          project_id?: number | null
          slug: string
          updated_at?: string
          uuid?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          project_id?: number | null
          slug?: string
          updated_at?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_keys: {
        Row: {
          created_at: string
          id: number
          key: string
          updated_at: string
          user_id: number | null
          vault_secret_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          key: string
          updated_at?: string
          user_id?: number | null
          vault_secret_id: string
        }
        Update: {
          created_at?: string
          id?: number
          key?: string
          updated_at?: string
          user_id?: number | null
          vault_secret_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "agentsmith_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      agentsmith_user_id: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_user_key: {
        Args: {
          arg_key: string
          arg_value: string
          arg_description?: string
        }
        Returns: Json
      }
      delete_user_key: {
        Args: {
          arg_key_name: string
        }
        Returns: Json
      }
      get_vault_secret: {
        Args: {
          arg_vault_secret_id: string
        }
        Returns: Json
      }
      has_project_access: {
        Args: {
          proj_id: number
        }
        Returns: boolean
      }
      has_prompt_access: {
        Args: {
          prompt_id: number
        }
        Returns: boolean
      }
      is_key_owner: {
        Args: {
          key_id: number
        }
        Returns: boolean
      }
      is_organization_admin: {
        Args: {
          org_id: number
        }
        Returns: boolean
      }
      is_organization_member: {
        Args: {
          org_id: number
        }
        Returns: boolean
      }
    }
    Enums: {
      organization_tier: "FREE" | "PRO" | "ENTERPRISE"
      organization_user_role: "ADMIN" | "MEMBER"
      prompt_status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
      variable_type: "STRING" | "NUMBER" | "BOOLEAN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

