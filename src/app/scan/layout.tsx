import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Run a Vibe Scan | VibeScan",
  description: "Upload your app code and get a plain-English security report.",
};

export default function ScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
