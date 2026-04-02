"use client";

import { usePathname } from "next/navigation";
import { Nav } from "./Nav";

export function RootNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/zh")) return null;
  return <Nav locale="en" />;
}
