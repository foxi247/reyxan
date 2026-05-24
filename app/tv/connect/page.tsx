// Static page — no server-side data fetching.
// Rooms are loaded client-side via public Supabase anon key.
export default function TvConnectPage() {
  return <ClientPage />;
}

import { ClientPage } from "./tv-connect-client";
