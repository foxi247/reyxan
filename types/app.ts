import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type GuestAccessRequest =
  Database["public"]["Tables"]["guest_access_requests"]["Row"];
export type Guest = Database["public"]["Tables"]["guests"]["Row"];
export type Room = Database["public"]["Tables"]["rooms"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type ServiceRequest =
  Database["public"]["Tables"]["service_requests"]["Row"];
export type ChatThread = Database["public"]["Tables"]["chat_threads"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];
export type MenuCategory =
  Database["public"]["Tables"]["menu_categories"]["Row"];
export type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
export type RoomServiceOrder =
  Database["public"]["Tables"]["room_service_orders"]["Row"];
export type RoomServiceOrderItem =
  Database["public"]["Tables"]["room_service_order_items"]["Row"];
export type HotelSettings =
  Database["public"]["Tables"]["hotel_settings"]["Row"];

export interface GuestSession {
  guestId: string;
  phone: string;
  roomId: string | null;
  roomNumber: string | null;
  firstName: string;
  lastName: string;
  checkIn: string;
  checkOut: string;
  status: Guest["status"];
  threadId: string | null;
}

export interface ActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AdminStats {
  activeGuests: number;
  pendingRequests: number;
  serviceRequests: number;
  foodOrders: number;
}

export interface ChatThreadWithGuest extends ChatThread {
  guests: Pick<Guest, "first_name" | "last_name" | "phone"> | null;
  rooms: Pick<Room, "number"> | null;
  unread_count?: number;
  last_message?: string;
}

export interface ServiceRequestWithDetails extends ServiceRequest {
  guests: Pick<Guest, "first_name" | "last_name"> | null;
  rooms: Pick<Room, "number"> | null;
  services: Pick<Service, "title" | "icon"> | null;
}

export interface OrderWithDetails extends RoomServiceOrder {
  guests: Pick<Guest, "first_name" | "last_name"> | null;
  rooms: Pick<Room, "number"> | null;
  items: (RoomServiceOrderItem & {
    menu_items: Pick<MenuItem, "name"> | null;
  })[];
}

export interface GuestWithRoom extends Guest {
  rooms: Pick<Room, "number" | "floor"> | null;
}

export type ServiceActionType = "chat" | "request" | "page" | "link";

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  price: number;
  name: string;
}
