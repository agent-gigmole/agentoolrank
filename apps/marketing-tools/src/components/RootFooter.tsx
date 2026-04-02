export function RootFooter() {
  return (
    <footer className="border-t border-gray-200 py-6 mt-12">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
        <span>
          AIMarketRank — Data-driven AI marketing tools directory
        </span>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/agent-gigmole/aimarketrank"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
