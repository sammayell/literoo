export default function TipsPage() {
  const sections = [
    {
      title: "Reading Aloud",
      icon: "📖",
      tips: [
        "Use different voices for different characters — kids love the performance",
        "Follow your child's finger as they point at pictures and words",
        "Pause to ask questions: 'What do you think happens next?'",
        "Re-read favorites as many times as they ask — repetition builds fluency",
        "Make it cozy: special reading spot, blanket, routine"
      ]
    },
    {
      title: "Building a Daily Routine",
      icon: "⏰",
      tips: [
        "Same time every day — bedtime is classic, but any consistent time works",
        "Start with just 10 minutes. Consistency beats duration",
        "Let them choose the book (even if you have read it 47 times)",
        "Keep books accessible — low shelves, book baskets, in the car",
        "Model reading yourself — kids imitate what they see"
      ]
    },
    {
      title: "Choosing the Right Books",
      icon: "🎯",
      tips: [
        "Match to interest, not just reading level — a passionate reader improves fastest",
        "Mix formats: picture books, comics, graphic novels, chapter books, non-fiction",
        "Use the 'five finger test': if they miss 5+ words on a page, it might be too hard",
        "Series are gold — once hooked, they want to keep going",
        "Include books with characters who look like them AND characters who do not"
      ]
    },
    {
      title: "Talking About Stories",
      icon: "💬",
      tips: [
        "Ask open-ended questions, not just 'did you like it?'",
        "Connect stories to real life: 'Remember when you felt like that character?'",
        "Let them disagree with the story or the characters",
        "Discuss the illustrations — what do they notice?",
        "No quizzing! Keep conversations natural, not like a test"
      ]
    },
    {
      title: "When Reading Feels Hard",
      icon: "🤗",
      tips: [
        "Never force reading as punishment or remove it as reward",
        "Audiobooks count as reading — they build vocabulary and comprehension",
        "Some kids are visual readers (comics, graphic novels) and that is perfectly valid",
        "If they are struggling, drop back to an easier level — confidence matters more than challenge",
        "Celebrate effort, not just achievement: 'You stuck with that tough chapter!'"
      ]
    },
    {
      title: "Screen Time Balance",
      icon: "📱",
      tips: [
        "Digital reading is still reading — what matters is engagement",
        "Use screen reading features: text-to-speech, word highlighting, adjustable fonts",
        "Set a 'reading before screens' rule — natural incentive",
        "E-readers with no apps/games reduce distraction",
        "Co-read digital books together, just like physical ones"
      ]
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl sm:text-4xl font-bold mb-3 font-[family-name:var(--font-lexend)] text-stone-900">Tips for Parents</h1>
      <p className="text-lg text-stone-600 mb-10 font-[family-name:var(--font-literata)]">Practical, research-backed strategies to help your child fall in love with reading.</p>
      <div className="space-y-8">
        {sections.map((section, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-stone-800 mb-4 font-[family-name:var(--font-lexend)] flex items-center gap-2">
              <span className="text-2xl">{section.icon}</span>
              {section.title}
            </h2>
            <ul className="space-y-3">
              {section.tips.map((tip, ti) => (
                <li key={ti} className="flex items-start gap-3 text-stone-700 font-[family-name:var(--font-literata)]">
                  <span className="text-brand-500 font-bold mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
