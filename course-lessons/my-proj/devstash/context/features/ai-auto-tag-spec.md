# AI Auto-Tagging

## Overview

Add AI-powered tag suggestions for items using the Google GenAI "gemini-2.5-flash-lite" model. Users click a "Suggest Tags" button in the tags area, and the AI returns 3-5 freeform tag suggestions based on the item's title and content. Each suggestion has accept/reject controls. Pro-only feature with both UI-level and server-side gating. If this is the first AI feature implemented, it also establishes the OpenAI foundation (client, server action, rate limit config) for subsequent AI features.

## Requirements

- Create Google GenAI client utility with `AI_MODEL` constant (if not already created by a prior AI feature)
- Use the standard Google GenAI SDK and keep it simple
- Create `generateAutoTags` server action with auth, Pro gating, Zod validation, rate limiting
- Add AI rate limit config (5 requests/minute per user) to existing rate limit utility (if not already added)
- Add "Suggest Tags" button (Sparkles icon, ghost variant) near the tags input in create item dialog and item drawer edit mode
- Display suggested tags as badges with accept (check) and reject (X) controls per tag
- Accepted tags get added to the item's tag list
- Tags are freeform (not limited to existing tags in the database)
- Truncate content to 2000 chars before API call
- Hide the Suggest Tags button for free users (Pro-only UI gating)
- Error handling via toast (Pro gating, rate limit, AI service errors)
- Follow existing patterns
- Unit tests for server action

## Example call:

```
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: "Explain how AI works in a few words",
  });

  console.log("=== Gemini API Test ===");
  console.log("Response:", response.text);
  console.log("Full response object:", JSON.stringify(response, null, 2));
}

main().catch(console.error);
```

## Example response:

```
=== Gemini API Test ===
Response: AI learns from data to make predictions or decisions.
Full response object: {
  "sdkHttpResponse": {
    "headers": {
      "alt-svc": "h3=\":443\"; ma=2592000,h3-29=\":443\"; ma=2592000",
      "content-encoding": "gzip",
      "content-type": "application/json; charset=UTF-8",
      "date": "Tue, 09 Jun 2026 09:06:46 GMT",
      "server": "scaffolding on HTTPServer2",
      "server-timing": "gfet4t7; dur=515",
      "transfer-encoding": "chunked",
      "vary": "Origin, X-Origin, Referer",
      "x-content-type-options": "nosniff",
      "x-frame-options": "SAMEORIGIN",
      "x-gemini-service-tier": "standard",
      "x-xss-protection": "0"
    }
  },
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "AI learns from data to make predictions or decisions."
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP",
      "index": 0
    }
  ],
  "modelVersion": "gemini-2.5-flash-lite",
  "responseId": "pdcnat7ALrvxnsEP1_XfgQs",
  "usageMetadata": {
    "promptTokenCount": 9,
    "candidatesTokenCount": 10,
    "totalTokenCount": 19,
    "promptTokensDetails": [
      {
        "modality": "TEXT",
        "tokenCount": 9
      }
    ],
    "serviceTier": "standard"
  }
}
```

## Notes

- `GEMINI_API_KEY` already in `.env`
- `isPro` is available server-side via session but not passed to create/edit UI components — use server-side gating for enforcement, UI gating for button visibility requires passing `isPro` as a prop or fetching it client-side
- See `docs/ai-integration-plan.md` for full architectural context
