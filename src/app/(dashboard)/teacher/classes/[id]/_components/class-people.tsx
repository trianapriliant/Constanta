'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { UserPlus, Users, Crown, GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ClassPeopleProps {
    classId: string
}

interface Member {
    id: string
    role: string
    user_id: string
    profiles: {
        id: string
        name: string
        email: string
    }
}

export function ClassPeople({ classId }: ClassPeopleProps) {
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchMembers() {
            const supabase = createClient()
            const { data } = await supabase
                .from('class_members')
                .select(`
          id,
          role,
          user_id,
          profiles (
            id,
            name,
            email
          )
        `)
                .eq('class_id', classId)
                .eq('status', 'active')
                .order('role', { ascending: true })

            setMembers((data as any) || [])
            setLoading(false)
        }

        fetchMembers()
    }, [classId])

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                </CardContent>
            </Card>
        )
    }

    const teachers = members.filter(m => m.role === 'owner' || m.role === 'teacher')
    const students = members.filter(m => m.role === 'student')

    return (
        <div className="space-y-6">
            {/* Teachers */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Crown className="w-5 h-5 text-primary" />
                            Teachers
                        </CardTitle>
                        <CardDescription>{teachers.length} teacher(s)</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {teachers.map((member) => (
                            <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
                                <Avatar>
                                    <AvatarFallback className="gradient-teal text-white">
                                        {member.profiles?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-medium">{member.profiles?.name}</p>
                                    <p className="text-sm text-muted-foreground">{member.profiles?.email}</p>
                                </div>
                                <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                                    {member.role === 'owner' ? 'Owner' : 'Teacher'}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Students */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-primary" />
                            Students
                        </CardTitle>
                        <CardDescription>{students.length} student(s)</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" className="gap-2">
                        <UserPlus className="w-4 h-4" />
                        Invite
                    </Button>
                </CardHeader>
                <CardContent>
                    {students.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No students yet. Share the class code to invite students!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {students.map((member) => (
                                <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
                                    <Avatar>
                                        <AvatarFallback>
                                            {member.profiles?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-medium">{member.profiles?.name}</p>
                                        <p className="text-sm text-muted-foreground">{member.profiles?.email}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
