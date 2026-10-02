import { LocalizedToolIndex, localizedIndexMetadata } from "@/components/LocalizedToolIndex";

export const revalidate = 86400;
export const metadata = localizedIndexMetadata("zh");

export default function Page() {
  return <LocalizedToolIndex lang="zh" />;
}
