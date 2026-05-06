"use client";

import dynamic from "next/dynamic";

const Header = dynamic(() => import("@/components/Header"), {
  ssr: false,
});

export default function HeaderShell() {
  return <Header />;
}
