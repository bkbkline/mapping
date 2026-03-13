import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-[#F9FAFB] mb-4">
          Land <span className="text-[#F59E0B]">Intel</span>
        </h1>
        <p className="text-xl text-[#9CA3AF] mb-8">
          Map-based land intelligence platform for industrial real estate professionals.
          Site selection, underwriting, and market analysis in a single GIS interface.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-[#F59E0B] text-[#0A0E1A] font-semibold rounded-lg hover:bg-[#D97706] transition-colors min-h-[44px] flex items-center"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-8 py-3 border border-[#374151] text-[#F9FAFB] font-semibold rounded-lg hover:bg-[#1F2937] transition-colors min-h-[44px] flex items-center"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
