import { handlers } from "@/auth"
import { NextRequest } from "next/server"

function withBasePath(req: NextRequest) {
  const url = new URL(req.url)
  url.pathname = '/devstash' + url.pathname
  return new NextRequest(url, req)
}

export function GET(req: NextRequest) { return handlers.GET(withBasePath(req)) }
export function POST(req: NextRequest) { return handlers.POST(withBasePath(req)) }
