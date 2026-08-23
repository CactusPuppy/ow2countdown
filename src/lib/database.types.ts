export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      "upcoming-events": {
        Row: {
          id: number
          created_at: string | null
          date: string | null
          title: string
          description: string | null
          group: string | null
          priority: number
          tags: string | null
          end_date: string | null
        }
        Insert: {
          id?: number
          created_at?: string | null
          date?: string | null
          title: string
          description?: string | null
          group?: string | null
          priority?: number
          tags?: string | null
          end_date?: string | null
        }
        Update: {
          id?: number
          created_at?: string | null
          date?: string | null
          title?: string
          description?: string | null
          group?: string | null
          priority?: number
          tags?: string | null
          end_date?: string | null
        }
      }
      tags: {
        Row: {
          id: number
          name: string
          color: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          color?: string | null
          created_at?: string
        }
      }
      event_tags: {
        Row: {
          event_id: number
          tag_id: number
        }
        Insert: {
          event_id: number
          tag_id: number
        }
        Update: {
          event_id?: number
          tag_id?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      install_available_extensions_and_test: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      save_event: {
        Args: {
          event_id?: number | null
          event_data: Json
          tag_names: string[]
        }
        Returns: Database["public"]["Tables"]["upcoming-events"]["Row"]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
