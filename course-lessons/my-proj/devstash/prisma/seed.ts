import 'dotenv/config'
import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient, ContentType } from '../src/generated/prisma/client'
import ws from 'ws'
import bcrypt from 'bcryptjs'

neonConfig.webSocketConstructor = ws

interface ItemData {
  title: string
  description?: string
  language?: string
  itemTypeId: string
  content?: string
  url?: string
  contentType?: ContentType
  isFavorite?: boolean
  isPinned?: boolean
}

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter })

  console.log('Seeding database...')

  await prisma.itemCollection.deleteMany()
  await prisma.item.deleteMany()
  await prisma.collection.deleteMany()
  await prisma.itemType.deleteMany()
  await prisma.user.deleteMany()

  // ─── User ─────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('12345678', 12)
  const user = await prisma.user.create({
    data: {
      email: 'demo@devstash.io',
      name: 'Demo User',
      password: passwordHash,
      isPro: false,
      emailVerified: new Date(),
    },
  })

  function createItem(data: ItemData) {
    return prisma.item.create({
      data: {
        ...data,
        userId: user.id,
        contentType: data.contentType ?? ContentType.TEXT,
      },
    })
  }

  // ─── System Item Types ────────────────────────────────────────────────────
  const [snippet, prompt, command, , , , link] = await Promise.all([
    prisma.itemType.create({ data: { name: 'snippet', icon: 'Code',       color: '#3b82f6', isSystem: true } }),
    prisma.itemType.create({ data: { name: 'prompt',  icon: 'Sparkles',   color: '#8b5cf6', isSystem: true } }),
    prisma.itemType.create({ data: { name: 'command', icon: 'Terminal',   color: '#f97316', isSystem: true } }),
    prisma.itemType.create({ data: { name: 'note',    icon: 'StickyNote', color: '#fde047', isSystem: true } }),
    prisma.itemType.create({ data: { name: 'file',    icon: 'File',       color: '#6b7280', isSystem: true } }),
    prisma.itemType.create({ data: { name: 'image',   icon: 'Image',      color: '#ec4899', isSystem: true } }),
    prisma.itemType.create({ data: { name: 'link',    icon: 'Link',       color: '#10b981', isSystem: true } }),
  ])

  // ─── React Patterns ───────────────────────────────────────────────────────
  const reactPatterns = await prisma.collection.create({
    data: {
      name: 'React Patterns',
      description: 'Reusable React patterns and hooks',
      userId: user.id,
      defaultTypeId: snippet.id,
    },
  })

  const useDebounceContent = [
    "import { useState, useEffect } from 'react'",
    '',
    'export function useDebounce<T>(value: T, delay: number): T {',
    '  const [debouncedValue, setDebouncedValue] = useState<T>(value)',
    '  useEffect(() => {',
    '    const timer = setTimeout(() => setDebouncedValue(value), delay)',
    '    return () => clearTimeout(timer)',
    '  }, [value, delay])',
    '  return debouncedValue',
    '}',
    '',
    'export function useLocalStorage<T>(key: string, initialValue: T) {',
    '  const [storedValue, setStoredValue] = useState<T>(() => {',
    "    if (typeof window === 'undefined') return initialValue",
    '    try {',
    '      const item = window.localStorage.getItem(key)',
    '      return item ? (JSON.parse(item) as T) : initialValue',
    '    } catch {',
    '      return initialValue',
    '    }',
    '  })',
    '',
    '  const setValue = (value: T | ((val: T) => T)) => {',
    '    try {',
    '      const valueToStore = value instanceof Function ? value(storedValue) : value',
    '      setStoredValue(valueToStore)',
    "      if (typeof window !== 'undefined') {",
    '        window.localStorage.setItem(key, JSON.stringify(valueToStore))',
    '      }',
    '    } catch (error) {',
    '      console.error(error)',
    '    }',
    '  }',
    '',
    '  return [storedValue, setValue] as const',
    '}',
  ].join('\n')

  const contextProviderContent = [
    "import { createContext, useContext, useState, ReactNode } from 'react'",
    '',
    'interface AccordionContextValue {',
    '  openItem: string | null',
    '  toggle: (id: string) => void',
    '}',
    '',
    'const AccordionContext = createContext<AccordionContextValue | null>(null)',
    '',
    'function useAccordion() {',
    '  const ctx = useContext(AccordionContext)',
    "  if (!ctx) throw new Error('useAccordion must be used within Accordion')",
    '  return ctx',
    '}',
    '',
    'export function Accordion({ children }: { children: ReactNode }) {',
    '  const [openItem, setOpenItem] = useState<string | null>(null)',
    '  const toggle = (id: string) => setOpenItem(prev => (prev === id ? null : id))',
    '  return (',
    '    <AccordionContext.Provider value={{ openItem, toggle }}>',
    '      <div className="divide-y">{children}</div>',
    '    </AccordionContext.Provider>',
    '  )',
    '}',
    '',
    'Accordion.Item = function AccordionItem({',
    '  id, title, children,',
    '}: {',
    '  id: string; title: string; children: ReactNode',
    '}) {',
    '  const { openItem, toggle } = useAccordion()',
    '  return (',
    '    <div>',
    '      <button onClick={() => toggle(id)} className="w-full text-left py-3 font-medium">',
    '        {title}',
    '      </button>',
    '      {openItem === id && <div className="pb-3">{children}</div>}',
    '    </div>',
    '  )',
    '}',
  ].join('\n')

  const utilsContent = [
    "import { clsx, type ClassValue } from 'clsx'",
    "import { twMerge } from 'tailwind-merge'",
    '',
    'export function cn(...inputs: ClassValue[]) {',
    '  return twMerge(clsx(inputs))',
    '}',
    '',
    'export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {',
    "  return new Intl.DateTimeFormat('en-GB', {",
    "    day: 'numeric', month: 'short', year: 'numeric', ...opts,",
    '  }).format(new Date(date))',
    '}',
    '',
    'export function truncate(str: string, length: number): string {',
    "  return str.length > length ? str.slice(0, length) + '...' : str",
    '}',
    '',
    'export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {',
    '  return array.reduce((groups, item) => {',
    '    const group = String(item[key])',
    '    return { ...groups, [group]: [...(groups[group] ?? []), item] }',
    '  }, {} as Record<string, T[]>)',
    '}',
  ].join('\n')

  const reactItems = await Promise.all([
    createItem({
      title: 'Custom Hooks: useDebounce & useLocalStorage',
      description: 'Production-ready custom hooks for debouncing values and persisting state',
      language: 'typescript',
      itemTypeId: snippet.id,
      content: useDebounceContent,
    }),
    createItem({
      title: 'Context Provider + Compound Components',
      description: 'Pattern for building flexible compound components using React Context',
      language: 'typescript',
      itemTypeId: snippet.id,
      content: contextProviderContent,
    }),
    createItem({
      title: 'TypeScript Utility Functions',
      description: 'Common utilities: cn, formatDate, truncate, groupBy',
      language: 'typescript',
      itemTypeId: snippet.id,
      content: utilsContent,
    }),
  ])

  await prisma.itemCollection.createMany({
    data: reactItems.map(i => ({ itemId: i.id, collectionId: reactPatterns.id })),
  })

  // ─── AI Workflows ─────────────────────────────────────────────────────────
  const aiWorkflows = await prisma.collection.create({
    data: {
      name: 'AI Workflows',
      description: 'AI prompts and workflow automations',
      userId: user.id,
      defaultTypeId: prompt.id,
    },
  })

  const aiItems = await Promise.all([
    createItem({
      title: 'Code Review Prompt',
      description: 'Structured prompt for thorough AI-assisted code reviews',
      itemTypeId: prompt.id,
      content: [
        'You are an expert software engineer performing a thorough code review.',
        '',
        'Review the following code for:',
        '1. **Correctness** — logic errors, edge cases, off-by-one errors',
        '2. **Security** — injection risks, auth issues, exposed secrets',
        '3. **Performance** — unnecessary re-renders, N+1 queries, memory leaks',
        '4. **Readability** — naming, structure, comments where needed',
        '5. **Best practices** — patterns, conventions, SOLID principles',
        '',
        'For each issue found:',
        '- State the problem clearly',
        '- Explain why it matters',
        '- Suggest a concrete fix with example code',
        '',
        'Code to review:',
        '```',
        '[PASTE CODE HERE]',
        '```',
      ].join('\n'),
    }),
    createItem({
      title: 'Documentation Generation',
      description: 'Generate clear, accurate docs from source code',
      itemTypeId: prompt.id,
      content: [
        'Generate comprehensive documentation for the following code.',
        '',
        'Include:',
        '- **Overview** — what it does in 1-2 sentences',
        '- **Parameters / Props** — name, type, description, whether required, default value',
        '- **Return value** — type and description',
        '- **Usage examples** — at least 2 realistic examples',
        '- **Edge cases** — any gotchas or non-obvious behaviour',
        '',
        'Format as Markdown. Keep descriptions concise and accurate.',
        'Do not invent behaviour that is not in the code.',
        '',
        'Code:',
        '```',
        '[PASTE CODE HERE]',
        '```',
      ].join('\n'),
    }),
    createItem({
      title: 'Refactoring Assistance',
      description: 'Improve code quality without changing external behaviour',
      itemTypeId: prompt.id,
      content: [
        'Refactor the following code to improve quality. Do NOT change external behaviour.',
        '',
        'Goals (in priority order):',
        '1. Remove duplication — apply DRY where it genuinely helps',
        '2. Improve naming — variables, functions, and types should be self-documenting',
        '3. Simplify logic — eliminate unnecessary complexity',
        '4. Strengthen types — remove any, add precise TypeScript types',
        '5. Split concerns — break large functions into focused helpers',
        '',
        'Rules:',
        '- Keep the public API identical',
        '- Do not add new features',
        '- Explain each significant change and why it is an improvement',
        '',
        'Code to refactor:',
        '```',
        '[PASTE CODE HERE]',
        '```',
      ].join('\n'),
    }),
  ])

  await prisma.itemCollection.createMany({
    data: aiItems.map(i => ({ itemId: i.id, collectionId: aiWorkflows.id })),
  })

  // ─── DevOps ───────────────────────────────────────────────────────────────
  const devops = await prisma.collection.create({
    data: {
      name: 'DevOps',
      description: 'Infrastructure and deployment resources',
      userId: user.id,
      defaultTypeId: snippet.id,
    },
  })

  const dockerfileContent = [
    '# Stage 1: install production deps',
    'FROM node:20-alpine AS deps',
    'WORKDIR /app',
    'COPY package*.json ./',
    'RUN npm ci --only=production',
    '',
    '# Stage 2: build',
    'FROM node:20-alpine AS builder',
    'WORKDIR /app',
    'COPY package*.json ./',
    'RUN npm ci',
    'COPY . .',
    'RUN npm run build',
    '',
    '# Stage 3: runtime',
    'FROM node:20-alpine AS runner',
    'WORKDIR /app',
    'ENV NODE_ENV=production',
    'RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs',
    'COPY --from=deps    /app/node_modules ./node_modules',
    'COPY --from=builder /app/.next        ./.next',
    'COPY --from=builder /app/public       ./public',
    'COPY --from=builder /app/package.json ./package.json',
    'USER nextjs',
    'EXPOSE 3000',
    'CMD ["npm", "start"]',
  ].join('\n')

  const devopsItems = await Promise.all([
    createItem({
      title: 'Multi-stage Dockerfile (Node.js)',
      description: 'Production-optimised multi-stage Docker build for Next.js apps',
      language: 'dockerfile',
      itemTypeId: snippet.id,
      content: dockerfileContent,
    }),
    createItem({
      title: 'Docker Compose Deploy',
      description: 'Pull latest image and restart services, then prune old images',
      itemTypeId: command.id,
      content: 'docker compose pull && docker compose up -d --remove-orphans && docker image prune -f',
    }),
    createItem({
      title: 'Docker Documentation',
      description: 'Official Docker documentation',
      itemTypeId: link.id,
      contentType: ContentType.URL,
      url: 'https://docs.docker.com',
    }),
    createItem({
      title: 'GitHub Actions Docs',
      description: 'Official GitHub Actions documentation for CI/CD workflows',
      itemTypeId: link.id,
      contentType: ContentType.URL,
      url: 'https://docs.github.com/en/actions',
    }),
  ])

  await prisma.itemCollection.createMany({
    data: devopsItems.map(i => ({ itemId: i.id, collectionId: devops.id })),
  })

  // ─── Terminal Commands ────────────────────────────────────────────────────
  const terminalCommands = await prisma.collection.create({
    data: {
      name: 'Terminal Commands',
      description: 'Useful shell commands for everyday development',
      userId: user.id,
      defaultTypeId: command.id,
    },
  })

  const terminalItems = await Promise.all([
    createItem({
      title: 'Git: Undo last commit (keep changes staged)',
      description: 'Soft-reset HEAD by one commit — your changes stay in the index',
      itemTypeId: command.id,
      content: 'git reset --soft HEAD~1',
    }),
    createItem({
      title: 'Docker: Prune stopped containers and dangling images',
      description: 'Free up disk space by removing stopped containers and untagged images',
      itemTypeId: command.id,
      content: 'docker container prune -f && docker image prune -f',
    }),
    createItem({
      title: 'Kill process on a port (macOS / Linux)',
      description: 'Find and kill whatever process is listening on a given port',
      itemTypeId: command.id,
      content: 'lsof -ti:<PORT> | xargs kill -9',
    }),
    createItem({
      title: 'Run npm package without installing globally',
      description: 'Execute any CLI tool from npm on demand using npx',
      itemTypeId: command.id,
      content: 'npx <package-name>@latest [args]',
    }),
  ])

  await prisma.itemCollection.createMany({
    data: terminalItems.map(i => ({ itemId: i.id, collectionId: terminalCommands.id })),
  })

  // ─── Design Resources ─────────────────────────────────────────────────────
  const designResources = await prisma.collection.create({
    data: {
      name: 'Design Resources',
      description: 'UI/UX resources and references',
      userId: user.id,
      defaultTypeId: link.id,
    },
  })

  const designItems = await Promise.all([
    createItem({
      title: 'Tailwind CSS Docs',
      description: 'Official Tailwind CSS documentation and utility class reference',
      itemTypeId: link.id,
      contentType: ContentType.URL,
      url: 'https://tailwindcss.com/docs',
      isFavorite: true,
    }),
    createItem({
      title: 'shadcn/ui',
      description: 'Accessible, composable components built on Radix UI and Tailwind CSS',
      itemTypeId: link.id,
      contentType: ContentType.URL,
      url: 'https://ui.shadcn.com',
      isFavorite: true,
    }),
    createItem({
      title: 'Radix UI Primitives',
      description: 'Unstyled, accessible UI component primitives for React',
      itemTypeId: link.id,
      contentType: ContentType.URL,
      url: 'https://www.radix-ui.com',
    }),
    createItem({
      title: 'Lucide Icons',
      description: 'Open-source icon library — used for item type icons in this project',
      itemTypeId: link.id,
      contentType: ContentType.URL,
      url: 'https://lucide.dev',
    }),
  ])

  await prisma.itemCollection.createMany({
    data: designItems.map(i => ({ itemId: i.id, collectionId: designResources.id })),
  })

  const totalItems =
    reactItems.length + aiItems.length + devopsItems.length + terminalItems.length + designItems.length

  console.log('Done.')
  console.log(`  1 user            demo@devstash.io`)
  console.log(`  7 item types      snippet, prompt, command, note, file, image, link`)
  console.log(`  5 collections     React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources`)
  console.log(`  ${totalItems} items`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
