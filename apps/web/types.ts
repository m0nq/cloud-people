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
      Agents: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          config: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      AgentTools: {
        Row: {
          agent_id: string
          configuration: Json | null
          created_at: string
          tool_id: string
        }
        Insert: {
          agent_id: string
          configuration?: Json | null
          created_at?: string
          tool_id: string
        }
        Update: {
          agent_id?: string
          configuration?: Json | null
          created_at?: string
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "AgentTools_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "Agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AgentTools_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "Tools"
            referencedColumns: ["id"]
          },
        ]
      }
      Edges: {
        Row: {
          created_at: string
          from_node_id: string
          id: string
          to_node_id: string
          updated_at: string | null
          workflow_id: string
        }
        Insert: {
          created_at?: string
          from_node_id: string
          id?: string
          to_node_id: string
          updated_at?: string | null
          workflow_id: string
        }
        Update: {
          created_at?: string
          from_node_id?: string
          id?: string
          to_node_id?: string
          updated_at?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edges_from_node_id_fkey"
            columns: ["from_node_id"]
            isOneToOne: false
            referencedRelation: "Nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edges_to_node_id_fkey"
            columns: ["to_node_id"]
            isOneToOne: false
            referencedRelation: "Nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edges_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "Workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      Executions: {
        Row: {
          agent_id: string
          created_at: string
          current_status: string
          errors: Json | null
          history: Json
          id: string
          input: Json
          metrics: Json | null
          output: Json | null
          session_id: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          current_status?: string
          errors?: Json | null
          history?: Json
          id?: string
          input: Json
          metrics?: Json | null
          output?: Json | null
          session_id: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          current_status?: string
          errors?: Json | null
          history?: Json
          id?: string
          input?: Json
          metrics?: Json | null
          output?: Json | null
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Executions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "Agents"
            referencedColumns: ["id"]
          },
        ]
      }
      Nodes: {
        Row: {
          created_at: string
          current_step: string | null
          id: string
          node_type: string
          state: string | null
          updated_at: string | null
          workflow_id: string
        }
        Insert: {
          created_at?: string
          current_step?: string | null
          id?: string
          node_type?: string
          state?: string | null
          updated_at?: string | null
          workflow_id: string
        }
        Update: {
          created_at?: string
          current_step?: string | null
          id?: string
          node_type?: string
          state?: string | null
          updated_at?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nodes_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "Workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      Profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          subscription_plan: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          subscription_plan?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          subscription_plan?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      Tools: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          parameters: Json
          updated_at: string
          version: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          parameters: Json
          updated_at?: string
          version?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          parameters?: Json
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      VectorMemories: {
        Row: {
          agent_id: string
          content: string
          created_at: string
          embedding: string
          id: string
          metadata: Json
        }
        Insert: {
          agent_id: string
          content: string
          created_at?: string
          embedding: string
          id?: string
          metadata: Json
        }
        Update: {
          agent_id?: string
          content?: string
          created_at?: string
          embedding?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "VectorMemories_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "Agents"
            referencedColumns: ["id"]
          },
        ]
      }
      Workflows: {
        Row: {
          created_at: string | null
          current_step: string | null
          data: Json | null
          id: string
          state: Database["public"]["Enums"]["WorkflowState"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_step?: string | null
          data?: Json | null
          id?: string
          state?: Database["public"]["Enums"]["WorkflowState"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_step?: string | null
          data?: Json | null
          id?: string
          state?: Database["public"]["Enums"]["WorkflowState"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      WorkflowState: "Initial" | "Build" | "Running" | "Error" | "Complete"
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
