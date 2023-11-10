export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clocks: {
        Row: {
          color: string | null
          created_at: string
          darken_intensity: number
          filled: number | null
          id: string
          lighten_intensity: number
          line_width: number
          name: string | null
          position: number | null
          rounded: boolean
          row_id: string
          segments: number
          tower_id: string
          users: string[] | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          darken_intensity?: number
          filled?: number | null
          id?: string
          lighten_intensity?: number
          line_width?: number
          name?: string | null
          position?: number | null
          rounded?: boolean
          row_id: string
          segments?: number
          tower_id: string
          users?: string[] | null
        }
        Update: {
          color?: string | null
          created_at?: string
          darken_intensity?: number
          filled?: number | null
          id?: string
          lighten_intensity?: number
          line_width?: number
          name?: string | null
          position?: number | null
          rounded?: boolean
          row_id?: string
          segments?: number
          tower_id?: string
          users?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "clocks_row_id_fkey"
            columns: ["row_id"]
            isOneToOne: false
            referencedRelation: "tower_rows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clocks_tower_id_fkey"
            columns: ["tower_id"]
            isOneToOne: false
            referencedRelation: "towers"
            referencedColumns: ["id"]
          }
        ]
      }
      friends: {
        Row: {
          friend_id: string
          user_id: string
        }
        Insert: {
          friend_id: string
          user_id?: string
        }
        Update: {
          friend_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          bg_color: string
          color: string | null
          icon: string | null
          icon_color: string | null
          id: string
          username: string | null
        }
        Insert: {
          bg_color?: string
          color?: string | null
          icon?: string | null
          icon_color?: string | null
          id?: string
          username?: string | null
        }
        Update: {
          bg_color?: string
          color?: string | null
          icon?: string | null
          icon_color?: string | null
          id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tower_rows: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string | null
          position: number
          tower_id: string
          users: string[] | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string | null
          position?: number
          tower_id: string
          users?: string[] | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string | null
          position?: number
          tower_id?: string
          users?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "tower_rows_tower_id_fkey"
            columns: ["tower_id"]
            isOneToOne: false
            referencedRelation: "towers"
            referencedColumns: ["id"]
          }
        ]
      }
      towers: {
        Row: {
          colors: Json | null
          created_at: string
          id: string
          name: string | null
          owner: string | null
          users: string[] | null
        }
        Insert: {
          colors?: Json | null
          created_at?: string
          id?: string
          name?: string | null
          owner?: string | null
          users?: string[] | null
        }
        Update: {
          colors?: Json | null
          created_at?: string
          id?: string
          name?: string | null
          owner?: string | null
          users?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "towers_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      towers_users: {
        Row: {
          created_at: string
          tower_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          tower_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          tower_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "towers_users_tower_id_fkey"
            columns: ["tower_id"]
            isOneToOne: false
            referencedRelation: "towers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "towers_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_to_tower: {
        Args: {
          tower: string
          new_user_id: string
        }
        Returns: undefined
      }
      remove_user_from_tower: {
        Args: {
          tower: string
          userid: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
