export type ContentType = "TEXT" | "FILE" | "URL";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isPro: boolean;
}

export interface MockItemType {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
}

export interface MockItem {
  id: string;
  title: string;
  description: string | null;
  language: string | null;
  contentType: ContentType;
  content: string | null;
  url: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: string;
  lastUsedAt: string | null;
  itemTypeId: string;
  tags: string[];
  collectionIds: string[];
}

export interface MockCollection {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  defaultTypeId: string | null;
  itemCount: number;
  createdAt: string;
}

export const mockUser: MockUser = {
  id: "user_1",
  name: "John Doe",
  email: "john@example.com",
  image: null,
  isPro: false,
};

export const mockItemTypes: MockItemType[] = [
  { id: "type_snippet",  name: "snippet", icon: "Code",       color: "#3b82f6", isSystem: true },
  { id: "type_prompt",   name: "prompt",  icon: "Sparkles",   color: "#8b5cf6", isSystem: true },
  { id: "type_command",  name: "command", icon: "Terminal",   color: "#f97316", isSystem: true },
  { id: "type_note",     name: "note",    icon: "StickyNote", color: "#fde047", isSystem: true },
  { id: "type_file",     name: "file",    icon: "File",       color: "#6b7280", isSystem: true },
  { id: "type_image",    name: "image",   icon: "Image",      color: "#ec4899", isSystem: true },
  { id: "type_link",     name: "link",    icon: "Link",       color: "#10b981", isSystem: true },
];

export const mockCollections: MockCollection[] = [
  { id: "col_1", name: "React Patterns",   description: "Common React patterns and hooks",       isFavorite: true,  defaultTypeId: "type_snippet", itemCount: 12, createdAt: "2026-01-01" },
  { id: "col_2", name: "Python Snippets",  description: "Useful Python code snippets",           isFavorite: false, defaultTypeId: "type_snippet", itemCount: 8,  createdAt: "2026-01-05" },
  { id: "col_3", name: "Context Files",    description: "AI context files for projects",         isFavorite: true,  defaultTypeId: "type_file",    itemCount: 5,  createdAt: "2026-01-08" },
  { id: "col_4", name: "Interview Prep",   description: "Technical interview preparation",       isFavorite: false, defaultTypeId: "type_note",    itemCount: 24, createdAt: "2026-01-10" },
  { id: "col_5", name: "Git Commands",     description: "Frequently used git commands",          isFavorite: true,  defaultTypeId: "type_command", itemCount: 15, createdAt: "2026-01-12" },
  { id: "col_6", name: "AI Prompts",       description: "Curated AI prompts for coding",         isFavorite: false, defaultTypeId: "type_prompt",  itemCount: 18, createdAt: "2026-01-14" },
];

export const mockItems: MockItem[] = [
  {
    id: "item_1",
    title: "useAuth Hook",
    description: "Custom authentication hook for React applications",
    language: "typescript",
    contentType: "TEXT",
    content: "export function useAuth() {\n  const session = useSession();\n  return { user: session?.user, isLoading: !session };\n}",
    url: null,
    isFavorite: false,
    isPinned: true,
    createdAt: "2026-01-15",
    lastUsedAt: "2026-01-15",
    itemTypeId: "type_snippet",
    tags: ["react", "auth", "hooks"],
    collectionIds: ["col_1"],
  },
  {
    id: "item_2",
    title: "API Error Handling Pattern",
    description: "Fetch wrapper with exponential backoff retry logic",
    language: "typescript",
    contentType: "TEXT",
    content: "async function fetchWithRetry(url: string, retries = 3) {\n  for (let i = 0; i < retries; i++) {\n    try { return await fetch(url); }\n    catch (e) { if (i === retries - 1) throw e; }\n  }\n}",
    url: null,
    isFavorite: false,
    isPinned: true,
    createdAt: "2026-01-12",
    lastUsedAt: "2026-01-12",
    itemTypeId: "type_snippet",
    tags: ["api", "error-handling"],
    collectionIds: ["col_1"],
  },
  {
    id: "item_3",
    title: "Git Undo Last Commit",
    description: "Keep changes staged after undoing commit",
    language: null,
    contentType: "TEXT",
    content: "git reset --soft HEAD~1",
    url: null,
    isFavorite: true,
    isPinned: false,
    createdAt: "2026-01-10",
    lastUsedAt: "2026-01-14",
    itemTypeId: "type_command",
    tags: ["git"],
    collectionIds: ["col_5"],
  },
  {
    id: "item_4",
    title: "System Prompt — Code Review",
    description: "System message for AI-assisted code reviews",
    language: null,
    contentType: "TEXT",
    content: "You are a senior engineer. Review the following code for correctness, performance, and security. Be concise and direct.",
    url: null,
    isFavorite: true,
    isPinned: false,
    createdAt: "2026-01-09",
    lastUsedAt: "2026-01-13",
    itemTypeId: "type_prompt",
    tags: ["code-review", "ai"],
    collectionIds: ["col_6"],
  },
  {
    id: "item_5",
    title: "Python List Comprehension Cheatsheet",
    description: "Common list comprehension patterns",
    language: "python",
    contentType: "TEXT",
    content: "# Filter\n[x for x in items if x > 0]\n# Transform\n[x * 2 for x in items]\n# Nested\n[x for row in matrix for x in row]",
    url: null,
    isFavorite: false,
    isPinned: false,
    createdAt: "2026-01-07",
    lastUsedAt: null,
    itemTypeId: "type_snippet",
    tags: ["python", "cheatsheet"],
    collectionIds: ["col_2"],
  },
  {
    id: "item_6",
    title: "Next.js App Router Notes",
    description: "Key differences in the Next.js App Router",
    language: null,
    contentType: "TEXT",
    content: "- Server components by default\n- use client for interactivity\n- layouts wrap nested routes\n- loading.tsx for Suspense boundaries",
    url: null,
    isFavorite: false,
    isPinned: false,
    createdAt: "2026-01-06",
    lastUsedAt: "2026-01-11",
    itemTypeId: "type_note",
    tags: ["nextjs", "react"],
    collectionIds: ["col_1", "col_4"],
  },
  {
    id: "item_7",
    title: "Tailwind CSS Docs",
    description: "Official Tailwind CSS v4 documentation",
    language: null,
    contentType: "URL",
    content: null,
    url: "https://tailwindcss.com/docs",
    isFavorite: false,
    isPinned: false,
    createdAt: "2026-01-03",
    lastUsedAt: null,
    itemTypeId: "type_link",
    tags: ["tailwind", "css", "docs"],
    collectionIds: [],
  },
  {
    id: "item_8",
    title: "Docker Compose Up",
    description: "Start all services in detached mode",
    language: null,
    contentType: "TEXT",
    content: "docker compose up -d --build",
    url: null,
    isFavorite: false,
    isPinned: false,
    createdAt: "2026-01-02",
    lastUsedAt: "2026-01-08",
    itemTypeId: "type_command",
    tags: ["docker", "devops"],
    collectionIds: [],
  },
];
