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
      agentsmith_events: {
        Row: {
          created_at: string
          created_by: number | null
          description: string
          details: Json
          id: number
          name: string
          organization_id: number
          project_id: number | null
          severity: Database["public"]["Enums"]["agentsmith_event_severity"]
          type: Database["public"]["Enums"]["agentsmith_event_type"]
          updated_at: string
          uuid: string
        }
        Insert: {
          created_at?: string
          created_by?: number | null
          description: string
          details?: Json
          id?: number
          name: string
          organization_id: number
          project_id?: number | null
          severity?: Database["public"]["Enums"]["agentsmith_event_severity"]
          type?: Database["public"]["Enums"]["agentsmith_event_type"]
          updated_at?: string
          uuid?: string
        }
        Update: {
          created_at?: string
          created_by?: number | null
          description?: string
          details?: Json
          id?: number
          name?: string
          organization_id?: number
          project_id?: number | null
          severity?: Database["public"]["Enums"]["agentsmith_event_severity"]
          type?: Database["public"]["Enums"]["agentsmith_event_type"]
          updated_at?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "agentsmith_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "agentsmith_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agentsmith_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agentsmith_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agentsmith_users: {
        Row: {
          auth_user_id: string
          created_at: string
          email: string | null
          id: number
          studio_access: boolean
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          email?: string | null
          id?: number
          studio_access?: boolean
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          email?: string | null
          id?: number
          studio_access?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          created_at: string
          description: string | null
          id: number
          read_at: string | null
          roadmap_item_id: number | null
          title: string
          type: string
          user_id: number
          uuid: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: never
          read_at?: string | null
          roadmap_item_id?: number | null
          title: string
          type: string
          user_id: number
          uuid?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: never
          read_at?: string | null
          roadmap_item_id?: number | null
          title?: string
          type?: string
          user_id?: number
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_roadmap_item_id_fkey"
            columns: ["roadmap_item_id"]
            isOneToOne: false
            referencedRelation: "roadmap_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "agentsmith_users"
            referencedColumns: ["id"]
          },
        ]
      }
      github_app_installations: {
        Row: {
          created_at: string
          id: number
          installation_id: number | null
          organization_id: number
          status: Database["public"]["Enums"]["github_app_installation_status"]
          updated_at: string
          uuid: string
        }
        Insert: {
          created_at?: string
          id?: number
          installation_id?: number | null
          organization_id: number
          status?: Database["public"]["Enums"]["github_app_installation_status"]
          updated_at?: string
          uuid?: string
        }
        Update: {
          created_at?: string
          id?: number
          installation_id?: number | null
          organization_id?: number
          status?: Database["public"]["Enums"]["github_app_installation_status"]
          updated_at?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_app_installations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      global_contexts: {
        Row: {
          content: Json
          created_at: string
          id: number
          last_sync_git_sha: string | null
          project_id: number
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: number
          last_sync_git_sha?: string | null
          project_id: number
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: number
          last_sync_git_sha?: string | null
          project_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_contexts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
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
          source: Database["public"]["Enums"]["llm_log_source"]
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
          source?: Database["public"]["Enums"]["llm_log_source"]
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
          source?: Database["public"]["Enums"]["llm_log_source"]
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
      organization_keys: {
        Row: {
          created_at: string
          id: number
          key: string
          key_hash: string
          organization_id: number
          updated_at: string
          vault_secret_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          key: string
          key_hash: string
          organization_id: number
          updated_at?: string
          vault_secret_id: string
        }
        Update: {
          created_at?: string
          id?: number
          key?: string
          key_hash?: string
          organization_id?: number
          updated_at?: string
          vault_secret_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          created_by: number
          id: number
          invite_code: string
          name: string
          tier: Database["public"]["Enums"]["organization_tier"]
          updated_at: string
          uuid: string
        }
        Insert: {
          created_at?: string
          created_by: number
          id?: number
          invite_code?: string
          name: string
          tier?: Database["public"]["Enums"]["organization_tier"]
          updated_at?: string
          uuid?: string
        }
        Update: {
          created_at?: string
          created_by?: number
          id?: number
          invite_code?: string
          name?: string
          tier?: Database["public"]["Enums"]["organization_tier"]
          updated_at?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "agentsmith_users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_repositories: {
        Row: {
          agentsmith_folder: string
          created_at: string
          github_app_installation_id: number
          id: number
          organization_id: number
          pr_workflow: boolean
          project_id: number | null
          repository_default_branch: string
          repository_full_name: string
          repository_id: number
          repository_name: string
          sync_started_at: string | null
          sync_status: Database["public"]["Enums"]["sync_status_type"]
          updated_at: string
        }
        Insert: {
          agentsmith_folder?: string
          created_at?: string
          github_app_installation_id: number
          id?: number
          organization_id: number
          pr_workflow?: boolean
          project_id?: number | null
          repository_default_branch: string
          repository_full_name: string
          repository_id: number
          repository_name: string
          sync_started_at?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status_type"]
          updated_at?: string
        }
        Update: {
          agentsmith_folder?: string
          created_at?: string
          github_app_installation_id?: number
          id?: number
          organization_id?: number
          pr_workflow?: boolean
          project_id?: number | null
          repository_default_branch?: string
          repository_full_name?: string
          repository_id?: number
          repository_name?: string
          sync_started_at?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_repositories_github_app_installation_id_fkey"
            columns: ["github_app_installation_id"]
            isOneToOne: false
            referencedRelation: "github_app_installations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_repositories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_repositories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          created_by: number
          id: number
          name: string
          organization_id: number
          updated_at: string
          uuid: string
        }
        Insert: {
          created_at?: string
          created_by: number
          id?: number
          name: string
          organization_id: number
          updated_at?: string
          uuid?: string
        }
        Update: {
          created_at?: string
          created_by?: number
          id?: number
          name?: string
          organization_id?: number
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
          default_value: string | null
          id: number
          name: string
          prompt_version_id: number | null
          required: boolean
          type: Database["public"]["Enums"]["variable_type"]
          updated_at: string
          uuid: string
        }
        Insert: {
          created_at?: string
          default_value?: string | null
          id?: number
          name: string
          prompt_version_id?: number | null
          required: boolean
          type: Database["public"]["Enums"]["variable_type"]
          updated_at?: string
          uuid?: string
        }
        Update: {
          created_at?: string
          default_value?: string | null
          id?: number
          name?: string
          prompt_version_id?: number | null
          required?: boolean
          type?: Database["public"]["Enums"]["variable_type"]
          updated_at?: string
          uuid?: string
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
          config: Json
          content: string
          created_at: string
          id: number
          last_sync_content_sha: string | null
          last_sync_git_sha: string | null
          last_sync_variables_sha: string | null
          prompt_id: number
          status: Database["public"]["Enums"]["prompt_status"]
          updated_at: string
          uuid: string
          version: string
        }
        Insert: {
          config: Json
          content: string
          created_at?: string
          id?: number
          last_sync_content_sha?: string | null
          last_sync_git_sha?: string | null
          last_sync_variables_sha?: string | null
          prompt_id: number
          status: Database["public"]["Enums"]["prompt_status"]
          updated_at?: string
          uuid?: string
          version: string
        }
        Update: {
          config?: Json
          content?: string
          created_at?: string
          id?: number
          last_sync_content_sha?: string | null
          last_sync_git_sha?: string | null
          last_sync_variables_sha?: string | null
          prompt_id?: number
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
          last_sync_git_sha: string | null
          name: string
          project_id: number
          slug: string
          updated_at: string
          uuid: string
        }
        Insert: {
          created_at?: string
          id?: number
          last_sync_git_sha?: string | null
          name: string
          project_id: number
          slug: string
          updated_at?: string
          uuid?: string
        }
        Update: {
          created_at?: string
          id?: number
          last_sync_git_sha?: string | null
          name?: string
          project_id?: number
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
      roadmap_items: {
        Row: {
          avg_score: number | null
          body: string
          created_at: string | null
          creator_user_id: number
          id: number
          slug: string
          state: Database["public"]["Enums"]["roadmap_item_state"]
          title: string
          updated_at: string | null
          upvote_count: number | null
        }
        Insert: {
          avg_score?: number | null
          body: string
          created_at?: string | null
          creator_user_id: number
          id?: never
          slug: string
          state?: Database["public"]["Enums"]["roadmap_item_state"]
          title: string
          updated_at?: string | null
          upvote_count?: number | null
        }
        Update: {
          avg_score?: number | null
          body?: string
          created_at?: string | null
          creator_user_id?: number
          id?: never
          slug?: string
          state?: Database["public"]["Enums"]["roadmap_item_state"]
          title?: string
          updated_at?: string | null
          upvote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_items_creator_user_id_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "agentsmith_users"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_upvotes: {
        Row: {
          created_at: string | null
          id: number
          roadmap_item_id: number
          score: number
          updated_at: string | null
          user_id: number
        }
        Insert: {
          created_at?: string | null
          id?: never
          roadmap_item_id: number
          score: number
          updated_at?: string | null
          user_id: number
        }
        Update: {
          created_at?: string | null
          id?: never
          roadmap_item_id?: number
          score?: number
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_upvotes_roadmap_item_id_fkey"
            columns: ["roadmap_item_id"]
            isOneToOne: false
            referencedRelation: "roadmap_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_upvotes_user_id_fkey"
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
      create_llm_log_entry: {
        Args: {
          arg_project_uuid: string
          arg_version_uuid: string
          arg_variables: Json
          arg_raw_input: Json
        }
        Returns: Json
      }
      create_organization: {
        Args: {
          arg_name: string
        }
        Returns: string
      }
      create_organization_key: {
        Args: {
          arg_organization_uuid: string
          arg_key: string
          arg_value: string
          arg_description?: string
        }
        Returns: Json
      }
      delete_organization_key: {
        Args: {
          arg_organization_uuid: string
          arg_key_name: string
        }
        Returns: Json
      }
      gen_invite_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gen_random_alphanumeric: {
        Args: {
          length: number
        }
        Returns: string
      }
      get_organization_by_api_key_hash: {
        Args: {
          arg_api_key_hash: string
        }
        Returns: Json
      }
      get_organization_vault_secret: {
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
      is_member_of_same_org: {
        Args: {
          agentsmith_user_id: number
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
      join_organization: {
        Args: {
          arg_invite_code: string
        }
        Returns: string
      }
      rename_organization: {
        Args: {
          arg_organization_uuid: string
          arg_name: string
        }
        Returns: undefined
      }
      search_roadmap_items: {
        Args: {
          search_term: string
        }
        Returns: {
          avg_score: number | null
          body: string
          created_at: string | null
          creator_user_id: number
          id: number
          slug: string
          state: Database["public"]["Enums"]["roadmap_item_state"]
          title: string
          updated_at: string | null
          upvote_count: number | null
        }[]
      }
    }
    Enums: {
      agentsmith_event_severity: "DEBUG" | "INFO" | "WARN" | "ERROR"
      agentsmith_event_type:
        | "SYNC_START"
        | "SYNC_COMPLETE"
        | "SYNC_ERROR"
        | "ALERT"
      github_app_installation_status:
        | "PENDING"
        | "ACTIVE"
        | "SUSPENDED"
        | "DELETED"
      llm_log_source:
        | "STUDIO"
        | "SDK"
        | "AGENTSMITH_EVAL"
        | "AGENTSMITH_AI_AUTHOR"
      organization_tier: "FREE" | "PRO" | "ENTERPRISE"
      organization_user_role: "ADMIN" | "MEMBER"
      prompt_status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
      roadmap_item_state:
        | "PROPOSED"
        | "REJECTED"
        | "PLANNED"
        | "IN_PROGRESS"
        | "CANCELLED"
        | "COMPLETED"
      sync_status_type: "IDLE" | "SYNCING"
      variable_type: "STRING" | "NUMBER" | "BOOLEAN" | "JSON"
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

