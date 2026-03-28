import Link from "next/link";

export function Nav() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="font-bold text-gray-900 text-lg">
          AgenTool Rank
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/stack" className="text-gray-600 hover:text-gray-900 transition-colors">
            Stacks
          </Link>
          <Link href="/compare" className="text-gray-600 hover:text-gray-900 transition-colors">
            Compare
          </Link>
          <Link href="/weekly" className="text-gray-600 hover:text-gray-900 transition-colors">
            Weekly
          </Link>
          <Link
            href="/search"
            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            AI Builder
          </Link>
        </div>
      </div>
    </nav>
  );
}
