-- ============================================================================
-- CONSTANTA CLASSROOM - ROW LEVEL SECURITY POLICIES
-- ============================================================================
-- Run this SQL AFTER schema.sql to enable RLS
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if user is a member of a class
CREATE OR REPLACE FUNCTION is_class_member(class_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM class_members
    WHERE class_id = class_uuid
      AND user_id = auth.uid()
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is a teacher/owner of a class
CREATE OR REPLACE FUNCTION is_class_teacher(class_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM class_members
    WHERE class_id = class_uuid
      AND user_id = auth.uid()
      AND role IN ('owner', 'teacher')
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is the owner of a class
CREATE OR REPLACE FUNCTION is_class_owner(class_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM class_members
    WHERE class_id = class_uuid
      AND user_id = auth.uid()
      AND role = 'owner'
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Teachers can read profiles of students in their classes
CREATE POLICY "Teachers can read class member profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_members cm1
      JOIN class_members cm2 ON cm1.class_id = cm2.class_id
      WHERE cm1.user_id = auth.uid()
        AND cm1.role IN ('owner', 'teacher')
        AND cm2.user_id = profiles.id
        AND cm1.status = 'active'
        AND cm2.status = 'active'
    )
  );

-- ============================================================================
-- CLASSES POLICIES
-- ============================================================================

-- Anyone can read class by code (for joining)
CREATE POLICY "Anyone can read class by code"
  ON classes FOR SELECT
  USING (true);

-- Teachers can create classes
CREATE POLICY "Teachers can create classes"
  ON classes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Class teachers can update their classes
CREATE POLICY "Teachers can update their classes"
  ON classes FOR UPDATE
  USING (is_class_teacher(id));

-- Class owners can delete their classes
CREATE POLICY "Owners can delete their classes"
  ON classes FOR DELETE
  USING (is_class_owner(id));

-- ============================================================================
-- CLASS MEMBERS POLICIES
-- ============================================================================

-- Members can see other members in their classes
CREATE POLICY "Members can see class members"
  ON class_members FOR SELECT
  USING (is_class_member(class_id));

-- Users can join classes (insert themselves as student)
CREATE POLICY "Users can join classes"
  ON class_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'student'
    AND status = 'active'
  );

-- Teachers can add/manage members
CREATE POLICY "Teachers can manage members"
  ON class_members FOR INSERT
  WITH CHECK (is_class_teacher(class_id));

CREATE POLICY "Teachers can update members"
  ON class_members FOR UPDATE
  USING (is_class_teacher(class_id));

CREATE POLICY "Teachers can remove members"
  ON class_members FOR DELETE
  USING (is_class_teacher(class_id));

-- Users can leave classes (delete own membership)
CREATE POLICY "Users can leave classes"
  ON class_members FOR DELETE
  USING (user_id = auth.uid() AND role != 'owner');

-- ============================================================================
-- MATERIALS POLICIES
-- ============================================================================

-- Members can read published materials
CREATE POLICY "Members can read published materials"
  ON materials FOR SELECT
  USING (
    is_class_member(class_id)
    AND (published = true OR is_class_teacher(class_id))
  );

-- Teachers can create materials
CREATE POLICY "Teachers can create materials"
  ON materials FOR INSERT
  WITH CHECK (is_class_teacher(class_id));

-- Teachers can update their materials
CREATE POLICY "Teachers can update materials"
  ON materials FOR UPDATE
  USING (is_class_teacher(class_id));

-- Teachers can delete materials
CREATE POLICY "Teachers can delete materials"
  ON materials FOR DELETE
  USING (is_class_teacher(class_id));

-- ============================================================================
-- MATERIAL ATTACHMENTS POLICIES
-- ============================================================================

-- Same as materials
CREATE POLICY "Members can read material attachments"
  ON material_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM materials m
      WHERE m.id = material_id
        AND is_class_member(m.class_id)
        AND (m.published = true OR is_class_teacher(m.class_id))
    )
  );

CREATE POLICY "Teachers can manage attachments"
  ON material_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM materials m
      WHERE m.id = material_id AND is_class_teacher(m.class_id)
    )
  );

-- ============================================================================
-- QUESTIONS POLICIES
-- ============================================================================

-- Teachers can read all questions in their classes
CREATE POLICY "Teachers can read questions"
  ON questions FOR SELECT
  USING (is_class_teacher(class_id));

-- Students can only see questions during exams (via exam_questions)
CREATE POLICY "Students can read exam questions"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exam_questions eq
      JOIN exams e ON eq.exam_id = e.id
      JOIN attempts a ON a.exam_id = e.id
      WHERE eq.question_id = questions.id
        AND a.student_id = auth.uid()
        AND a.status IN ('in_progress', 'submitted', 'graded')
    )
  );

-- Teachers can manage questions
CREATE POLICY "Teachers can create questions"
  ON questions FOR INSERT
  WITH CHECK (is_class_teacher(class_id));

CREATE POLICY "Teachers can update questions"
  ON questions FOR UPDATE
  USING (is_class_teacher(class_id));

CREATE POLICY "Teachers can delete questions"
  ON questions FOR DELETE
  USING (is_class_teacher(class_id));

-- ============================================================================
-- EXAMS POLICIES
-- ============================================================================

-- Members can see published exams
CREATE POLICY "Members can read published exams"
  ON exams FOR SELECT
  USING (
    is_class_member(class_id)
    AND (published = true OR is_class_teacher(class_id))
  );

-- Teachers can manage exams
CREATE POLICY "Teachers can create exams"
  ON exams FOR INSERT
  WITH CHECK (is_class_teacher(class_id));

CREATE POLICY "Teachers can update exams"
  ON exams FOR UPDATE
  USING (is_class_teacher(class_id));

CREATE POLICY "Teachers can delete exams"
  ON exams FOR DELETE
  USING (is_class_teacher(class_id));

-- ============================================================================
-- EXAM QUESTIONS POLICIES
-- ============================================================================

-- Teachers can manage exam questions
CREATE POLICY "Teachers can manage exam questions"
  ON exam_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM exams e
      WHERE e.id = exam_id AND is_class_teacher(e.class_id)
    )
  );

-- Students with active attempts can read exam questions
CREATE POLICY "Students can read exam questions during attempt"
  ON exam_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM attempts a
      JOIN exams e ON a.exam_id = e.id
      WHERE a.exam_id = exam_questions.exam_id
        AND a.student_id = auth.uid()
    )
  );

-- ============================================================================
-- ATTEMPTS POLICIES
-- ============================================================================

-- Students can read their own attempts
CREATE POLICY "Students can read own attempts"
  ON attempts FOR SELECT
  USING (student_id = auth.uid());

-- Teachers can read all attempts in their classes
CREATE POLICY "Teachers can read class attempts"
  ON attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exams e
      WHERE e.id = exam_id AND is_class_teacher(e.class_id)
    )
  );

-- Students can create attempts (start exam)
CREATE POLICY "Students can start exams"
  ON attempts FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM exams e
      WHERE e.id = exam_id
        AND e.published = true
        AND is_class_member(e.class_id)
        AND (e.start_at IS NULL OR e.start_at <= NOW())
        AND (e.end_at IS NULL OR e.end_at >= NOW())
    )
  );

-- Students can update their own in-progress attempts (submit)
CREATE POLICY "Students can submit attempts"
  ON attempts FOR UPDATE
  USING (student_id = auth.uid() AND status = 'in_progress');

-- Teachers can update attempts (for manual grading)
CREATE POLICY "Teachers can grade attempts"
  ON attempts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM exams e
      WHERE e.id = exam_id AND is_class_teacher(e.class_id)
    )
  );

-- ============================================================================
-- ATTEMPT ANSWERS POLICIES
-- ============================================================================

-- Students can read their own answers
CREATE POLICY "Students can read own answers"
  ON attempt_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM attempts a
      WHERE a.id = attempt_id AND a.student_id = auth.uid()
    )
  );

-- Teachers can read all answers
CREATE POLICY "Teachers can read answers"
  ON attempt_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM attempts a
      JOIN exams e ON a.exam_id = e.id
      WHERE a.id = attempt_id AND is_class_teacher(e.class_id)
    )
  );

-- Students can save answers during attempt
CREATE POLICY "Students can save answers"
  ON attempt_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM attempts a
      WHERE a.id = attempt_id
        AND a.student_id = auth.uid()
        AND a.status = 'in_progress'
    )
  );

CREATE POLICY "Students can update answers"
  ON attempt_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM attempts a
      WHERE a.id = attempt_id
        AND a.student_id = auth.uid()
        AND a.status = 'in_progress'
    )
  );

-- Teachers can update answers (for manual grading)
CREATE POLICY "Teachers can grade answers"
  ON attempt_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM attempts a
      JOIN exams e ON a.exam_id = e.id
      WHERE a.id = attempt_id AND is_class_teacher(e.class_id)
    )
  );

-- ============================================================================
-- AUDIT EVENTS POLICIES
-- ============================================================================

-- Only insert allowed (no update/delete)
CREATE POLICY "Users can create audit events"
  ON audit_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can read their own audit events
CREATE POLICY "Users can read own audit events"
  ON audit_events FOR SELECT
  USING (user_id = auth.uid());

-- Teachers can read audit events in their classes
CREATE POLICY "Teachers can read class audit events"
  ON audit_events FOR SELECT
  USING (
    class_id IS NOT NULL AND is_class_teacher(class_id)
  );
