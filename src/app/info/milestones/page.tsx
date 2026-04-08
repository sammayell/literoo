export default function MilestonesPage() {
  const milestones = [
    { age: "0-1 years", title: "Sound Explorer", skills: ["Responds to voices and sounds", "Grasps and mouths board books", "Looks at high-contrast images", "Enjoys being read to for short periods"], color: "bg-pink-50 border-pink-200" },
    { age: "1-2 years", title: "Page Turner", skills: ["Points at pictures when named", "Turns thick board book pages", "Babbles along with reading", "Has favorite books they request"], color: "bg-red-50 border-red-200" },
    { age: "2-3 years", title: "Story Lover", skills: ["Names objects in pictures", "Fills in words in familiar stories", "Pretend-reads to stuffed animals", "Understands simple story sequences"], color: "bg-orange-50 border-orange-200" },
    { age: "3-4 years", title: "Letter Spotter", skills: ["Recognizes some letters", "Understands print carries meaning", "Can retell familiar stories", "Notices rhyming words"], color: "bg-amber-50 border-amber-200" },
    { age: "4-5 years", title: "Sound Detective", skills: ["Connects letters to sounds", "Recognizes their name in print", "Identifies rhyming words", "Predicts what happens next"], color: "bg-yellow-50 border-yellow-200" },
    { age: "5-6 years", title: "Beginning Reader", skills: ["Reads simple three-letter words", "Recognizes common sight words", "Uses picture clues to help read", "Reads simple sentences with support"], color: "bg-lime-50 border-lime-200" },
    { age: "6-7 years", title: "Growing Reader", skills: ["Reads simple books independently", "Self-corrects when reading", "Reads with increasing fluency", "Begins to read silently"], color: "bg-green-50 border-green-200" },
    { age: "7-9 years", title: "Confident Reader", skills: ["Reads chapter books for pleasure", "Understands character motivations", "Connects books to real life", "Reads a variety of genres"], color: "bg-teal-50 border-teal-200" },
    { age: "9-12 years", title: "Independent Reader", skills: ["Tackles complex narratives", "Analyzes themes and purpose", "Reads 30+ minutes at a stretch", "Discusses books with depth"], color: "bg-blue-50 border-blue-200" },
    { age: "12+ years", title: "Critical Reader", skills: ["Engages with diverse perspectives", "Evaluates arguments and evidence", "Understands subtext and symbolism", "Forms and defends opinions"], color: "bg-purple-50 border-purple-200" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl sm:text-4xl font-bold mb-3 font-[family-name:var(--font-lexend)] text-stone-900">Reading Milestones</h1>
      <p className="text-lg text-stone-600 mb-10 font-[family-name:var(--font-literata)]">Every child develops at their own pace. These milestones are general guides, not strict timelines.</p>
      <div className="space-y-6">
        {milestones.map((m, i) => (
          <div key={i} className={`${m.color} border rounded-2xl p-6`}>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-sm font-bold text-stone-500 uppercase tracking-wider">{m.age}</span>
              <h3 className="text-xl font-bold text-stone-800 font-[family-name:var(--font-lexend)]">{m.title}</h3>
            </div>
            <ul className="space-y-2">
              {m.skills.map((skill, si) => (
                <li key={si} className="flex items-start gap-2 text-stone-700 font-[family-name:var(--font-literata)]">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>{skill}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-12 p-6 bg-brand-50 rounded-2xl border border-brand-200 text-center">
        <p className="text-stone-700 font-[family-name:var(--font-literata)]">Remember: these milestones are guidelines, not deadlines. If you have concerns, speak with their teacher or pediatrician.</p>
      </div>
    </div>
  );
}
