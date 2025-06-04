import { SupabaseClient } from '@supabase/supabase-js';

type Json = string | number | boolean | null | {
    [key: string]: Json | undefined;
} | Json[];
type Database = {
    public: {
        Tables: {
            agentsmith_events: {
                Row: {
                    created_at: string;
                    created_by: number | null;
                    description: string;
                    details: Json;
                    id: number;
                    name: string;
                    organization_id: number;
                    project_id: number | null;
                    severity: Database["public"]["Enums"]["agentsmith_event_severity"];
                    type: Database["public"]["Enums"]["agentsmith_event_type"];
                    updated_at: string;
                    uuid: string;
                };
                Insert: {
                    created_at?: string;
                    created_by?: number | null;
                    description: string;
                    details?: Json;
                    id?: number;
                    name: string;
                    organization_id: number;
                    project_id?: number | null;
                    severity?: Database["public"]["Enums"]["agentsmith_event_severity"];
                    type?: Database["public"]["Enums"]["agentsmith_event_type"];
                    updated_at?: string;
                    uuid?: string;
                };
                Update: {
                    created_at?: string;
                    created_by?: number | null;
                    description?: string;
                    details?: Json;
                    id?: number;
                    name?: string;
                    organization_id?: number;
                    project_id?: number | null;
                    severity?: Database["public"]["Enums"]["agentsmith_event_severity"];
                    type?: Database["public"]["Enums"]["agentsmith_event_type"];
                    updated_at?: string;
                    uuid?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "agentsmith_events_created_by_fkey";
                        columns: ["created_by"];
                        isOneToOne: false;
                        referencedRelation: "agentsmith_users";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "agentsmith_events_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "agentsmith_events_project_id_fkey";
                        columns: ["project_id"];
                        isOneToOne: false;
                        referencedRelation: "projects";
                        referencedColumns: ["id"];
                    }
                ];
            };
            agentsmith_users: {
                Row: {
                    auth_user_id: string;
                    created_at: string;
                    email: string | null;
                    id: number;
                    studio_access: boolean;
                    updated_at: string;
                };
                Insert: {
                    auth_user_id: string;
                    created_at?: string;
                    email?: string | null;
                    id?: number;
                    studio_access?: boolean;
                    updated_at?: string;
                };
                Update: {
                    auth_user_id?: string;
                    created_at?: string;
                    email?: string | null;
                    id?: number;
                    studio_access?: boolean;
                    updated_at?: string;
                };
                Relationships: [];
            };
            alerts: {
                Row: {
                    created_at: string;
                    description: string | null;
                    id: number;
                    read_at: string | null;
                    roadmap_item_id: number | null;
                    title: string;
                    type: string;
                    user_id: number;
                    uuid: string;
                };
                Insert: {
                    created_at?: string;
                    description?: string | null;
                    id?: never;
                    read_at?: string | null;
                    roadmap_item_id?: number | null;
                    title: string;
                    type: string;
                    user_id: number;
                    uuid?: string;
                };
                Update: {
                    created_at?: string;
                    description?: string | null;
                    id?: never;
                    read_at?: string | null;
                    roadmap_item_id?: number | null;
                    title?: string;
                    type?: string;
                    user_id?: number;
                    uuid?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "alerts_roadmap_item_id_fkey";
                        columns: ["roadmap_item_id"];
                        isOneToOne: false;
                        referencedRelation: "roadmap_items";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "alerts_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "agentsmith_users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            github_app_installations: {
                Row: {
                    created_at: string;
                    id: number;
                    installation_id: number | null;
                    organization_id: number;
                    status: Database["public"]["Enums"]["github_app_installation_status"];
                    updated_at: string;
                    uuid: string;
                };
                Insert: {
                    created_at?: string;
                    id?: number;
                    installation_id?: number | null;
                    organization_id: number;
                    status?: Database["public"]["Enums"]["github_app_installation_status"];
                    updated_at?: string;
                    uuid?: string;
                };
                Update: {
                    created_at?: string;
                    id?: number;
                    installation_id?: number | null;
                    organization_id?: number;
                    status?: Database["public"]["Enums"]["github_app_installation_status"];
                    updated_at?: string;
                    uuid?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "github_app_installations_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            global_contexts: {
                Row: {
                    content: Json;
                    created_at: string;
                    id: number;
                    last_sync_git_sha: string | null;
                    project_id: number;
                    updated_at: string;
                };
                Insert: {
                    content: Json;
                    created_at?: string;
                    id?: number;
                    last_sync_git_sha?: string | null;
                    project_id: number;
                    updated_at?: string;
                };
                Update: {
                    content?: Json;
                    created_at?: string;
                    id?: number;
                    last_sync_git_sha?: string | null;
                    project_id?: number;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "global_contexts_project_id_fkey";
                        columns: ["project_id"];
                        isOneToOne: true;
                        referencedRelation: "projects";
                        referencedColumns: ["id"];
                    }
                ];
            };
            llm_logs: {
                Row: {
                    created_at: string;
                    end_time: string | null;
                    id: number;
                    project_id: number;
                    prompt_variables: Json;
                    prompt_version_id: number;
                    raw_input: Json;
                    raw_output: Json | null;
                    start_time: string;
                    updated_at: string;
                    uuid: string;
                };
                Insert: {
                    created_at?: string;
                    end_time?: string | null;
                    id?: number;
                    project_id: number;
                    prompt_variables: Json;
                    prompt_version_id: number;
                    raw_input: Json;
                    raw_output?: Json | null;
                    start_time: string;
                    updated_at?: string;
                    uuid?: string;
                };
                Update: {
                    created_at?: string;
                    end_time?: string | null;
                    id?: number;
                    project_id?: number;
                    prompt_variables?: Json;
                    prompt_version_id?: number;
                    raw_input?: Json;
                    raw_output?: Json | null;
                    start_time?: string;
                    updated_at?: string;
                    uuid?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "llm_logs_project_id_fkey";
                        columns: ["project_id"];
                        isOneToOne: false;
                        referencedRelation: "projects";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "llm_logs_prompt_version_id_fkey";
                        columns: ["prompt_version_id"];
                        isOneToOne: false;
                        referencedRelation: "prompt_versions";
                        referencedColumns: ["id"];
                    }
                ];
            };
            organization_keys: {
                Row: {
                    created_at: string;
                    id: number;
                    key: string;
                    key_hash: string;
                    organization_id: number;
                    updated_at: string;
                    vault_secret_id: string;
                };
                Insert: {
                    created_at?: string;
                    id?: number;
                    key: string;
                    key_hash: string;
                    organization_id: number;
                    updated_at?: string;
                    vault_secret_id: string;
                };
                Update: {
                    created_at?: string;
                    id?: number;
                    key?: string;
                    key_hash?: string;
                    organization_id?: number;
                    updated_at?: string;
                    vault_secret_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "organization_keys_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            organization_users: {
                Row: {
                    created_at: string;
                    id: number;
                    organization_id: number;
                    role: Database["public"]["Enums"]["organization_user_role"];
                    updated_at: string;
                    user_id: number;
                };
                Insert: {
                    created_at?: string;
                    id?: number;
                    organization_id: number;
                    role: Database["public"]["Enums"]["organization_user_role"];
                    updated_at?: string;
                    user_id: number;
                };
                Update: {
                    created_at?: string;
                    id?: number;
                    organization_id?: number;
                    role?: Database["public"]["Enums"]["organization_user_role"];
                    updated_at?: string;
                    user_id?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: "organization_users_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "organization_users_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "agentsmith_users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            organizations: {
                Row: {
                    created_at: string;
                    created_by: number;
                    id: number;
                    invite_code: string;
                    name: string;
                    tier: Database["public"]["Enums"]["organization_tier"];
                    updated_at: string;
                    uuid: string;
                };
                Insert: {
                    created_at?: string;
                    created_by: number;
                    id?: number;
                    invite_code?: string;
                    name: string;
                    tier?: Database["public"]["Enums"]["organization_tier"];
                    updated_at?: string;
                    uuid?: string;
                };
                Update: {
                    created_at?: string;
                    created_by?: number;
                    id?: number;
                    invite_code?: string;
                    name?: string;
                    tier?: Database["public"]["Enums"]["organization_tier"];
                    updated_at?: string;
                    uuid?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "organizations_created_by_fkey";
                        columns: ["created_by"];
                        isOneToOne: false;
                        referencedRelation: "agentsmith_users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            project_repositories: {
                Row: {
                    agentsmith_folder: string;
                    created_at: string;
                    github_app_installation_id: number;
                    id: number;
                    organization_id: number;
                    pr_workflow: boolean;
                    project_id: number | null;
                    repository_default_branch: string;
                    repository_full_name: string;
                    repository_id: number;
                    repository_name: string;
                    sync_started_at: string | null;
                    sync_status: Database["public"]["Enums"]["sync_status_type"];
                    updated_at: string;
                };
                Insert: {
                    agentsmith_folder?: string;
                    created_at?: string;
                    github_app_installation_id: number;
                    id?: number;
                    organization_id: number;
                    pr_workflow?: boolean;
                    project_id?: number | null;
                    repository_default_branch: string;
                    repository_full_name: string;
                    repository_id: number;
                    repository_name: string;
                    sync_started_at?: string | null;
                    sync_status?: Database["public"]["Enums"]["sync_status_type"];
                    updated_at?: string;
                };
                Update: {
                    agentsmith_folder?: string;
                    created_at?: string;
                    github_app_installation_id?: number;
                    id?: number;
                    organization_id?: number;
                    pr_workflow?: boolean;
                    project_id?: number | null;
                    repository_default_branch?: string;
                    repository_full_name?: string;
                    repository_id?: number;
                    repository_name?: string;
                    sync_started_at?: string | null;
                    sync_status?: Database["public"]["Enums"]["sync_status_type"];
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "project_repositories_github_app_installation_id_fkey";
                        columns: ["github_app_installation_id"];
                        isOneToOne: false;
                        referencedRelation: "github_app_installations";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "project_repositories_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "project_repositories_project_id_fkey";
                        columns: ["project_id"];
                        isOneToOne: false;
                        referencedRelation: "projects";
                        referencedColumns: ["id"];
                    }
                ];
            };
            projects: {
                Row: {
                    created_at: string;
                    created_by: number;
                    id: number;
                    name: string;
                    organization_id: number;
                    updated_at: string;
                    uuid: string;
                };
                Insert: {
                    created_at?: string;
                    created_by: number;
                    id?: number;
                    name: string;
                    organization_id: number;
                    updated_at?: string;
                    uuid?: string;
                };
                Update: {
                    created_at?: string;
                    created_by?: number;
                    id?: number;
                    name?: string;
                    organization_id?: number;
                    updated_at?: string;
                    uuid?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "projects_created_by_fkey";
                        columns: ["created_by"];
                        isOneToOne: false;
                        referencedRelation: "agentsmith_users";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "projects_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            prompt_variables: {
                Row: {
                    created_at: string;
                    default_value: string | null;
                    id: number;
                    name: string;
                    prompt_version_id: number | null;
                    required: boolean;
                    type: Database["public"]["Enums"]["variable_type"];
                    updated_at: string;
                    uuid: string;
                };
                Insert: {
                    created_at?: string;
                    default_value?: string | null;
                    id?: number;
                    name: string;
                    prompt_version_id?: number | null;
                    required: boolean;
                    type: Database["public"]["Enums"]["variable_type"];
                    updated_at?: string;
                    uuid?: string;
                };
                Update: {
                    created_at?: string;
                    default_value?: string | null;
                    id?: number;
                    name?: string;
                    prompt_version_id?: number | null;
                    required?: boolean;
                    type?: Database["public"]["Enums"]["variable_type"];
                    updated_at?: string;
                    uuid?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "prompt_variables_prompt_version_id_fkey";
                        columns: ["prompt_version_id"];
                        isOneToOne: false;
                        referencedRelation: "prompt_versions";
                        referencedColumns: ["id"];
                    }
                ];
            };
            prompt_versions: {
                Row: {
                    config: Json;
                    content: string;
                    created_at: string;
                    id: number;
                    last_sync_content_sha: string | null;
                    last_sync_git_sha: string | null;
                    last_sync_variables_sha: string | null;
                    prompt_id: number;
                    status: Database["public"]["Enums"]["prompt_status"];
                    updated_at: string;
                    uuid: string;
                    version: string;
                };
                Insert: {
                    config: Json;
                    content: string;
                    created_at?: string;
                    id?: number;
                    last_sync_content_sha?: string | null;
                    last_sync_git_sha?: string | null;
                    last_sync_variables_sha?: string | null;
                    prompt_id: number;
                    status: Database["public"]["Enums"]["prompt_status"];
                    updated_at?: string;
                    uuid?: string;
                    version: string;
                };
                Update: {
                    config?: Json;
                    content?: string;
                    created_at?: string;
                    id?: number;
                    last_sync_content_sha?: string | null;
                    last_sync_git_sha?: string | null;
                    last_sync_variables_sha?: string | null;
                    prompt_id?: number;
                    status?: Database["public"]["Enums"]["prompt_status"];
                    updated_at?: string;
                    uuid?: string;
                    version?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "prompt_versions_prompt_id_fkey";
                        columns: ["prompt_id"];
                        isOneToOne: false;
                        referencedRelation: "prompts";
                        referencedColumns: ["id"];
                    }
                ];
            };
            prompts: {
                Row: {
                    created_at: string;
                    id: number;
                    last_sync_git_sha: string | null;
                    name: string;
                    project_id: number;
                    slug: string;
                    updated_at: string;
                    uuid: string;
                };
                Insert: {
                    created_at?: string;
                    id?: number;
                    last_sync_git_sha?: string | null;
                    name: string;
                    project_id: number;
                    slug: string;
                    updated_at?: string;
                    uuid?: string;
                };
                Update: {
                    created_at?: string;
                    id?: number;
                    last_sync_git_sha?: string | null;
                    name?: string;
                    project_id?: number;
                    slug?: string;
                    updated_at?: string;
                    uuid?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "prompts_project_id_fkey";
                        columns: ["project_id"];
                        isOneToOne: false;
                        referencedRelation: "projects";
                        referencedColumns: ["id"];
                    }
                ];
            };
            roadmap_items: {
                Row: {
                    avg_score: number | null;
                    body: string;
                    created_at: string | null;
                    creator_user_id: number;
                    id: number;
                    slug: string;
                    state: Database["public"]["Enums"]["roadmap_item_state"];
                    title: string;
                    updated_at: string | null;
                    upvote_count: number | null;
                };
                Insert: {
                    avg_score?: number | null;
                    body: string;
                    created_at?: string | null;
                    creator_user_id: number;
                    id?: never;
                    slug: string;
                    state?: Database["public"]["Enums"]["roadmap_item_state"];
                    title: string;
                    updated_at?: string | null;
                    upvote_count?: number | null;
                };
                Update: {
                    avg_score?: number | null;
                    body?: string;
                    created_at?: string | null;
                    creator_user_id?: number;
                    id?: never;
                    slug?: string;
                    state?: Database["public"]["Enums"]["roadmap_item_state"];
                    title?: string;
                    updated_at?: string | null;
                    upvote_count?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "roadmap_items_creator_user_id_fkey";
                        columns: ["creator_user_id"];
                        isOneToOne: false;
                        referencedRelation: "agentsmith_users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            roadmap_upvotes: {
                Row: {
                    created_at: string | null;
                    id: number;
                    roadmap_item_id: number;
                    score: number;
                    updated_at: string | null;
                    user_id: number;
                };
                Insert: {
                    created_at?: string | null;
                    id?: never;
                    roadmap_item_id: number;
                    score: number;
                    updated_at?: string | null;
                    user_id: number;
                };
                Update: {
                    created_at?: string | null;
                    id?: never;
                    roadmap_item_id?: number;
                    score?: number;
                    updated_at?: string | null;
                    user_id?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: "roadmap_upvotes_roadmap_item_id_fkey";
                        columns: ["roadmap_item_id"];
                        isOneToOne: false;
                        referencedRelation: "roadmap_items";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "roadmap_upvotes_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "agentsmith_users";
                        referencedColumns: ["id"];
                    }
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            agentsmith_user_id: {
                Args: Record<PropertyKey, never>;
                Returns: number;
            };
            create_llm_log_entry: {
                Args: {
                    arg_project_uuid: string;
                    arg_version_uuid: string;
                    arg_variables: Json;
                    arg_raw_input: Json;
                };
                Returns: Json;
            };
            create_organization: {
                Args: {
                    arg_name: string;
                };
                Returns: string;
            };
            create_organization_key: {
                Args: {
                    arg_organization_uuid: string;
                    arg_key: string;
                    arg_value: string;
                    arg_description?: string;
                };
                Returns: Json;
            };
            delete_organization_key: {
                Args: {
                    arg_organization_uuid: string;
                    arg_key_name: string;
                };
                Returns: Json;
            };
            gen_invite_code: {
                Args: Record<PropertyKey, never>;
                Returns: string;
            };
            gen_random_alphanumeric: {
                Args: {
                    length: number;
                };
                Returns: string;
            };
            get_organization_by_api_key_hash: {
                Args: {
                    arg_api_key_hash: string;
                };
                Returns: Json;
            };
            get_organization_vault_secret: {
                Args: {
                    arg_vault_secret_id: string;
                };
                Returns: Json;
            };
            has_project_access: {
                Args: {
                    proj_id: number;
                };
                Returns: boolean;
            };
            has_prompt_access: {
                Args: {
                    prompt_id: number;
                };
                Returns: boolean;
            };
            is_member_of_same_org: {
                Args: {
                    agentsmith_user_id: number;
                };
                Returns: boolean;
            };
            is_organization_admin: {
                Args: {
                    org_id: number;
                };
                Returns: boolean;
            };
            is_organization_member: {
                Args: {
                    org_id: number;
                };
                Returns: boolean;
            };
            join_organization: {
                Args: {
                    arg_invite_code: string;
                };
                Returns: string;
            };
            rename_organization: {
                Args: {
                    arg_organization_uuid: string;
                    arg_name: string;
                };
                Returns: undefined;
            };
            search_roadmap_items: {
                Args: {
                    search_term: string;
                };
                Returns: {
                    avg_score: number | null;
                    body: string;
                    created_at: string | null;
                    creator_user_id: number;
                    id: number;
                    slug: string;
                    state: Database["public"]["Enums"]["roadmap_item_state"];
                    title: string;
                    updated_at: string | null;
                    upvote_count: number | null;
                }[];
            };
        };
        Enums: {
            agentsmith_event_severity: "DEBUG" | "INFO" | "WARN" | "ERROR";
            agentsmith_event_type: "SYNC_START" | "SYNC_COMPLETE" | "SYNC_ERROR" | "ALERT";
            github_app_installation_status: "PENDING" | "ACTIVE" | "SUSPENDED" | "DELETED";
            organization_tier: "FREE" | "PRO" | "ENTERPRISE";
            organization_user_role: "ADMIN" | "MEMBER";
            prompt_status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            roadmap_item_state: "PROPOSED" | "REJECTED" | "PLANNED" | "IN_PROGRESS" | "CANCELLED" | "COMPLETED";
            sync_status_type: "IDLE" | "SYNCING";
            variable_type: "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type GenericPromptVersion = {
    version: string;
    config: any;
    content: string;
    variables?: Record<string, string | number | boolean | any>;
};
type GenericPrompt = {
    uuid: string;
    name: string;
    slug: string;
    versions: Record<string, GenericPromptVersion>;
};
type GenericAgency = {
    prompts: Record<string, GenericPrompt>;
    globals: Record<string, any>;
};
/**
 * @template CurAgency - The agency type, extending GenericAgency.
 * @description Creates a union type of all valid prompt slugs from the agency.
 * This represents the keys of the prompts object in the agency type.
 * @example
 * type MyAgency = {
 *   prompts: {
 *     'prompt1': { ... },
 *     'prompt2': { ... }
 *   },
 *   globals: {}
 * };
 * type MyPromptSlugs = AgencyPromptSlugs<MyAgency>; // "prompt1" | "prompt2"
 */
type AgencyPromptSlugs<CurAgency extends GenericAgency> = keyof CurAgency['prompts'] & string;
/**
 * @template CurAgency - The agency type, extending GenericAgency.
 * @template Slug - A prompt slug from the agency.
 * @description Extracts all version keys (e.g., '0.0.1', 'latest') for a specific prompt slug within an agency.
 * @example
 * type MyAgency = {
 *   prompts: {
 *     'my-prompt': {
 *       versions: {
 *         '0.0.1': { ... };
 *         'latest': { ... };
 *       }
 *     }
 *   },
 *   globals: {}
 * };
 * type PromptVersions = AllPromptVersionKeys<MyAgency, 'my-prompt'>; // "0.0.1" | "latest"
 */
type AllPromptVersionKeys<CurAgency extends GenericAgency, Slug extends AgencyPromptSlugs<CurAgency>> = keyof CurAgency['prompts'][Slug]['versions'] & string;
/**
 * @template CurAgency - The agency type, extending GenericAgency.
 * @description Creates a union of all valid prompt identifier strings.
 * This can be either a plain slug (which defaults to the 'latest' version)
 * or a slug explicitly combined with a version string (e.g., 'slug@0.0.1').
 * @example
 * type MyAgency = {
 *   prompts: {
 *     'prompt1': { versions: { '0.0.1': {}, 'latest': {} } },
 *     'prompt2': { versions: { '1.0.0': {}, 'latest': {} } }
 *   },
 *   globals: {}
 * };
 * type MyPromptIDs = PromptIdentifier<MyAgency>; // "prompt1" | "prompt2" | "prompt1@0.0.1" | "prompt1@latest" | "prompt2@1.0.0" | "prompt2@latest"
 */
type PromptIdentifier<CurAgency extends GenericAgency> = AgencyPromptSlugs<CurAgency> | {
    [SPSlug in AgencyPromptSlugs<CurAgency>]: `${SPSlug}@${AllPromptVersionKeys<CurAgency, SPSlug>}`;
}[AgencyPromptSlugs<CurAgency>];
type HasRequiredKeys<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T] extends never ? false : true;
/**
 * @template CurAgency - The agency type, extending GenericAgency.
 * @template T - A prompt identifier, either a slug or 'slug@version'.
 * @description Retrieves the type of the `variables` object for a specified prompt and version.
 * If only a slug is provided, it defaults to the 'latest' version of that prompt.
 * @example
 * type MyAgency = {
 *   prompts: {
 *     'greeting': {
 *       versions: {
 *         '0.0.1': { variables: { name: string; } },
 *         'latest': { variables: { title: string; name: string; } }
 *       }
 *     }
 *   },
 *   globals: {}
 * };
 * type GreetingLatestVars = GetPromptVariables<MyAgency, 'greeting'>; // { title: string; name: string; }
 * type GreetingSpecificVars = GetPromptVariables<MyAgency, 'greeting@0.0.1'>; // { name: string; }
 */
type GetPromptVariables<CurAgency extends GenericAgency, T extends PromptIdentifier<CurAgency>> = T extends `${infer Slug}@${infer Version}` ? Slug extends AgencyPromptSlugs<CurAgency> ? Version extends AllPromptVersionKeys<CurAgency, Slug> ? CurAgency['prompts'][Slug]['versions'][Version] extends {
    variables: infer V;
} ? V : Record<string, never> : Record<string, never> : Record<string, never> : T extends AgencyPromptSlugs<CurAgency> ? 'latest' extends AllPromptVersionKeys<CurAgency, T> ? CurAgency['prompts'][T]['versions']['latest'] extends {
    variables: infer V;
} ? V : Record<string, never> : Record<string, never> : Record<string, never>;

type ProviderName = 'OpenAI' | 'Anthropic' | 'Google' | 'Google AI Studio' | 'Amazon Bedrock' | 'Groq' | 'SambaNova' | 'Cohere' | 'Mistral' | 'Together' | 'Together 2' | 'Fireworks' | 'DeepInfra' | 'Lepton' | 'Novita' | 'Avian' | 'Lambda' | 'Azure' | 'Modal' | 'AnyScale' | 'Replicate' | 'Perplexity' | 'Recursal' | 'OctoAI' | 'DeepSeek' | 'Infermatic' | 'AI21' | 'Featherless' | 'Inflection' | 'xAI' | 'Cloudflare' | 'SF Compute' | 'Minimax' | 'Nineteen' | 'Liquid' | 'InferenceNet' | 'Friendli' | 'AionLabs' | 'Alibaba' | 'Nebius' | 'Chutes' | 'Kluster' | 'Crusoe' | 'Targon' | 'Ubicloud' | 'Parasail' | '01.AI' | 'HuggingFace' | 'Mancer' | 'Mancer 2' | 'Hyperbolic' | 'Hyperbolic 2' | 'Lynn 2' | 'Lynn' | 'Reflection';
type QuantizationLevel = 'int4' | 'int8' | 'fp4' | 'fp6' | 'fp8' | 'fp16' | 'bf16' | 'fp32' | 'unknown';
type DataCollectionSetting = 'deny' | 'allow';
type SortStrategy = 'price' | 'throughput' | 'latency';
type ProviderPreferencesSchema = {
    /**
     * Whether to allow backup providers to serve requests
     * - true: (default) when the primary provider (or your custom providers in "order") is unavailable, use the next best provider.
     * - false: use only the primary/custom provider, and return the upstream error if it's unavailable.
     */
    allow_fallbacks?: boolean | null;
    /**
     * Whether to filter providers to only those that support the parameters you've provided.
     * If this setting is omitted or set to false, then providers will receive only the parameters
     * they support, and ignore the rest.
     */
    require_parameters?: boolean | null;
    /**
     * Data collection setting. If no available model provider meets the requirement, your request will return an error.
     * - allow: (default) allow providers which store user data non-transiently and may train on it
     * - deny: use only providers which do not collect user data.
     */
    data_collection?: DataCollectionSetting | null;
    /**
     * An ordered list of provider names. The router will attempt to use the first provider
     * in the subset of this list that supports your requested model, and fall back to the next
     * if it is unavailable. If no providers are available, the request will fail with an error message.
     */
    order?: ProviderName[] | null;
    /**
     * List of provider names to ignore. If provided, this list is merged with your
     * account-wide ignored provider settings for this request.
     */
    ignore?: ProviderName[] | null;
    /**
     * A list of quantization levels to filter the provider by.
     */
    quantizations?: QuantizationLevel[] | null;
    /**
     * The sorting strategy to use for this request, if "order" is not specified.
     * When set, no load balancing is performed.
     */
    sort?: SortStrategy | null;
};
type WebPlugin = {
    id: 'web';
    max_results: number;
    /**
     * Search prompt default at time of writing (check the docs for updates):
     *
     * A web search was conducted on `date`. Incorporate the following web search results into your response.
     *
     * IMPORTANT: Cite them using markdown links named using the domain of the source.
     * Example: [nytimes.com](https://nytimes.com/some-page).
     *
     */
    search_prompt: string;
};
type OpenrouterPlugin = WebPlugin;
type JSONSchemaType = 'string' | 'number' | 'boolean' | 'integer' | 'object' | 'array' | 'null';
type JSONSchemaPropertyDefinition = {
    type?: JSONSchemaType | JSONSchemaType[];
    description?: string;
    enum?: any[];
    items?: JSONSchemaPropertyDefinition | {
        $ref: string;
    };
    properties?: Record<string, JSONSchemaPropertyDefinition>;
    required?: string[];
    additionalProperties?: boolean;
    anyOf?: JSONSchemaPropertyDefinition[];
    $ref?: string;
};
type JSONSchemaDefinition = {
    type: JSONSchemaType | JSONSchemaType[];
    description?: string;
    properties?: Record<string, JSONSchemaPropertyDefinition>;
    required?: string[];
    additionalProperties?: boolean;
    anyOf?: JSONSchemaPropertyDefinition[];
    $defs?: Record<string, JSONSchemaDefinition>;
    items?: JSONSchemaPropertyDefinition | {
        $ref: string;
    };
};
type JSONSchema = {
    name?: string;
    strict: boolean;
    schema: JSONSchemaDefinition;
};
type ResponseFormat = {
    type: 'json_schema';
    json_schema: JSONSchema;
};
type OpenrouterRequestBody = {
    messages?: Message[];
    prompt?: string;
    model?: string;
    response_format?: ResponseFormat;
    stop?: string | string[];
    stream?: boolean;
    max_tokens?: number;
    temperature?: number;
    tools?: Tool[];
    tool_choice?: ToolChoice;
    seed?: number;
    top_p?: number;
    top_k?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    repetition_penalty?: number;
    logit_bias?: {
        [key: number]: number;
    };
    top_logprobs?: number;
    min_p?: number;
    top_a?: number;
    prediction?: {
        type: 'content';
        content: string;
    };
    transforms?: string[];
    models?: string[];
    route?: 'fallback';
    provider?: ProviderPreferencesSchema;
    user?: string;
    plugins?: OpenrouterPlugin[];
    usage?: {
        include: true;
    };
};
type CompletionConfig = Omit<OpenrouterRequestBody, 'messages' | 'prompt'>;
type TextContent = {
    type: 'text';
    text: string;
};
type ImageContentPart = {
    type: 'image_url';
    image_url: {
        url: string;
        detail?: string;
    };
};
type ContentPart = TextContent | ImageContentPart;
type Message = {
    role: 'user' | 'assistant' | 'system';
    content: string | ContentPart[];
    name?: string;
} | {
    role: 'tool';
    content: string;
    tool_call_id: string;
    name?: string;
};
type FunctionDescription = {
    description?: string;
    name: string;
    parameters: object;
};
type Tool = {
    type: 'function';
    function: FunctionDescription;
};
type ToolChoice = 'none' | 'auto' | {
    type: 'function';
    function: {
        name: string;
    };
};
type ResponseUsage = {
    /** Total cost of the request */
    cost: number;
    /** Whether this is a bring-your-own-key request */
    is_byok: boolean;
    /** Total tokens used in the request */
    total_tokens: number;
    /** Tokens used in the prompt */
    prompt_tokens: number;
    /** Tokens used in the completion */
    completion_tokens: number;
    /** Details about prompt token usage */
    prompt_tokens_details?: {
        /** Number of tokens that were cached */
        cached_tokens?: number;
    };
    /** Details about completion token usage */
    completion_tokens_details?: {
        /** Number of tokens used for reasoning */
        reasoning_tokens?: number;
    };
};
type Annotation = {
    type: 'url_citation';
    text?: string;
    url_citation?: {
        url: string;
        title: string;
        content: string;
        end_index: number;
        start_index: number;
    };
};
type NonStreamingChoice = {
    index?: number;
    finish_reason: string | null;
    native_finish_reason: string | null;
    message: {
        role: string;
        content: string | null;
        refusal?: string | null;
        reasoning?: string;
        annotations?: Annotation[];
        tool_calls?: ToolCall[];
    };
    error?: ErrorResponse;
};
type ErrorResponse = {
    code: number;
    message: string;
    metadata?: Record<string, unknown>;
};
type ToolCall = {
    id: string;
    type: 'function';
    function: any;
};
type OpenrouterNonStreamingResponse = {
    id: string;
    choices: NonStreamingChoice[];
    created: number;
    model: string;
    object: 'chat.completion';
    usage?: ResponseUsage;
};

type PromptConstructorOptions<Agency extends GenericAgency, PromptArg extends PromptIdentifier<Agency>> = {
    arg: PromptArg;
    client: AgentsmithClient<Agency>;
};
type CompileOptions<Agency extends GenericAgency> = {
    globals?: Partial<{
        [K in keyof Agency['globals']]: string;
    }>;
};
type ExecuteOptions<Agency extends GenericAgency> = {
    globals?: Partial<{
        [K in keyof Agency['globals']]: string;
    }>;
    config?: CompletionConfig;
};
type CompileArgs<Agency extends GenericAgency, PromptArg extends PromptIdentifier<Agency>> = HasRequiredKeys<GetPromptVariables<Agency, PromptArg>> extends true ? [variables: GetPromptVariables<Agency, PromptArg>, options?: CompileOptions<Agency>] : [options?: CompileOptions<Agency>];
type ExecuteArgs<Agency extends GenericAgency, PromptArg extends PromptIdentifier<Agency>> = HasRequiredKeys<GetPromptVariables<Agency, PromptArg>> extends true ? [variables: GetPromptVariables<Agency, PromptArg>, options?: ExecuteOptions<Agency>] : [options?: ExecuteOptions<Agency>];
declare class Prompt<Agency extends GenericAgency, PromptArg extends PromptIdentifier<Agency>> {
    private client;
    private slug;
    private argVersion;
    meta: {
        uuid: string;
        name: string;
        slug: string;
    };
    version: {
        uuid: string;
        version: string;
        config: CompletionConfig;
        content: string;
    };
    variables: {
        uuid: string;
        name: string;
        type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
        required: boolean;
        default_value: string | null;
    }[];
    constructor(options: PromptConstructorOptions<Agency, PromptArg>);
    init(): Promise<void>;
    compile(...args: CompileArgs<Agency, PromptArg>): Promise<{
        compiledPrompt: string;
        finalVariables: {
            global: Record<string, any>;
        };
    }>;
    execute(...args: ExecuteArgs<Agency, PromptArg>): Promise<{
        completion: OpenrouterNonStreamingResponse;
        logUuid: string;
    }>;
}

type AgentsmithClientOptions = {
    agentsmithApiRoot?: string;
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    agentsmithDirectory?: string;
};
declare class AgentsmithClient<Agency extends GenericAgency> {
    supabase: SupabaseClient<Database>;
    projectUuid: string;
    agentsmithDirectory: string;
    private sdkApiKey;
    private fetchGlobalsPromise;
    private projectGlobals;
    private initializePromise;
    private agentsmithApiRoot;
    private supabaseUrl;
    private supabaseAnonKey;
    constructor(sdkApiKey: string, projectId: string, options?: AgentsmithClientOptions);
    private initialize;
    private exchangeApiKeyForJwt;
    getPrompt<PromptArg extends PromptIdentifier<Agency>>(arg: PromptArg): Promise<Prompt<Agency, PromptArg>>;
    initializeGlobals(): Promise<Agency['globals']>;
    fetchGlobals(): Promise<Agency['globals']>;
}

export { type AgencyPromptSlugs, AgentsmithClient, type AllPromptVersionKeys, type GenericAgency, type GenericPrompt, type GenericPromptVersion, type GetPromptVariables, type HasRequiredKeys, Prompt, type PromptIdentifier };
