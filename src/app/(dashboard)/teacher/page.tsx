import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, BookOpen, FileQuestion } from 'lucide-react'
import { CreateClassDialog } from './_components/create-class-dialog'

export default async function TeacherDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get classes where user is owner or teacher
    const { data: memberships } = await supabase
        .from('class_members')
        .select(`
      class_id,
      role,
      classes (
        id,
        title,
        description,
        subject,
        class_code,
        created_at
      )
    `)
        .eq('user_id', user?.id)
        .in('role', ['owner', 'teacher'])
        .eq('status', 'active') as { data: any[] | null }

    const classes = memberships?.map((m: any) => ({
        ...(m.classes as any),
        role: m.role,
    })) || []

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">My Classes</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your classes and students
                    </p>
                </div>
                <CreateClassDialog />
            </div>

            {classes.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                        <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No classes yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Create your first class to get started
                        </p>
                        <CreateClassDialog />
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls: any) => (
                        <Link key={cls.id} href={`/teacher/classes/${cls.id}`}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                                <div className="h-2 gradient-teal rounded-t-xl" />
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="line-clamp-1">{cls.title}</CardTitle>
                                            {cls.subject && (
                                                <CardDescription className="mt-1">{cls.subject}</CardDescription>
                                            )}
                                        </div>
                                        <Badge variant="secondary" className="font-mono text-xs">
                                            {cls.class_code}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {cls.description || 'No description'}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
