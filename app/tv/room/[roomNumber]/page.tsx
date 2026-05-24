import { TvDisplay } from "./tv-display";

// Cache shell for 5 min — TvDisplay polls live data client-side
export const revalidate = 300;

export default async function TvRoomPage({
  params,
}: {
  params: Promise<{ roomNumber: string }>;
}) {
  const { roomNumber } = await params;
  return <TvDisplay roomNumber={roomNumber} />;
}
