import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | VibeScan",
  description: "Complete your payment to run a Vibe Scan.",
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
