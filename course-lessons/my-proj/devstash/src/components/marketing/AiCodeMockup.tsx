export default function AiCodeMockup() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Titlebar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <span className="w-3 h-3 rounded-full bg-red-500" />
        <span className="w-3 h-3 rounded-full bg-amber-500" />
        <span className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-3 text-xs text-muted-foreground font-mono">useDebounce.ts</span>
      </div>
      {/* Code */}
      <pre className="font-mono text-xs leading-relaxed p-5 overflow-x-auto text-foreground">
        <span className="text-blue-400">import</span>
        <span className="text-foreground"> {'{ '}</span>
        <span className="text-cyan-400">useState</span>
        <span className="text-foreground">, </span>
        <span className="text-cyan-400">useEffect</span>
        <span className="text-foreground"> {'}'} </span>
        <span className="text-blue-400">from</span>
        <span className="text-green-400"> &apos;react&apos;</span>
        {'\n\n'}
        <span className="text-blue-400">export function</span>
        <span className="text-yellow-400"> useDebounce</span>
        <span className="text-foreground">{'<'}</span>
        <span className="text-cyan-300">T</span>
        <span className="text-foreground">{'>'}</span>
        <span className="text-foreground">{'('}</span>
        {'\n'}
        <span className="text-foreground">{'  '}</span>
        <span className="text-orange-300">value</span>
        <span className="text-foreground">: </span>
        <span className="text-cyan-300">T</span>
        <span className="text-foreground">,</span>
        {'\n'}
        <span className="text-foreground">{'  '}</span>
        <span className="text-orange-300">delay</span>
        <span className="text-foreground">: </span>
        <span className="text-cyan-300">number</span>
        {'\n'}
        <span className="text-foreground">{'): '}</span>
        <span className="text-cyan-300">T</span>
        <span className="text-foreground">{' {'}</span>
        {'\n'}
        <span className="text-foreground">{'  '}</span>
        <span className="text-blue-400">const</span>
        <span className="text-foreground"> [</span>
        <span className="text-orange-300">debounced</span>
        <span className="text-foreground">, </span>
        <span className="text-orange-300">setDebounced</span>
        <span className="text-foreground">] =</span>
        {'\n'}
        <span className="text-foreground">{'    '}</span>
        <span className="text-yellow-400">useState</span>
        <span className="text-foreground">{'<'}</span>
        <span className="text-cyan-300">T</span>
        <span className="text-foreground">{'>'}</span>
        <span className="text-foreground">{'('}</span>
        <span className="text-orange-300">value</span>
        <span className="text-foreground">{')'}</span>
        {'\n\n'}
        <span className="text-foreground">{'  '}</span>
        <span className="text-yellow-400">useEffect</span>
        <span className="text-foreground">{'(() => {'}</span>
        {'\n'}
        <span className="text-foreground">{'    '}</span>
        <span className="text-blue-400">const</span>
        <span className="text-foreground"> </span>
        <span className="text-orange-300">timer</span>
        <span className="text-foreground"> = </span>
        <span className="text-yellow-400">setTimeout</span>
        <span className="text-foreground">{'(() =>'}</span>
        {'\n'}
        <span className="text-foreground">{'      '}</span>
        <span className="text-yellow-400">setDebounced</span>
        <span className="text-foreground">{'('}</span>
        <span className="text-orange-300">value</span>
        <span className="text-foreground">{')'}</span>
        <span className="text-foreground">, </span>
        <span className="text-orange-300">delay</span>
        <span className="text-foreground">{')'}</span>
        {'\n'}
        <span className="text-foreground">{'    '}</span>
        <span className="text-blue-400">return</span>
        <span className="text-foreground"> {'() =>'} </span>
        <span className="text-yellow-400">clearTimeout</span>
        <span className="text-foreground">{'('}</span>
        <span className="text-orange-300">timer</span>
        <span className="text-foreground">{')'}</span>
        {'\n'}
        <span className="text-foreground">{'  '}</span>
        <span className="text-foreground">{'}, ['}</span>
        <span className="text-orange-300">value</span>
        <span className="text-foreground">, </span>
        <span className="text-orange-300">delay</span>
        <span className="text-foreground">{'])'}</span>
        {'\n\n'}
        <span className="text-foreground">{'  '}</span>
        <span className="text-blue-400">return</span>
        <span className="text-foreground"> </span>
        <span className="text-orange-300">debounced</span>
        {'\n'}
        <span className="text-foreground">{'}'}</span>
      </pre>
      {/* AI tags strip */}
      <div className="border-t border-border px-5 py-3 bg-muted/20 flex items-center gap-3 flex-wrap">
        <span className="text-xs text-amber-400">✨ AI Generated Tags</span>
        {['react', 'hooks', 'typescript', 'debounce', 'performance'].map(tag => (
          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
