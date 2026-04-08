import Link from "next/link";

const cards = [
  {
    href: "/info/why-reading",
    title: "Why Reading Matters",
    description:
      "Discover how reading shapes your child's brain, builds empathy, and sets the foundation for lifelong learning.",
    icon: (
      <svg
        className="w-8 h-8 text-brand-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
  },
  {
    href: "/info/milestones",
    title: "Reading Milestones",
    description:
      "Age-by-age guide to what reading skills to expect, from first sounds to independent chapter books.",
    icon: (
      <svg
        className="w-8 h-8 text-green-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
        />
      </svg>
    ),
  },
  {
    href: "/info/tips",
    title: "Tips for Parents",
    description:
      "Practical strategies for making reading a joyful daily habit, choosing books, and supporting your child's growth.",
    icon: (
      <svg
        className="w-8 h-8 text-purple-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
  },
];

export default function InfoHubPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-stone-900 font-[family-name:var(--font-lexend)]">
          Parent Resources
        </h1>
        <p className="mt-2 text-stone-500 max-w-lg mx-auto font-[family-name:var(--font-literata)]">
          Everything you need to support your child&apos;s reading journey,
          backed by research and designed with love.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md hover:border-brand-200 transition-all"
          >
            <div className="mb-4">{card.icon}</div>
            <h2 className="text-lg font-bold text-stone-900 font-[family-name:var(--font-lexend)] group-hover:text-brand-600 transition-colors">
              {card.title}
            </h2>
            <p className="mt-2 text-sm text-stone-500 font-[family-name:var(--font-literata)] leading-relaxed">
              {card.description}
            </p>
            <span className="inline-block mt-4 text-sm text-brand-500 font-medium">
              Read more &rarr;
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
