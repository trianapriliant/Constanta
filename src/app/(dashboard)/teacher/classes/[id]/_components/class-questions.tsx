import { createClient } from '@/lib/supabase/server'
import { QuestionBankClient } from './question-bank-client'

interface ClassQuestionsProps {
    classId: string
}

export async function ClassQuestions({ classId }: ClassQuestionsProps) {
    const supabase = await createClient()

    // Get questions with usage stats
    const { data: questions } = await supabase
        .from('questions')
        .select('*, exam_questions(count)')
        .eq('class_id', classId)
        .order('created_at', { ascending: false })

    return <QuestionBankClient classId={classId} questions={questions || []} />
}
