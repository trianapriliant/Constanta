/**
 * Grading Engine - Pure TypeScript functions for deterministic grading
 * 
 * This module provides server-authoritative grading logic.
 * All grading is deterministic and idempotent.
 */

import type { QuestionType, Json } from '@/types/database'

export interface GradingResult {
    isCorrect: boolean | null // null for essay/manual grading
    pointsAwarded: number
    needsManualGrading: boolean
}

export interface GradingInput {
    questionType: QuestionType
    correctAnswer: Json
    studentAnswer: Json | null
    points: number
    numericTolerance?: number | null
}

/**
 * Grade a single question answer
 */
export function gradeAnswer(input: GradingInput): GradingResult {
    const { questionType, correctAnswer, studentAnswer, points, numericTolerance } = input

    // No answer provided
    if (studentAnswer === null || studentAnswer === undefined) {
        return {
            isCorrect: false,
            pointsAwarded: 0,
            needsManualGrading: false,
        }
    }

    switch (questionType) {
        case 'mcq_single':
            return gradeMcqSingle(correctAnswer, studentAnswer, points)

        case 'mcq_multi':
            return gradeMcqMulti(correctAnswer, studentAnswer, points)

        case 'true_false':
            return gradeTrueFalse(correctAnswer, studentAnswer, points)

        case 'numeric':
            return gradeNumeric(correctAnswer, studentAnswer, points, numericTolerance)

        case 'short_text':
            return gradeShortText(correctAnswer, studentAnswer, points)

        case 'essay':
            return {
                isCorrect: null,
                pointsAwarded: 0,
                needsManualGrading: true,
            }

        default:
            return {
                isCorrect: false,
                pointsAwarded: 0,
                needsManualGrading: false,
            }
    }
}

/**
 * MCQ Single - exact match on option ID
 */
function gradeMcqSingle(correct: Json, answer: Json, points: number): GradingResult {
    const isCorrect = String(correct) === String(answer)
    return {
        isCorrect,
        pointsAwarded: isCorrect ? points : 0,
        needsManualGrading: false,
    }
}

/**
 * MCQ Multi - set equality (order independent)
 */
function gradeMcqMulti(correct: Json, answer: Json, points: number): GradingResult {
    const correctSet = new Set(Array.isArray(correct) ? correct.map(String) : [])
    const answerSet = new Set(Array.isArray(answer) ? answer.map(String) : [])

    // Check set equality
    const isCorrect =
        correctSet.size === answerSet.size &&
        [...correctSet].every(item => answerSet.has(item))

    return {
        isCorrect,
        pointsAwarded: isCorrect ? points : 0,
        needsManualGrading: false,
    }
}

/**
 * True/False - boolean comparison
 */
function gradeTrueFalse(correct: Json, answer: Json, points: number): GradingResult {
    const correctBool = correct === true || correct === 'true'
    const answerBool = answer === true || answer === 'true'
    const isCorrect = correctBool === answerBool

    return {
        isCorrect,
        pointsAwarded: isCorrect ? points : 0,
        needsManualGrading: false,
    }
}

/**
 * Numeric - tolerance-based comparison
 */
function gradeNumeric(
    correct: Json,
    answer: Json,
    points: number,
    tolerance?: number | null
): GradingResult {
    const correctNum = parseFloat(String(correct))
    const answerNum = parseFloat(String(answer))

    if (isNaN(correctNum) || isNaN(answerNum)) {
        return {
            isCorrect: false,
            pointsAwarded: 0,
            needsManualGrading: false,
        }
    }

    const tol = tolerance ?? 0
    const isCorrect = Math.abs(correctNum - answerNum) <= tol

    return {
        isCorrect,
        pointsAwarded: isCorrect ? points : 0,
        needsManualGrading: false,
    }
}

/**
 * Short Text - case-insensitive exact match
 * Can optionally support regex patterns
 */
function gradeShortText(correct: Json, answer: Json, points: number): GradingResult {
    const correctStr = String(correct).trim().toLowerCase()
    const answerStr = String(answer).trim().toLowerCase()

    // Check for regex pattern (starts with / and ends with /)
    if (correctStr.startsWith('/') && correctStr.endsWith('/')) {
        try {
            const pattern = correctStr.slice(1, -1)
            const regex = new RegExp(pattern, 'i')
            const isCorrect = regex.test(answerStr)
            return {
                isCorrect,
                pointsAwarded: isCorrect ? points : 0,
                needsManualGrading: false,
            }
        } catch {
            // Invalid regex, fall back to exact match
        }
    }

    const isCorrect = correctStr === answerStr

    return {
        isCorrect,
        pointsAwarded: isCorrect ? points : 0,
        needsManualGrading: false,
    }
}

/**
 * Grade all answers for an attempt and calculate total score
 */
export interface AttemptGradingInput {
    answers: Array<{
        questionId: string
        questionType: QuestionType
        correctAnswer: Json
        studentAnswer: Json | null
        points: number
        numericTolerance?: number | null
    }>
}

export interface AttemptGradingResult {
    totalScore: number
    maxScore: number
    gradedAnswers: Array<{
        questionId: string
        isCorrect: boolean | null
        pointsAwarded: number
        needsManualGrading: boolean
    }>
    hasManualGrading: boolean
}

export function gradeAttempt(input: AttemptGradingInput): AttemptGradingResult {
    let totalScore = 0
    let maxScore = 0
    let hasManualGrading = false

    const gradedAnswers = input.answers.map(answer => {
        const result = gradeAnswer({
            questionType: answer.questionType,
            correctAnswer: answer.correctAnswer,
            studentAnswer: answer.studentAnswer,
            points: answer.points,
            numericTolerance: answer.numericTolerance,
        })

        totalScore += result.pointsAwarded
        maxScore += answer.points

        if (result.needsManualGrading) {
            hasManualGrading = true
        }

        return {
            questionId: answer.questionId,
            isCorrect: result.isCorrect,
            pointsAwarded: result.pointsAwarded,
            needsManualGrading: result.needsManualGrading,
        }
    })

    return {
        totalScore,
        maxScore,
        gradedAnswers,
        hasManualGrading,
    }
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * Deterministic when given the same seed
 */
export function shuffleArray<T>(array: T[], seed?: number): T[] {
    const result = [...array]
    let random = seed !== undefined ? seededRandom(seed) : Math.random

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1))
            ;[result[i], result[j]] = [result[j], result[i]]
    }

    return result
}

/**
 * Simple seeded random number generator
 */
function seededRandom(seed: number): () => number {
    let value = seed
    return () => {
        value = (value * 1103515245 + 12345) & 0x7fffffff
        return value / 0x7fffffff
    }
}
