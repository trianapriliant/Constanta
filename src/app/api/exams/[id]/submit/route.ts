import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gradeAttempt, type AttemptGradingInput } from '@/lib/grading/engine'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: examId } = await params
    const { attemptId } = await request.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the attempt
    const { data: attempt, error: attemptError } = await supabase
        .from('attempts')
        .select('*, exam:exams(*)')
        .eq('id', attemptId)
        .eq('student_id', user.id)
        .single() as { data: any, error: any }

    if (attemptError || !attempt) {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if ((attempt as any).status !== 'in_progress') {
        return NextResponse.json({ error: 'Exam already submitted' }, { status: 400 })
    }

    // Get exam questions with correct answers
    const { data: examQuestions } = await supabase
        .from('exam_questions')
        .select(`
      *,
      question:questions(*)
    `)
        .eq('exam_id', examId) as { data: any[] | null }

    if (!examQuestions) {
        return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 })
    }

    // Get student answers
    const { data: attemptAnswers } = await supabase
        .from('attempt_answers')
        .select('*')
        .eq('attempt_id', attemptId) as { data: any[] | null }

    const answersMap: Record<string, any> = {}
    attemptAnswers?.forEach((a: any) => {
        answersMap[a.question_id] = a
    })

    // Prepare grading input
    const gradingInput: AttemptGradingInput = {
        answers: examQuestions.map((eq: any) => ({
            questionId: eq.question_id,
            questionType: eq.question.type,
            correctAnswer: eq.question.correct_answer_json,
            studentAnswer: answersMap[eq.question_id]?.answer_json ?? null,
            points: eq.points,
            numericTolerance: eq.question.numeric_tolerance,
        })),
    }

    // Grade the attempt
    const result = gradeAttempt(gradingInput)

    // Update each answer with grading result
    for (const graded of result.gradedAnswers) {
        await supabase
            .from('attempt_answers')
            .update({
                is_correct: graded.isCorrect,
                points_awarded: graded.pointsAwarded,
            })
            .eq('attempt_id', attemptId)
            .eq('question_id', graded.questionId)
    }

    // Calculate time taken
    const startedAt = new Date(attempt.started_at).getTime()
    const timeTakenSeconds = Math.floor((Date.now() - startedAt) / 1000)

    // Update attempt with final results
    const { error: updateError } = await supabase
        .from('attempts')
        .update({
            status: result.hasManualGrading ? 'submitted' : 'graded',
            submitted_at: new Date().toISOString(),
            score: result.totalScore,
            max_score: result.maxScore,
            time_taken_seconds: timeTakenSeconds,
        })
        .eq('id', attemptId)

    if (updateError) {
        console.error('Update attempt error:', updateError)
        return NextResponse.json({ error: 'Failed to update attempt', details: updateError.message }, { status: 500 })
    }

    // Log audit event
    await supabase
        .from('audit_events')
        .insert({
            class_id: (attempt.exam as any).class_id,
            exam_id: examId,
            attempt_id: attemptId,
            user_id: user.id,
            event_type: 'exam_submitted',
            payload: {
                score: result.totalScore,
                maxScore: result.maxScore,
                hasManualGrading: result.hasManualGrading,
            },
        })

    return NextResponse.json({
        success: true,
        score: result.totalScore,
        maxScore: result.maxScore,
        hasManualGrading: result.hasManualGrading,
    })
}
