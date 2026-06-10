import AiCodeMockup from '@/components/marketing/AiCodeMockup'

const aiFeatures = [
  {
    title: 'Auto-tag suggestions',
    desc: 'AI analyzes content and suggests relevant tags automatically',
  },
  {
    title: 'AI Summary',
    desc: "Get a short summary of any item's content at a glance",
  },
  {
    title: 'Explain This Code',
    desc: 'Plain-English explanations for snippets and commands',
  },
  {
    title: 'Prompt Optimizer',
    desc: 'Rewrite and improve your AI prompts for better results',
  },
]

export default function AiFeaturesSection() {
  return (
    <section className="py-24 border-t border-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-400 mb-6">
              ✨ Pro Feature
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">AI-powered knowledge management</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Let AI do the heavy lifting. Auto-tag, explain, and optimize your developer knowledge.
            </p>
            <ul className="space-y-5">
              {aiFeatures.map(item => (
                <li key={item.title} className="flex items-start gap-3">
                  <span className="mt-0.5 text-green-500 text-lg leading-none">✓</span>
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — code editor mockup */}
          <AiCodeMockup />
        </div>
      </div>
    </section>
  )
}
