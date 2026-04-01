// =============================================================
// types/database.ts — Supabase Database Types
// สะท้อนโครงสร้างตาราง Supabase ทั้งหมด
// ใช้กำหนด type ให้กับ Supabase client queries
// =============================================================

export type Database = {
  public: {
    Tables: {

      // --- ตาราง properties: ข้อมูลบ้านพักทั้งหมด ---
      properties: {
        Row: {
          id: string;
          name: string;
          slug: string;
          source: "deville" | "poolvillacity" | "manual";
          zone: "bangsaen" | "pattaya" | "sattahip" | "rayong" | null;
          source_url: string | null;
          source_property_id: string | null;
          description: string | null;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          max_guests: number;
          bedrooms: number;
          bathrooms: number;
          base_price: number | null;
          thumbnail_url: string | null;
          images: string[] | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          source: "deville" | "poolvillacity" | "manual";
          zone?: "bangsaen" | "pattaya" | "sattahip" | "rayong" | null;
          source_url?: string | null;
          source_property_id?: string | null;
          description?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          max_guests?: number;
          bedrooms?: number;
          bathrooms?: number;
          base_price?: number | null;
          thumbnail_url?: string | null;
          images?: string[] | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          source?: "deville" | "poolvillacity" | "manual";
          zone?: "bangsaen" | "pattaya" | "sattahip" | "rayong" | null;
          source_url?: string | null;
          source_property_id?: string | null;
          description?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          max_guests?: number;
          bedrooms?: number;
          bathrooms?: number;
          base_price?: number | null;
          thumbnail_url?: string | null;
          images?: string[] | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };

      // --- ตาราง availability: ข้อมูลวันว่าง/จอง ของแต่ละบ้าน ---
      availability: {
        Row: {
          id: string;
          property_id: string;
          date: string;
          status: "available" | "booked" | "blocked";
          price: number | null;
          source: "scraper" | "manual";
          scraped_at: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          property_id: string;
          date: string;
          status: "available" | "booked" | "blocked";
          price?: number | null;
          source?: "scraper" | "manual";
          scraped_at?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          property_id?: string;
          date?: string;
          status?: "available" | "booked" | "blocked";
          price?: number | null;
          source?: "scraper" | "manual";
          scraped_at?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "availability_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          }
        ];
      };

      // --- ตาราง scrape_logs: บันทึกประวัติการ scrape ---
      scrape_logs: {
        Row: {
          id: string;
          source: string;
          status: "success" | "error" | "partial";
          properties_updated: number;
          dates_updated: number;
          error_message: string | null;
          started_at: string;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          source: string;
          status: "success" | "error" | "partial";
          properties_updated?: number;
          dates_updated?: number;
          error_message?: string | null;
          started_at?: string;
          finished_at?: string | null;
        };
        Update: {
          id?: string;
          source?: string;
          status?: "success" | "error" | "partial";
          properties_updated?: number;
          dates_updated?: number;
          error_message?: string | null;
          started_at?: string;
          finished_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
