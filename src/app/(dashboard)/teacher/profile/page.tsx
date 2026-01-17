import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserProfile } from '../../_components/user-profile'

export default async function TeacherProfilePage() {
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

    if (profile?.role !== 'teacher') {
        redirect('/student')
    }

    return <UserProfile profile={profile} />
}
