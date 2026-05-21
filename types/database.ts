export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: "admin" | "staff";
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role: "admin" | "staff";
          created_at?: string;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          role?: "admin" | "staff";
        };
      };
      guest_access_requests: {
        Row: {
          id: string;
          phone: string;
          status: "pending" | "approved" | "rejected";
          guest_id: string | null;
          ip_hash: string | null;
          user_agent: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          status?: "pending" | "approved" | "rejected";
          guest_id?: string | null;
          ip_hash?: string | null;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "pending" | "approved" | "rejected";
          guest_id?: string | null;
          updated_at?: string;
        };
      };
      guests: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          phone: string;
          room_id: string | null;
          check_in: string;
          check_out: string;
          status: "active" | "expired" | "blocked" | "checked_out";
          access_token_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          phone: string;
          room_id?: string | null;
          check_in: string;
          check_out: string;
          status?: "active" | "expired" | "blocked" | "checked_out";
          access_token_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          first_name?: string;
          last_name?: string;
          phone?: string;
          room_id?: string | null;
          check_in?: string;
          check_out?: string;
          status?: "active" | "expired" | "blocked" | "checked_out";
          access_token_hash?: string | null;
          updated_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          number: string;
          floor: number | null;
          status: "available" | "occupied" | "maintenance";
          created_at: string;
        };
        Insert: {
          id?: string;
          number: string;
          floor?: number | null;
          status?: "available" | "occupied" | "maintenance";
          created_at?: string;
        };
        Update: {
          number?: string;
          floor?: number | null;
          status?: "available" | "occupied" | "maintenance";
        };
      };
      services: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          icon: string;
          action_type: "chat" | "request" | "page" | "link";
          action_value: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          icon: string;
          action_type: "chat" | "request" | "page" | "link";
          action_value?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          icon?: string;
          action_type?: "chat" | "request" | "page" | "link";
          action_value?: string | null;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
      };
      service_requests: {
        Row: {
          id: string;
          guest_id: string;
          room_id: string | null;
          service_id: string | null;
          title: string;
          message: string | null;
          status: "new" | "in_progress" | "done" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          guest_id: string;
          room_id?: string | null;
          service_id?: string | null;
          title: string;
          message?: string | null;
          status?: "new" | "in_progress" | "done" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "new" | "in_progress" | "done" | "cancelled";
          updated_at?: string;
        };
      };
      chat_threads: {
        Row: {
          id: string;
          guest_id: string;
          room_id: string | null;
          status: "open" | "archived";
          last_message_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          guest_id: string;
          room_id?: string | null;
          status?: "open" | "archived";
          last_message_at?: string | null;
          created_at?: string;
        };
        Update: {
          status?: "open" | "archived";
          last_message_at?: string | null;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          thread_id: string;
          sender_type: "guest" | "admin";
          sender_id: string | null;
          message: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          sender_type: "guest" | "admin";
          sender_id?: string | null;
          message: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          read_at?: string | null;
        };
      };
      menu_categories: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          sort_order?: number;
          is_active?: boolean;
        };
      };
      menu_items: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          is_available?: boolean;
        };
      };
      room_service_orders: {
        Row: {
          id: string;
          guest_id: string;
          room_id: string | null;
          status: "new" | "preparing" | "delivering" | "delivered" | "cancelled";
          total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          guest_id: string;
          room_id?: string | null;
          status?: "new" | "preparing" | "delivering" | "delivered" | "cancelled";
          total?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "new" | "preparing" | "delivering" | "delivered" | "cancelled";
          updated_at?: string;
        };
      };
      room_service_order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string;
          quantity: number;
          price: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id: string;
          quantity?: number;
          price: number;
        };
        Update: {
          quantity?: number;
          price?: number;
        };
      };
      hotel_settings: {
        Row: {
          id: string;
          hotel_name: string;
          reception_phone: string | null;
          admin_email: string | null;
          wifi_name: string | null;
          wifi_password: string | null;
          food_delivery_hours: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hotel_name?: string;
          reception_phone?: string | null;
          admin_email?: string | null;
          wifi_name?: string | null;
          wifi_password?: string | null;
          food_delivery_hours?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          hotel_name?: string;
          reception_phone?: string | null;
          admin_email?: string | null;
          wifi_name?: string | null;
          wifi_password?: string | null;
          food_delivery_hours?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
