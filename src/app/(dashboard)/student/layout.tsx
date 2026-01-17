import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    GraduationCap,
    BookOpen,
    LogOut,
    User,
    Plus,
    Settings,
} from 'lucide-react'

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'student') {
        redirect('/teacher')
    }

    const initials = profile?.name
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase() || 'S'

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Top Navigation */}
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/student" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg gradient-teal flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-semibold text-xl">Constanta</span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-1">
                            <Link href="/student">
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <BookOpen className="w-4 h-4" />
                                    My Classes
                                </Button>
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/student/join">
                            <Button size="sm" className="gap-2 gradient-teal text-white border-0">
                                <Plus className="w-4 h-4" />
                                Join Class
                            </Button>
                        </Link>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className="gradient-teal text-white text-sm">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <div className="px-2 py-1.5">
                                    <p className="text-sm font-medium">{profile?.name}</p>
                                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/student/profile" className="cursor-pointer">
                                        <User className="mr-2 h-4 w-4" />
                                        Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/student/settings" className="cursor-pointer">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <form action="/api/auth/signout" method="POST">
                                    <DropdownMenuItem asChild>
                                        <button type="submit" className="w-full cursor-pointer">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Sign Out
                                        </button>
                                    </DropdownMenuItem>
                                </form>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    )
}
