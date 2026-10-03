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
          date_timezone: string | null
          title: string
          description: string | null
          group: string | null
          priority: number
          tags: string | null
          end_date: string | null
          end_date_timezone: string | null
        }
        Insert: {
          id?: number
          created_at?: string | null
          date?: string | null
          date_timezone?: string | null
          title: string
          description?: string | null
          group?: string | null
          priority?: number
          tags?: string | null
          end_date?: string | null
          end_date_timezone?: string | null
        }
        Update: {
          id?: number
          created_at?: string | null
          date?: string | null
          date_timezone?: string | null
          title?: string
          description?: string | null
          group?: string | null
          priority?: number
          tags?: string | null
          end_date?: string | null
          end_date_timezone?: string | null
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
    }
    Enums: {
      [_ in never]: never
    }
  }
}
