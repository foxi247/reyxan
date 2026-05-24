import { TvDisplay } from "./tv-display";

export default async function TvRoomPage({
  params,
}: {
  params: Promise<{ roomNumber: string }>;
}) {
  const { roomNumber } = await params;
  return <TvDisplay roomNumber={roomNumber} />;
}
