import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">LI Tools</h1>
          <p className="text-xl text-gray-400">NY & NJ event tracking for LED toy vendors</p>
        </div>

        <div className="max-w-md mx-auto">
          <Link href="/events" className="group block">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-blue-600 transition-colors">
              <div className="text-4xl mb-4">🎪</div>
              <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition-colors">Event Tracker</h2>
              <p className="text-gray-400 mb-4">
                Find every street fair, festival, fireworks show, and outdoor event in NY & NJ — 90 days ahead.
                Night events flagged for LED toy sales.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>30+ event sources scraped daily</li>
                <li>🌙 Night event detection (5 PM+)</li>
                <li>🎆 Fireworks company schedules</li>
                <li>🏖️ NJ carnivals, fairs & festivals</li>
                <li>Google Sheets export</li>
                <li>Daily email digest</li>
              </ul>
              <div className="mt-4 text-blue-400 text-sm font-medium group-hover:underline">Open Event Tracker &rarr;</div>
            </div>
          </Link>
        </div>

        <div className="text-center mt-12">
          <Link href="/setup" className="text-gray-500 hover:text-gray-300 text-sm">
            Setup API Keys
          </Link>
        </div>
      </div>
    </div>
  );
}
