import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, Award } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon.png" width={32} height={32} alt="Constanta" className="w-8 h-8 rounded-lg" />
            <span className="font-semibold text-xl">Constanta</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="gradient-teal text-white border-0">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold mb-6 tracking-tight">
              A Modern Classroom
              <span className="gradient-teal-text"> Experience</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Create classes, share materials, build exams, and track student progress.
              All in one clean, intuitive platform.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="gradient-teal text-white border-0">
                  Start Teaching
                </Button>
              </Link>
              <Link href="/register?role=student">
                <Button size="lg" variant="outline">
                  Join as Student
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Class Management"
              description="Create classes, invite students with codes, and manage your classroom with ease."
            />
            <FeatureCard
              icon={<BookOpen className="w-6 h-6" />}
              title="Rich Content"
              description="Markdown editor with LaTeX math, code blocks, tables, and file attachments."
            />
            <FeatureCard
              icon={<Award className="w-6 h-6" />}
              title="Smart Exams"
              description="Build exams from your question bank with auto-grading and detailed analytics."
            />
          </div>
        </section>

        {/* Gradient Accent */}
        <div className="h-1 w-full gradient-teal-transparent" />
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 Constanta. A modern classroom platform.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-xl gradient-teal flex items-center justify-center text-white mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
