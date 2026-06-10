import { GoogleGenAI } from '@google/genai'
import { singleton } from '@/lib/singleton'

export const gemini = singleton('gemini', () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! }))

export const AI_MODEL = 'gemini-2.5-flash-lite'
