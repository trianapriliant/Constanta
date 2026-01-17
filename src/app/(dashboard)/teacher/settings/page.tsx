import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserSettings } from '../../_components/user-settings'

export default async function TeacherSettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return <UserSettings />
}
