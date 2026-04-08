import Link from "next/link";

const sections = [
  {
    icon: (
      <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Brain Development",
    content: [
      "Reading aloud to children from birth activates regions of the brain associated with language comprehension, mental imagery, and narrative processing. During the first five years, a child's brain forms more than one million new neural connections every second, and early exposure to language through reading directly fuels this development.",
      "By age three, children who are read to regularly show measurably larger vocabularies and stronger pre-reading skills. Brain imaging studies have shown that children with rich literacy environments have more activity in the parts of the brain responsible for visual imagery and understanding meaning.",
      "For school-age children, independent reading strengthens the neural pathways that support fluent decoding, comprehension, and critical thinking. These pathways continue to develop well into adolescence.",
    ],
  },
  {
    icon: (
      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    title: "The Power of 20 Minutes a Day",
    content: [
      "Research consistently shows that children who read for just 20 minutes a day are exposed to approximately 1.8 million words per year. This massive volume of exposure builds vocabulary, improves spelling, and develops an intuitive understanding of grammar and sentence structure.",
      "In contrast, children who read only 5 minutes per day encounter roughly 282,000 words per year, and those who read for just 1 minute per day see only about 8,000. The gap compounds over time, creating a significant vocabulary advantage for regular readers by the time they reach middle school.",
      "Even small increases in daily reading time can dramatically improve outcomes. The key is consistency rather than marathon sessions.",
    ],
  },
  {
    icon: (
      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: "Academic Impact",
    content: [
      "Reading proficiency is one of the strongest predictors of academic success across all subjects. Children who read at grade level by third grade are significantly more likely to graduate from high school and pursue higher education.",
      "Strong readers perform better not just in language arts but also in science, mathematics, and social studies. This is because reading comprehension is the foundation skill needed to learn from textbooks, understand word problems, and engage with complex instructions.",
      "Early reading difficulties, if not addressed, tend to persist. Children who struggle with reading in first grade have an 88% chance of still struggling in fourth grade without targeted intervention. This makes early, enjoyable reading experiences critically important.",
    ],
  },
  {
    icon: (
      <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    title: "Empathy & Emotional Intelligence",
    content: [
      "Stories allow children to experience the world through someone else's eyes. When children follow a character through challenges, they practice perspective-taking, a core component of empathy. Research has shown that regular fiction readers demonstrate higher levels of empathy and social understanding.",
      "Books also give children a safe space to explore complex emotions like fear, sadness, jealousy, and loss. Through characters' experiences, children learn that these feelings are normal and gain language to express their own emotions.",
      "Discussing stories together deepens this effect. When parents ask questions like \"How do you think that character felt?\" they actively build their child's emotional vocabulary and reasoning skills.",
    ],
  },
  {
    icon: (
      <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Creativity & Imagination",
    content: [
      "Unlike passive screen-based media, reading requires the brain to actively construct visual imagery, soundscapes, and emotional textures from text alone. This active imagination-building strengthens creative thinking skills that transfer to problem-solving, innovation, and artistic expression.",
      "Children who read widely develop larger stores of knowledge, ideas, and narrative patterns that they draw upon in their own creative work, from writing stories to building elaborate pretend-play scenarios.",
    ],
  },
  {
    icon: (
      <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Stress Reduction & Wellbeing",
    content: [
      "Reading has been shown to reduce stress levels by up to 68%, making it more effective than listening to music, going for a walk, or having a cup of tea, according to research from the University of Sussex. Just six minutes of reading can begin to lower heart rate and ease muscle tension.",
      "For children, a calm bedtime reading routine provides a predictable, soothing transition from the activity of the day to sleep. This ritual creates feelings of safety and connection while also winding down the nervous system.",
    ],
  },
];

export default function WhyReadingPage() {
  return (
    <div className="space-y-8">
      <Link
        href="/info"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All Resources
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-stone-900 font-[family-name:var(--font-lexend)]">
          Why Reading Matters
        </h1>
        <p className="mt-2 text-stone-500 font-[family-name:var(--font-literata)] max-w-2xl">
          The science is clear: reading is one of the most powerful things you
          can do for your child&apos;s development. Here&apos;s what the
          research tells us.
        </p>
      </div>

      <div className="space-y-10">
        {sections.map((section) => (
          <section
            key={section.title}
            className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-100"
          >
            <div className="flex items-center gap-3 mb-4">
              {section.icon}
              <h2 className="text-xl font-bold text-stone-900 font-[family-name:var(--font-lexend)]">
                {section.title}
              </h2>
            </div>
            <div className="space-y-4">
              {section.content.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-stone-700 font-[family-name:var(--font-literata)] leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="bg-brand-50 rounded-2xl p-6 border border-brand-100">
        <h3 className="font-bold text-stone-900 font-[family-name:var(--font-lexend)] mb-2">
          Sources & Further Reading
        </h3>
        <ul className="space-y-1 text-sm text-stone-600 font-[family-name:var(--font-literata)]">
          <li>Anderson, R.C., Wilson, P.T. & Fielding, L.G. (1988). Growth in reading and how children spend their time outside of school. Reading Research Quarterly.</li>
          <li>Hutton, J.S. et al. (2015). Home reading environment and brain activation in preschool children. Pediatrics.</li>
          <li>Lewis, D. (2009). Galaxy Stress Research. University of Sussex.</li>
          <li>National Institute of Child Health and Human Development. (2000). Report of the National Reading Panel.</li>
          <li>Cunningham, A.E. & Stanovich, K.E. (1997). Early reading acquisition and its relation to reading experience and ability 10 years later. Developmental Psychology.</li>
        </ul>
      </div>
    </div>
  );
}
