# Constanta - Modern Classroom Platform

A clean, modern learning platform (Google Classroom-like) built with Next.js, Supabase, and shadcn/ui.

## Features

- **Teachers**: Create classes, manage students, publish materials, create question banks, build exams, grade, and view analytics
- **Students**: Join classes with codes, view materials, take exams with timer, get instant scores, and review explanations
- **Rich Content**: Markdown editor with LaTeX math, code blocks, tables, and images
- **Smart Exams**: Multiple question types, auto-grading, autosave, and anti-cheating measures

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Database**: Supabase PostgreSQL + RLS
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Forms**: React Hook Form + Zod
- **Markdown**: react-markdown + remark-gfm + rehype-katex

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account ([supabase.com](https://supabase.com))

### 1. Clone and Install

```bash
cd constanta
npm install
```

### 2. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the following files in order:
   - `supabase/schema.sql` - Creates all tables, indexes, and triggers
   - `supabase/rls.sql` - Enables Row Level Security policies
   - (Optional) `supabase/seed.sql` - Sample data templates
3. Go to **Storage** and create a bucket named `attachments`:
   - Public: `false`
   - File size limit: `10MB`
   - Allowed MIME types: `image/*`, `application/pdf`

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials (from Project Settings > API):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
constanta/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Login, Register pages
│   │   ├── (dashboard)/          
│   │   │   ├── teacher/          # Teacher dashboard & classes
│   │   │   └── student/          # Student dashboard & exams
│   │   ├── api/                  # API routes (grading, etc.)
│   │   └── page.tsx              # Landing page
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   └── markdown/             # Markdown editor/viewer
│   ├── lib/
│   │   ├── supabase/             # Supabase clients
│   │   ├── grading/              # Grading engine
│   │   └── validations/          # Zod schemas
│   └── types/                    # TypeScript types
├── supabase/
│   ├── schema.sql                # Database schema
│   ├── rls.sql                   # RLS policies
│   └── seed.sql                  # Sample data
└── .env.example
```

## Key Design Decisions

### Markdown Approach
- Using `react-markdown` with `remark-gfm` for GitHub Flavored Markdown
- LaTeX math rendered via `rehype-katex` (faster than MathJax)
- Output sanitized with `rehype-sanitize`

### Math Rendering
- Inline math: `$...$`
- Block math: `$$...$$`
- KaTeX CSS loaded globally for performance

### Autosave Strategy
- Debounced saves (800ms delay)
- Synced to Supabase via API
- Status indicator (Saving/Saved)

### RLS Strategy
- All tables have RLS enabled
- Students can only access their classes/attempts
- Teachers can manage their own classes
- Class membership verified on every query

### Grading Engine
- Pure TypeScript functions (deterministic)
- Supports: MCQ single/multi, True/False, Numeric (with tolerance), Short text (regex), Essay (manual)
- Server-authoritative grading on submit

## Question Types

| Type | Auto-Grade | Description |
|------|------------|-------------|
| `mcq_single` | ✅ | Multiple choice (single answer) |
| `mcq_multi` | ✅ | Multi-select (set equality) |
| `true_false` | ✅ | True/False |
| `numeric` | ✅ | Number with optional tolerance |
| `short_text` | ✅ | Text (exact match or regex) |
| `essay` | ❌ | Manual grading |

## Sample Question Markdown

```markdown
# Quadratic Equation

Solve the following equation:

$$x^2 - 5x + 6 = 0$$

What are the roots?

| Method | Steps |
|--------|-------|
| Factor | $(x-2)(x-3) = 0$ |
| Answer | $x = 2$ or $x = 3$ |
```

## License

MIT
