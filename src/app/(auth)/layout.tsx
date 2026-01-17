import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 gradient-teal p-12 flex-col justify-between">
                <Link href="/" className="flex items-center gap-2 text-white">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-2xl">Constanta</span>
                </Link>

                <div className="text-white">
                    <h1 className="text-4xl font-bold mb-4">
                        Modern Learning Platform
                    </h1>
                    <p className="text-lg text-white/80">
                        Create classes, share materials, build exams, and track progress.
                        All in one clean, intuitive platform.
                    </p>
                </div>

                <p className="text-white/60 text-sm">
                    © 2024 Constanta. A modern classroom platform.
                </p>
            </div>

            {/* Right side - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden mb-8">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg gradient-teal flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-semibold text-xl">Constanta</span>
                        </Link>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    )
}
