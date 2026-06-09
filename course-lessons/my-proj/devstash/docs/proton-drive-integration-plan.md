# Cloud Storage Integration Plan: Free Tiers Without Payment Card

## Executive Summary

This document researches cloud storage options suitable for a Next.js application where **no payment card can be entered** due to company restrictions. Each provider has been evaluated on this criterion first; those requiring a card are documented and excluded from the primary recommendations.

### Payment Card Requirement Verdict

| Provider | Payment Card Required? | Qualifies? |
|---|---|---|
| **Proton Drive** | No (free account) | Partial — SDK not yet third-party ready |
| **Supabase Storage** | No | **Yes** |
| **Backblaze B2** | No (private buckets only) | **Yes** (with caveats) |
| **Tebi.io** | No (free-forever plan) | **Yes** |
| **GitHub (Contents API)** | No (free account) | **Yes** (limited use case) |
| **Cloudflare R2** | **Yes — required** | No |
| **Storj DCS** | Yes (min $50/month from July 2026) | No |
| **Wasabi** | Yes (minimum charge applies) | No |

### Primary Recommendation

**Supabase Storage** is the best fit for a Next.js app. It has no payment card requirement, provides a 1 GB free tier, has a first-class JavaScript SDK, integrates directly with Next.js patterns, and supports Row Level Security for access control.

**Tebi.io** is the best secondary option if more storage (25 GB) or S3-compatible tooling is preferred. No payment card is needed for the free-forever tier.

**Backblaze B2** qualifies but with a nuance: no card is required for private buckets (10 GB free), though public buckets require card verification.

**Proton Drive** has an official SDK in active development but is **not ready for third-party production use** as of mid-2026. It can be explored for personal/non-commercial projects only, and significant limitations apply.

---

## Provider Deep Dives

---

## 1. Supabase Storage

### Overview

Supabase is an open-source Firebase alternative built on PostgreSQL. Its Storage product is a managed file storage service that integrates with the same authentication and database the rest of the platform uses. Files are stored in "buckets" — distinct containers with independent access policies.

Supabase has a first-class JavaScript client (`@supabase/supabase-js`) and specific SSR utilities for Next.js (`@supabase/ssr`), making it the smoothest integration path of all options evaluated.

### Payment Card & Free Tier

- **Payment card required:** No — account creation requires only an email address
- **Free tier storage:** 1 GB file storage
- **Database storage:** 500 MB
- **Bandwidth:** 5 GB outbound
- **Active projects:** 2 simultaneously
- **Project inactivity:** Projects auto-pause after 7 consecutive days of inactivity — they must be manually unpaused from the dashboard
- **Commercial use:** Permitted on the free tier

### Setup & Credentials

1. Sign up at [supabase.com](https://supabase.com) — no card required
2. Create a new project (choose a region, set a database password)
3. Navigate to **Project Settings > API Keys**
4. Copy the **Project URL** (e.g. `https://your-project-ref.supabase.co`) and the **Publishable key** (`sb_publishable_...`) — safe to expose in client-side code
5. For server-side operations, also copy the **Secret key** (`sb_secret_...`) — keep this secret, never expose client-side

> **Note:** Supabase renamed their keys in 2025. The old `anon` key is now the **Publishable key** and the old `service_role` key is now the **Secret key**. The legacy keys still work but are deprecated — use the new ones for new projects.

#### Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

#### Create a Storage Bucket

Via the Supabase dashboard: Storage > New Bucket. Or programmatically:

```ts
const { data, error } = await supabase.storage.createBucket('my-files', {
  public: false,            // private bucket
  fileSizeLimit: 10485760,  // 10 MB limit per file
  allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf']
})
```

Set RLS (Row Level Security) policies to control who can upload/download. Example SQL to allow authenticated users:

```sql
-- Allow authenticated users to upload to 'my-files' bucket
CREATE POLICY "Authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'my-files' AND auth.role() = 'authenticated');

-- Allow authenticated users to read from 'my-files' bucket  
CREATE POLICY "Authenticated reads" ON storage.objects
FOR SELECT USING (bucket_id = 'my-files' AND auth.role() = 'authenticated');
```

### Integration Approach

Install the Supabase client:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Create a browser client helper (`lib/supabase/client.ts`):

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

Create a server client helper (`lib/supabase/server.ts`):

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}
```

### Upload Example (Next.js API Route)

The recommended approach for large files is to generate a signed upload URL on the server and have the client upload directly to Supabase — this bypasses Next.js's 1 MB server action body limit.

**Server: generate signed upload URL (`app/api/storage/upload-url/route.ts`)**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const { fileName, contentType } = await request.json()

  // Use secret key for server-side operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )

  const filePath = `uploads/${Date.now()}-${fileName}`

  const { data, error } = await supabase.storage
    .from('my-files')
    .createSignedUploadUrl(filePath, { upsert: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ signedUrl: data.signedUrl, path: data.path, token: data.token })
}
```

**Client: upload using the signed URL**

```ts
import { createClient } from '@/lib/supabase/client'

async function uploadFile(file: File) {
  // 1. Get a signed upload URL from your API route
  const res = await fetch('/api/storage/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, contentType: file.type })
  })
  const { signedUrl, path, token } = await res.json()

  // 2. Upload directly to Supabase using the signed URL
  const supabase = createClient()
  const { error } = await supabase.storage
    .from('my-files')
    .uploadToSignedUrl(path, token, file, {
      contentType: file.type,
    })

  if (error) throw new Error(error.message)
  return path  // store this path to reference the file later
}
```

**Simple direct upload (for files under 1 MB or server-side use)**

```ts
const { data, error } = await supabase.storage
  .from('my-files')
  .upload('public/document.pdf', fileBuffer, {
    contentType: 'application/pdf',
    upsert: false
  })
```

### Read / Download Example

**Get a public URL (for public buckets)**

```ts
const { data } = supabase.storage
  .from('my-files')
  .getPublicUrl('public/document.pdf')

console.log(data.publicUrl)
// https://your-project-ref.supabase.co/storage/v1/object/public/my-files/public/document.pdf
```

**Generate a signed download URL (for private buckets, expires after N seconds)**

```ts
const { data, error } = await supabase.storage
  .from('my-files')
  .createSignedUrl('uploads/my-document.pdf', 3600) // 1 hour expiry

if (!error) {
  console.log(data.signedUrl)  // temporary download URL
}
```

**Download file content directly (server-side)**

```ts
const { data, error } = await supabase.storage
  .from('my-files')
  .download('uploads/my-document.pdf')

if (!error && data) {
  // data is a Blob
  const buffer = Buffer.from(await data.arrayBuffer())
  // write to disk or process as needed
}
```

### Free Tier Limits

| Limit | Value |
|---|---|
| File storage | 1 GB |
| Database storage | 500 MB |
| Outbound bandwidth | 5 GB/month |
| Active projects | 2 |
| Inactivity pause | After 7 days |
| Max file size | Configurable per bucket |

### Pros & Cons

**Pros**
- No payment card ever required
- First-class Next.js integration with `@supabase/ssr`
- Row Level Security for fine-grained access control
- Supports public and private buckets
- Resumable uploads via TUS protocol for large files
- Integrates with Supabase Auth — no separate auth system needed
- Image transformations available (resize, crop) via storage API
- CLI for local development (`supabase start`)

**Cons**
- Projects pause after 7 days of inactivity on free tier (requires manual unpause)
- Only 1 GB storage on free tier
- 2-project limit on free tier
- Supabase platform dependency — self-hosting is an option but adds complexity

---

## 2. Tebi.io

### Overview

Tebi is a geo-distributed, S3-compatible object storage service with a genuinely free-forever plan. It uses a global storage architecture (no regional separation — single endpoint `s3.tebi.io`) and replicates data across multiple locations. Because it implements the S3 protocol, it works with any S3-compatible library including the AWS SDK v3.

### Payment Card & Free Tier

- **Payment card required:** No — free-forever plan with no card needed
- **Free tier storage:** 25 GB/month
- **Free tier traffic:** 250 GB outbound/month
- **Plan type:** Pay-as-you-go beyond free limits; no fixed monthly fee

### Setup & Credentials

1. Sign up at [tebi.io](https://tebi.io) (email only, no card)
2. Log into the dashboard
3. Navigate to **Keys** or **Access Keys** to generate an Access Key ID and Secret Access Key
4. Create a bucket from the dashboard
5. Note the global endpoint: `https://s3.tebi.io`

**Key note:** Tebi has a single global endpoint. Unlike AWS S3 or Backblaze B2, there is no per-region endpoint — all buckets use `s3.tebi.io`.

**ACL note:** Tebi does not have a public/private bucket concept at the bucket level. Access control is set per-object via ACL. Files default to the bucket's default ACL, which can be set to public-read or private.

#### Environment Variables

```env
TEBI_ACCESS_KEY_ID=your-tebi-access-key-id
TEBI_SECRET_ACCESS_KEY=your-tebi-secret-access-key
TEBI_BUCKET_NAME=your-bucket-name
```

### Integration Approach

Tebi uses the AWS SDK v3 with a custom endpoint. No Tebi-specific package is needed.

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Client initialisation (`lib/storage/tebi.ts`)**

```ts
import { S3Client } from '@aws-sdk/client-s3'

export const tebiClient = new S3Client({
  endpoint: 'https://s3.tebi.io',
  region: 'global',
  credentials: {
    accessKeyId: process.env.TEBI_ACCESS_KEY_ID!,
    secretAccessKey: process.env.TEBI_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: false,  // Tebi uses virtual-hosted-style URLs
})
```

### Upload Example

```ts
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { tebiClient } from '@/lib/storage/tebi'
import { readFile } from 'fs/promises'

// Upload a buffer or string
export async function uploadToTebi(
  bucketName: string,
  key: string,
  body: Buffer | string,
  contentType: string
) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: body,
    ContentType: contentType,
    // ACL: 'public-read',  // uncomment to make the file publicly accessible
  })

  const response = await tebiClient.send(command)
  return response
}

// Usage in a Next.js API route (app/api/upload/route.ts)
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const key = `uploads/${Date.now()}-${file.name}`

  await uploadToTebi(
    process.env.TEBI_BUCKET_NAME!,
    key,
    buffer,
    file.type
  )

  return NextResponse.json({ path: key })
}
```

### Read / Download Example

**Generate a presigned download URL (private objects)**

```ts
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { tebiClient } from '@/lib/storage/tebi'

export async function getTebiDownloadUrl(
  bucketName: string,
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  return getSignedUrl(tebiClient, command, { expiresIn: expiresInSeconds })
}
```

**Download file content directly (server-side)**

```ts
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { tebiClient } from '@/lib/storage/tebi'
import { Readable } from 'stream'

export async function downloadFromTebi(bucketName: string, key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  const response = await tebiClient.send(command)
  const stream = response.Body as Readable

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}
```

**Public URL (if object was uploaded with `ACL: 'public-read'`)**

```ts
// Public URL format for Tebi
const publicUrl = `https://s3.tebi.io/${bucketName}/${key}`
// Or using virtual-hosted style:
const virtualHostedUrl = `https://${bucketName}.s3.tebi.io/${key}`
```

### Free Tier Limits

| Limit | Value |
|---|---|
| Storage | 25 GB/month |
| Outbound traffic | 250 GB/month |
| Operations | Not explicitly limited in free tier |
| Payment card | Never required |

### Pros & Cons

**Pros**
- No payment card ever required — genuinely free-forever plan
- Largest free storage tier of all evaluated options (25 GB)
- S3-compatible — works with any S3 SDK or tool
- Single global endpoint — no region configuration needed
- FTP/FTPS support as alternative access method
- No minimum fee, no fixed monthly cost on free tier

**Cons**
- Less well-known than Backblaze or AWS — smaller community/ecosystem
- No native Next.js integration patterns (use AWS SDK v3)
- ACL model differs from standard S3 (per-object, not per-bucket)
- Corporate proxy at dorsetsoftware.com blocks direct access to tebi.io during development — VPN or proxy bypass may be needed
- Paid tiers start at $500/month (far above free — not suitable for small paid use)

---

## 3. Backblaze B2

### Overview

Backblaze B2 is a long-established, cost-effective S3-compatible object storage service. It offers 10 GB of free private storage with no credit card required. Its S3-Compatible API means it works with the AWS SDK v3 with minimal configuration changes — just swap the endpoint and credentials.

### Payment Card & Free Tier

- **Payment card required for private buckets:** No
- **Payment card required for public buckets:** Yes (card verification needed, though not charged on free tier)
- **Recommendation:** Use private buckets with presigned URLs — no card required
- **Free tier storage:** 10 GB
- **Free egress:** Up to 3× your stored data monthly; unlimited free egress through CDN/Compute partners (Cloudflare, Fastly)
- **Free API calls:** 2,500 Class B/C operations per day free

### Setup & Credentials

1. Sign up at [backblaze.com](https://www.backblaze.com/sign-up/cloud-storage) — no credit card required
2. Create a bucket: **B2 Cloud Storage > Buckets > Create a Bucket** — set to **Private**
3. Note your bucket's **Endpoint** from the bucket detail page (e.g., `s3.us-west-004.backblazeb2.com`)
4. Create an Application Key: **Account > Application Keys > Add a New Application Key**
   - Give it a name and select the bucket it applies to
   - Select Read and Write access
   - Copy the `keyID` and `applicationKey` immediately — the `applicationKey` is shown only once
5. Note: The **master application key does not work** with the S3 API — you must create a new app key

#### Environment Variables

```env
B2_APPLICATION_KEY_ID=your-b2-key-id
B2_APPLICATION_KEY=your-b2-application-key
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
B2_BUCKET_NAME=your-bucket-name
```

### Integration Approach

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Client initialisation (`lib/storage/b2.ts`)**

```ts
import { S3Client } from '@aws-sdk/client-s3'

export const b2Client = new S3Client({
  endpoint: process.env.B2_ENDPOINT!,
  region: process.env.B2_REGION!,
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
})
```

### Upload Example

```ts
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { b2Client } from '@/lib/storage/b2'

export async function uploadToB2(
  key: string,
  body: Buffer | string,
  contentType: string
): Promise<void> {
  await b2Client.send(new PutObjectCommand({
    Bucket: process.env.B2_BUCKET_NAME!,
    Key: key,
    Body: body,
    ContentType: contentType,
  }))
}

// Next.js API route usage (app/api/upload/route.ts)
import { NextRequest, NextResponse } from 'next/server'
import { uploadToB2 } from '@/lib/storage/b2'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const key = `uploads/${Date.now()}-${file.name}`

  await uploadToB2(key, buffer, file.type)

  return NextResponse.json({ key })
}
```

**Multipart upload for large files (> 5 GB requires multipart; recommended for > 100 MB)**

```ts
import { Upload } from '@aws-sdk/lib-storage'
import { b2Client } from '@/lib/storage/b2'
import fs from 'fs'

export async function multipartUploadToB2(key: string, filePath: string, contentType: string) {
  const upload = new Upload({
    client: b2Client,
    params: {
      Bucket: process.env.B2_BUCKET_NAME!,
      Key: key,
      Body: fs.createReadStream(filePath),
      ContentType: contentType,
    },
    queueSize: 4,       // concurrent parts
    partSize: 5_242_880, // 5 MB minimum part size
  })

  return upload.done()
}
```

### Read / Download Example

**Presigned download URL (recommended for private buckets)**

```ts
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { b2Client } from '@/lib/storage/b2'

export async function getB2DownloadUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.B2_BUCKET_NAME!,
    Key: key,
  })

  return getSignedUrl(b2Client, command, { expiresIn: expiresInSeconds })
}

// Usage in a Next.js API route
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })

  const url = await getB2DownloadUrl(key, 900) // 15-minute URL
  return NextResponse.redirect(url)
}
```

**Download file content to buffer (server-side)**

```ts
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { b2Client } from '@/lib/storage/b2'
import { Readable } from 'stream'

export async function downloadFromB2(key: string): Promise<Buffer> {
  const { Body } = await b2Client.send(new GetObjectCommand({
    Bucket: process.env.B2_BUCKET_NAME!,
    Key: key,
  }))

  const chunks: Buffer[] = []
  for await (const chunk of Body as Readable) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}
```

### Free Tier Limits

| Limit | Value |
|---|---|
| Storage | 10 GB |
| Egress | Free up to 3× stored data/month |
| Class A (upload/delete) operations | Unlimited, always free |
| Class B/C operations | 2,500/day free, then $0.004/10,000 |
| Max file size | 5 GB (single upload), unlimited via multipart |
| Payment card for private buckets | Never required |

### Pros & Cons

**Pros**
- No credit card required for private buckets (sufficient for most use cases)
- S3-compatible — industry-standard API, widely documented
- Free egress when paired with Cloudflare (Bandwidth Alliance)
- Established, reliable service (Backblaze has operated since 2007)
- Versioning by default — accidental deletes are recoverable
- Well-documented Node.js/AWS SDK v3 integration

**Cons**
- Public buckets require credit card verification (even if not charged)
- Smaller free tier (10 GB) vs. Tebi (25 GB)
- Must use an application key — master key does not work with S3 API
- Versioning on by default means deleted files persist — must explicitly delete versions to reclaim space
- Does not support SSE-KMS, IAM roles, Object Tagging, or Website configuration

---

## 4. GitHub (Contents API)

### Overview

GitHub can be used as a rudimentary file store via the GitHub Contents API. Files are committed to a repository and retrieved via the raw content URL or the API. This approach is free, requires no payment card, and has no storage fees — but it comes with significant constraints that make it unsuitable for most production storage scenarios.

**This approach is appropriate only for:** small static assets, configuration files, or data files where the file count is low and sizes are small (< 1 MB each). It is not appropriate for user-uploaded files, binary blobs, or high-traffic read scenarios.

### Payment Card & Free Tier

- **Payment card required:** No
- **Free tier:** Unlimited public repositories; private repos limited by GitHub plan
- **Rate limits:** 5,000 API requests/hour for authenticated users
- **File size limit:** 100 MB per file (files over 50 MB require Git LFS, which has storage costs)
- **Repository size limit:** Soft limit of 1 GB per repository; hard limit behaviour varies

### Setup & Credentials

1. Sign up at [github.com](https://github.com) — no card required
2. Create a repository (public or private)
3. Generate a **Personal Access Token (PAT)**: Settings > Developer Settings > Personal Access Tokens > Fine-grained tokens
4. Grant the token `Contents: Read and Write` permission on the target repository

#### Environment Variables

```env
GITHUB_TOKEN=your-personal-access-token
GITHUB_OWNER=your-github-username-or-org
GITHUB_REPO=your-repository-name
GITHUB_BRANCH=main
```

### Integration Approach

```bash
npm install @octokit/rest
```

**Client setup (`lib/storage/github.ts`)**

```ts
import { Octokit } from '@octokit/rest'

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})
```

### Upload Example

GitHub's API stores files as Base64-encoded content. Every upload is a commit.

```ts
import { octokit } from '@/lib/storage/github'

export async function uploadToGitHub(
  path: string,
  content: Buffer | string,
  commitMessage: string
): Promise<string> {
  const owner = process.env.GITHUB_OWNER!
  const repo = process.env.GITHUB_REPO!
  const branch = process.env.GITHUB_BRANCH || 'main'

  // Check if file already exists (required to get the sha for updates)
  let sha: string | undefined
  try {
    const existing = await octokit.rest.repos.getContent({ owner, repo, path, ref: branch })
    if (!Array.isArray(existing.data) && existing.data.type === 'file') {
      sha = existing.data.sha
    }
  } catch {
    // File doesn't exist yet — no sha needed for creation
  }

  const base64Content = Buffer.isBuffer(content)
    ? content.toString('base64')
    : Buffer.from(content).toString('base64')

  const response = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: commitMessage,
    content: base64Content,
    branch,
    ...(sha ? { sha } : {}),
  })

  // Return the raw download URL
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
}
```

### Read / Download Example

```ts
import { octokit } from '@/lib/storage/github'

// Download as Buffer
export async function downloadFromGitHub(path: string): Promise<Buffer> {
  const owner = process.env.GITHUB_OWNER!
  const repo = process.env.GITHUB_REPO!
  const branch = process.env.GITHUB_BRANCH || 'main'

  const response = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
    ref: branch,
    headers: { accept: 'application/vnd.github.raw+json' },
  })

  // When using the raw media type, response.data is a string
  if (typeof response.data === 'string') {
    return Buffer.from(response.data)
  }

  // Fallback: decode Base64 content
  if (!Array.isArray(response.data) && response.data.type === 'file') {
    const content = response.data.content.replace(/\n/g, '')
    return Buffer.from(content, 'base64')
  }

  throw new Error('Unexpected response format')
}

// For public repos: direct raw URL access (no API call needed)
export function getGitHubRawUrl(path: string): string {
  const owner = process.env.GITHUB_OWNER!
  const repo = process.env.GITHUB_REPO!
  const branch = process.env.GITHUB_BRANCH || 'main'
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
}
```

### Free Tier Limits

| Limit | Value |
|---|---|
| Storage per file | 100 MB (50 MB recommended max) |
| Repository size | ~1 GB soft limit |
| API rate limit | 5,000 requests/hour (authenticated) |
| Bandwidth | Generous for public repos; counted for private |
| Payment card | Never required |

### Pros & Cons

**Pros**
- No payment card, no storage cost, no bandwidth cost for public repos
- Files have version history via Git
- Well-documented API with official SDK
- Works for storing config files, templates, or small static assets

**Cons**
- Every upload is a Git commit — not appropriate for frequent writes
- 100 MB file size limit; performance degrades for files over 1 MB via API
- Not designed for object storage — no content-type headers, no CORS configuration
- Rate limited at 5,000 API calls/hour
- Not suitable for user-uploaded files in production
- Repository can balloon in size from binary files
- No concept of private URLs — public repos expose everything

---

## 5. Proton Drive (Research & Future Reference)

### Overview

Proton Drive is an end-to-end encrypted cloud storage service from Proton AG (Switzerland). All data is encrypted client-side before upload, meaning Proton itself cannot read stored files. This makes it excellent for privacy but significantly complicates any API integration.

As of June 2026, Proton Drive does **not have a public API ready for third-party use**. An official SDK exists (`@protontech/drive-sdk`) and is actively being developed, but it is explicitly marked as "not ready for production use or third-party apps." This section documents the current state for future reference.

### Payment Card & Free Tier

- **Payment card required:** No — free Proton account with 1 GB free storage
- **Free tier storage:** 1 GB (expandable with referrals)
- **Proton Unlimited plan:** Paid, with more storage

### Current SDK Status (June 2026)

| Aspect | Status |
|---|---|
| Official SDK npm package | `@protontech/drive-sdk` (TypeScript) |
| Third-party production use | Not supported — explicitly blocked |
| Authentication support | Not included in SDK (major blocker) |
| Available operations | Upload, download, create folders, rename/move, delete |
| Cryptographic migration | Planned end of 2026 / early 2027 — will break older SDK versions |
| CLI tools | Planned Q2 2026 |
| Full third-party release | Estimated late 2026 or early 2027 |

### Community Approaches (Current Workarounds)

None of the community approaches are suitable for production use:

1. **rclone Proton Drive backend** — Available but its maintainer noted in December 2025 it "is not being maintained" due to lack of a stable public API. Can be used as a CLI tool for personal scripts but not for application integration.

2. **proton-webdav-bridge** (`github.com/StollD/proton-webdav-bridge`) — Experimental community bridge that exposes a local WebDAV interface over Proton Drive. Runs as a daemon; not a programmatic integration. Explicitly described as "experimental and mostly untested" by its author. Not suitable for a web application backend.

3. **Unofficial API libraries** — Libraries like `protonmail-api` only handle email operations (via Puppeteer); they do not support Drive file operations.

### Why Direct API Usage Is Not Viable

Proton Drive does not publish its API documentation. Third-party tools have been implemented by reverse-engineering the open-sourced Proton Drive web client and observing browser traffic. Proton's backend API:

- Requires proprietary authentication (SRP — Secure Remote Password protocol)
- Uses end-to-end encryption with PGP keys managed per-file
- Has no public documentation
- Has no stability guarantees for undocumented endpoints

### When to Revisit

Revisit Proton Drive integration when:
- The `@protontech/drive-sdk` officially announces third-party production support
- Authentication modules are added to the SDK
- The planned cryptographic migration is complete (targeted end of 2026)

At that point, the TypeScript SDK at `@protontech/drive-sdk` will be the integration path. The SDK design suggests a `ProtonDriveClient` instance with methods for file upload, download, folder management, and event-based sync.

---

## Excluded Providers

### Cloudflare R2 — Excluded (Payment Card Required)

Cloudflare R2 has a generous free tier (10 GB storage, 1M Class A operations/month, no egress fees) but **requires a payment card to activate**. Multiple community reports confirm this is mandatory. Some users have also reported an unexpected $5 charge upon activation. This makes it unsuitable for the stated constraint.

### Storj DCS — Excluded (Minimum Monthly Fee)

As of July 2026, Storj imposes a **minimum monthly fee of $50** (increased from $5). This is not a usage cap — it is a floor charge regardless of usage. The free trial is time-limited. Accounts paying in STORJ token are exempt from the minimum fee, but that introduces cryptocurrency complexity. Not suitable.

### Wasabi — Excluded (Minimum Storage Fee)

Wasabi charges a minimum of 1 TB of storage per month (approximately $6.99/month). There is no free tier and no trial without a payment card. Not suitable.

---

## Recommendation

### For Production Use in DevStash

**Use Supabase Storage as the primary provider.**

Reasoning:
- No payment card, ever
- Integrates directly with the Next.js patterns already in use
- Row Level Security ties file access to the existing user model
- The `@supabase/ssr` library makes server and client usage consistent
- 1 GB free is sufficient for a development-phase application
- If Supabase is already used for the database (as suggested by the project's Neon setup being separate), a second Supabase project can be created specifically for storage

**If 1 GB free storage is insufficient, add Tebi.io as overflow storage.**

Tebi provides 25 GB free with no card required, is S3-compatible, and can serve as the primary store for larger file types (images, attachments) while Supabase handles smaller structured data files.

### For Personal or Non-Commercial Experimentation Only

Proton Drive can be explored once its SDK releases third-party support (estimated late 2026–early 2027). It is the only option that provides end-to-end encryption at the storage layer, which is valuable for any files containing sensitive developer data (credentials, private API keys stored as snippets, etc.).

### Decision Matrix

| Requirement | Supabase | Tebi.io | Backblaze B2 |
|---|---|---|---|
| No payment card | Yes | Yes | Yes (private only) |
| Next.js integration | Excellent | Good (AWS SDK) | Good (AWS SDK) |
| Free storage | 1 GB | 25 GB | 10 GB |
| Access control | RLS (fine-grained) | Per-object ACL | Bucket + App Keys |
| Public CDN URLs | Yes | Yes | Needs Cloudflare |
| Community support | Large | Small | Medium |
| SDK quality | First-class | AWS SDK v3 | AWS SDK v3 |

---

## Sources

- [Proton Drive SDK January 2026 Update](https://proton.me/blog/drive-sdk-january-2026)
- [ProtonDriveApps/sdk on GitHub](https://github.com/ProtonDriveApps/sdk)
- [@protontech/drive-sdk on npm](https://www.npmjs.com/package/@protontech/drive-sdk)
- [rclone Proton Drive backend](https://rclone.org/protondrive/)
- [proton-webdav-bridge on GitHub](https://github.com/StollD/proton-webdav-bridge)
- [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [Cloudflare Community: R2 requires payment method](https://community.cloudflare.com/t/if-i-want-to-use-cloudflare-r2-i-have-to-link-a-payment-method-i-suggest-not-doin/887578)
- [Backblaze B2 Sign Up](https://www.backblaze.com/sign-up/cloud-storage)
- [Backblaze B2 AWS SDK v3 Documentation](https://www.backblaze.com/docs/cloud-storage-use-the-aws-sdk-for-javascript-v3-with-backblaze-b2)
- [Backblaze B2 Create and Manage App Keys](https://www.backblaze.com/docs/cloud-storage-create-and-manage-app-keys)
- [Backblaze B2 S3 Presigned URLs](https://help.backblaze.com/hc/en-us/articles/360047815993-Does-the-B2-S3-Compatible-API-support-Pre-Signed-URLs)
- [Storj Pricing Overview](https://docs.storj.io/dcs/billing-payment-and-accounts-1/pricing/free-tier/)
- [Tebi.io S3 Node.js SDK Docs](https://docs.tebi.io/s3/code_examples/nodejs_sdk_v3.html)
- [Tebi.io Connection Parameters](https://docs.tebi.io/intro/connection.html)
- [Supabase Pricing](https://supabase.com/pricing)
- [Supabase Storage Quickstart](https://supabase.com/docs/guides/storage/quickstart)
- [Supabase Creating Buckets](https://supabase.com/docs/guides/storage/buckets/creating-buckets)
- [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [GitHub Octokit SDK](https://github.com/octokit/octokit.js)
- [GitHub Contents API](https://docs.github.com/en/rest/repos/contents)
