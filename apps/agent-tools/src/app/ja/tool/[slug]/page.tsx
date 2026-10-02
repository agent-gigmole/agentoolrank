import type { Metadata } from "next";
import { LocalizedToolPage, localizedToolMetadata } from "@/components/LocalizedToolPage";

export const revalidate = 86400;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return localizedToolMetadata("ja", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <LocalizedToolPage lang="ja" slug={(await params).slug} />;
}
