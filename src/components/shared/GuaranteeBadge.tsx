export function GuaranteeBadge({ size = "sm" }: { size?: "sm" | "lg" }) {
  if (size === "lg") {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-3">🛡️</div>
        <h3 className="text-lg font-bold text-green-800 font-[family-name:var(--font-lexend)] mb-2">
          90-Day Reader Guarantee
        </h3>
        <p className="text-sm text-green-700 font-[family-name:var(--font-literata)] max-w-md mx-auto">
          If your child doesn&apos;t improve their reading within 90 days, we&apos;ll refund every penny{" "}
          <strong>and</strong> give you $20 for your time. No questions asked.
        </p>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold border border-green-200">
      <span>🛡️</span>
      90-Day Guarantee
    </span>
  );
}
