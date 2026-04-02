"use client";

import { usePathname } from "next/navigation";
import { Nav } from "./Nav";

export function RootNav() {
  const pathname = usePathname();
  // Don't render root Nav for /zh routes — zh layout has its own Nav
  if (pathname.startsWith("/zh")) return null;
  return <Nav locale="en" />;
}
