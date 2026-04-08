import Link from "next/link";
import { Header } from "@/components/shared/Header";
import { GuaranteeBadge } from "@/components/shared/GuaranteeBadge";

const FEATURES = [
  { icon: "📚", title: "1,000+ Illustrated Stories", desc: "From peek-a-boo board books to young adult novels. Every age, every interest." },
  { icon: "🧠", title: "Comprehension Quizzes", desc: "Age-appropriate questions after each book to build understanding and retention." },
  { icon: "🔊", title: "AI Read-Aloud", desc: "Professional narration with word-by-word highlighting. Perfect for bedtime or independent reading." },
  { icon: "🧩", title: "Vocabulary Puzzles", desc: "Fill-in-the-blank exercises that make learning new words feel like a game." },
  { icon: "📊", title: "Parent Dashboard", desc: "Track reading time, streaks, quiz scores, and estimated reading level — all in one place." },
  { icon: "🎯", title: "Personalized by Age", desc: "Books automatically matched to your child's level. Typography and layout adapt too." },
];

const AGE_TIERS = [
  { tier: "Baby", ages: "1-2", color: "from-pink-100 to-pink-50", emoji: "🌙", desc: "Board books with big pictures and simple words" },
  { tier: "Toddler", ages: "2-4", color: "from-green-100 to-green-50", emoji: "🌈", desc: "Short stories about feelings, animals, and adventure" },
  { tier: "Early Reader", ages: "4-6", color: "from-blue-100 to-blue-50", emoji: "🐉", desc: "Chapter starters with humor and heart" },
  { tier: "Reader", ages: "6-9", color: "from-orange-100 to-orange-50", emoji: "🔍", desc: "Mysteries, adventures, and page-turners" },
  { tier: "Middle Grade", ages: "9-12", color: "from-purple-100 to-purple-50", emoji: "🎮", desc: "Complex stories with real emotional depth" },
  { tier: "Young Adult", ages: "12-18", color: "from-slate-200 to-slate-100", emoji: "⚡", desc: "Thrillers, sci-fi, and stories that challenge" },
];

const STATS = [
  { number: "1,000+", label: "Books" },
  { number: "6", label: "Age Tiers" },
  { number: "16", label: "Genres" },
  { number: "90 days", label: "Guarantee" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 via-orange-50/30 to-white py-20 sm:py-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-brand-500 uppercase tracking-wider mb-4 font-[family-name:var(--font-lexend)]">
            Where young readers grow
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6 font-[family-name:var(--font-lexend)] leading-tight">
            Stories that grow{" "}
            <span className="text-brand-500">with your child</span>
          </h1>
          <p className="text-lg sm:text-xl text-stone-600 mb-10 max-w-2xl mx-auto font-[family-name:var(--font-literata)]">
            1,000+ illustrated books from baby to young adult, with built-in quizzes,
            puzzles, AI read-aloud, and a parent dashboard to track every milestone.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-colors shadow-lg shadow-brand-200/50 font-[family-name:var(--font-lexend)] w-full sm:w-auto text-center"
            >
              Start Reading Free
            </Link>
            <Link
              href="/library"
              className="bg-white hover:bg-stone-50 text-stone-700 font-semibold py-4 px-8 rounded-xl text-lg transition-colors border border-stone-200 font-[family-name:var(--font-lexend)] w-full sm:w-auto text-center"
            >
              Explore Library
            </Link>
          </div>

          <p className="text-xs text-stone-400 mt-4">
            6 free books included. No credit card required.
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-stone-200 bg-white py-8 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-brand-500 font-[family-name:var(--font-lexend)]">
                {stat.number}
              </div>
              <div className="text-sm text-stone-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4 font-[family-name:var(--font-lexend)]">
              Everything your child needs to love reading
            </h2>
            <p className="text-stone-600 max-w-xl mx-auto font-[family-name:var(--font-literata)]">
              Not just books — a complete reading ecosystem designed by educators and powered by AI.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl border border-stone-200 p-6 hover:shadow-md hover:border-brand-200 transition-all"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-stone-900 mb-2 font-[family-name:var(--font-lexend)]">
                  {feature.title}
                </h3>
                <p className="text-sm text-stone-600 font-[family-name:var(--font-literata)] leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Age tiers */}
      <section className="py-20 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4 font-[family-name:var(--font-lexend)]">
              Books for every age
            </h2>
            <p className="text-stone-600 max-w-xl mx-auto font-[family-name:var(--font-literata)]">
              From first words to first novels. Our library grows with your child.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {AGE_TIERS.map((tier) => (
              <Link
                key={tier.tier}
                href="/library"
                className={`bg-gradient-to-br ${tier.color} rounded-2xl p-5 hover:shadow-md transition-all group`}
              >
                <div className="text-3xl mb-3">{tier.emoji}</div>
                <h3 className="text-base font-bold text-stone-800 mb-1 font-[family-name:var(--font-lexend)] group-hover:text-brand-600 transition-colors">
                  {tier.tier}
                </h3>
                <p className="text-xs text-stone-500 font-semibold mb-2">
                  Ages {tier.ages}
                </p>
                <p className="text-xs text-stone-600 font-[family-name:var(--font-literata)] leading-relaxed">
                  {tier.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Challenge promo */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-brand-500 to-orange-500 rounded-2xl p-8 sm:p-10 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-8 -mb-8" />
            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl font-bold mb-3 font-[family-name:var(--font-lexend)]">
                5-Day Reading Challenge
              </h3>
              <p className="text-white/90 mb-6 max-w-md mx-auto font-[family-name:var(--font-literata)]">
                Can your child read 5 books in 5 days? Try our free challenge
                and watch their confidence grow.
              </p>
              <Link
                href="/challenge"
                className="inline-block bg-white text-brand-600 font-bold py-3 px-8 rounded-xl text-lg hover:bg-white/90 transition-colors font-[family-name:var(--font-lexend)]"
              >
                Start the Challenge
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4 font-[family-name:var(--font-lexend)]">
              Built for families, backed by research
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: "🤖", title: "AI-Crafted Stories", desc: "Every book is generated with care and reviewed for quality, age-appropriateness, and educational value." },
              { icon: "🛡️", title: "COPPA Compliant", desc: "No data collected from children. Parent-only accounts. Your family's privacy comes first." },
              { icon: "📱", title: "Read Anywhere", desc: "Works beautifully on phones, tablets, and desktops. Pick up where you left off on any device." },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-stone-900 mb-2 font-[family-name:var(--font-lexend)]">
                  {item.title}
                </h3>
                <p className="text-sm text-stone-600 font-[family-name:var(--font-literata)]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-16 px-4 bg-stone-50">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-3 font-[family-name:var(--font-lexend)]">
            Full access for <span className="text-brand-500">$99/year</span>
          </h2>
          <p className="text-stone-600 mb-6 font-[family-name:var(--font-literata)]">
            That&apos;s just $8.25/month for the entire family. Cancel anytime.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-xl text-lg transition-colors font-[family-name:var(--font-lexend)]"
          >
            View Pricing
          </Link>
          <div className="mt-6">
            <GuaranteeBadge size="sm" />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-brand-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4 font-[family-name:var(--font-lexend)]">
            Ready to watch them bloom?
          </h2>
          <p className="text-lg text-stone-600 mb-8 font-[family-name:var(--font-literata)]">
            Join thousands of families who are building a love of reading, one story at a time.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 px-10 rounded-xl text-xl transition-colors shadow-lg shadow-brand-200/50 font-[family-name:var(--font-lexend)]"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Product</h4>
              <div className="space-y-2 text-sm">
                <Link href="/library" className="block hover:text-white transition-colors">Library</Link>
                <Link href="/pricing" className="block hover:text-white transition-colors">Pricing</Link>
                <Link href="/challenge" className="block hover:text-white transition-colors">5-Day Challenge</Link>
                <Link href="/classroom" className="block hover:text-white transition-colors">For Schools</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Parents</h4>
              <div className="space-y-2 text-sm">
                <Link href="/dashboard" className="block hover:text-white transition-colors">Dashboard</Link>
                <Link href="/info" className="block hover:text-white transition-colors">For Parents</Link>
                <Link href="/info/why-reading" className="block hover:text-white transition-colors">Why Reading</Link>
                <Link href="/info/tips" className="block hover:text-white transition-colors">Reading Tips</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Account</h4>
              <div className="space-y-2 text-sm">
                <Link href="/auth/signup" className="block hover:text-white transition-colors">Sign Up</Link>
                <Link href="/auth/login" className="block hover:text-white transition-colors">Sign In</Link>
                <Link href="/account" className="block hover:text-white transition-colors">My Account</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Company</h4>
              <div className="space-y-2 text-sm">
                <span className="block">Literoo by ChillPlayVibe</span>
                <span className="block">AI-crafted, educator-reviewed</span>
              </div>
            </div>
          </div>
          <div className="border-t border-stone-800 pt-6 text-center text-xs text-stone-500">
            &copy; {new Date().getFullYear()} Literoo. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
