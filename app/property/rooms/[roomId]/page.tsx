import RoomProfile360 from "@/components/rooms/RoomProfile360";

export default async function RoomDetailsPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <RoomProfile360 roomId={roomId} />;
}
