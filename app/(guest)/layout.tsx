import { GuestPushSetup } from "@/components/hotel/guest-push-setup";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GuestPushSetup />
    </>
  );
}
