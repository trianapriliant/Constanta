-- ============================================================================
-- CONSTANTA CLASSROOM - SEED DATA
-- ============================================================================
-- Sample data for development and testing
-- Run AFTER schema.sql and rls.sql
-- ============================================================================

-- NOTE: The actual users need to be created via Supabase Auth first.
-- This seed script creates sample data assuming specific user IDs.
-- In production, use the auth API to create users, then the trigger will create profiles.

-- For development: Create sample questions directly
-- You'll need to update class_id and created_by with real IDs after creating a class

-- ============================================================================
-- SAMPLE QUESTIONS TEMPLATE
-- ============================================================================
-- Use these as templates when creating questions via the UI
-- They demonstrate Markdown, LaTeX, tables, and code blocks

/*
-- Sample MCQ Single (Algebra)
{
  "type": "mcq_single",
  "difficulty": "medium",
  "tags": ["algebra", "equations"],
  "points": 2,
  "prompt_md": "# Quadratic Equation\n\nSolve the following equation:\n\n$$x^2 - 5x + 6 = 0$$\n\nWhat are the roots?",
  "options_json": [
    {"id": "a", "text_md": "$x = 2$ and $x = 3$"},
    {"id": "b", "text_md": "$x = -2$ and $x = -3$"},
    {"id": "c", "text_md": "$x = 1$ and $x = 6$"},
    {"id": "d", "text_md": "$x = -1$ and $x = -6$"}
  ],
  "correct_answer_json": "a",
  "explanation_md": "## Solution\n\nWe can factor the equation:\n\n$$x^2 - 5x + 6 = (x - 2)(x - 3) = 0$$\n\nSetting each factor to zero:\n- $x - 2 = 0 \\Rightarrow x = 2$\n- $x - 3 = 0 \\Rightarrow x = 3$\n\n**Answer:** $x = 2$ and $x = 3$"
}

-- Sample MCQ Multi (Physics)
{
  "type": "mcq_multi",
  "difficulty": "hard",
  "tags": ["physics", "mechanics", "forces"],
  "points": 3,
  "prompt_md": "# Newton's Laws\n\nWhich of the following statements about Newton's Laws are **correct**? Select all that apply.\n\n| Law | Statement |\n|-----|-----------|  \n| First | An object at rest stays at rest unless acted upon |\n| Second | $F = ma$ |\n| Third | Action-reaction pairs |\n",
  "options_json": [
    {"id": "a", "text_md": "The net force on an object moving at constant velocity is zero"},
    {"id": "b", "text_md": "Acceleration is inversely proportional to mass"},
    {"id": "c", "text_md": "Action and reaction forces act on the same object"},
    {"id": "d", "text_md": "Inertia is the tendency of an object to resist changes in motion"}
  ],
  "correct_answer_json": ["a", "b", "d"],
  "explanation_md": "## Explanation\n\n**Correct answers: A, B, D**\n\n- **(A) Correct:** By Newton's First Law, constant velocity means net force = 0\n- **(B) Correct:** From $F = ma$, we get $a = F/m$, so $a \\propto 1/m$\n- **(C) Incorrect:** Action-reaction pairs act on *different* objects\n- **(D) Correct:** This is the definition of inertia"
}

-- Sample True/False
{
  "type": "true_false",
  "difficulty": "easy",
  "tags": ["chemistry", "atoms"],
  "points": 1,
  "prompt_md": "## Statement\n\nAn atom's atomic number is equal to the number of **protons** in its nucleus.",
  "correct_answer_json": true,
  "explanation_md": "**True!**\n\nThe atomic number (Z) equals the number of protons. This defines the element."
}

-- Sample Numeric
{
  "type": "numeric",
  "difficulty": "medium",
  "tags": ["physics", "kinematics"],
  "points": 2,
  "prompt_md": "# Free Fall Problem\n\nA ball is dropped from a height of 20 meters. Assuming $g = 10 \\, \\text{m/s}^2$ and no air resistance:\n\n**How long does it take to hit the ground?** (in seconds)\n\n> Use the formula: $h = \\frac{1}{2}gt^2$",
  "correct_answer_json": 2,
  "numeric_tolerance": 0.1,
  "explanation_md": "## Solution\n\nUsing $h = \\frac{1}{2}gt^2$:\n\n$$20 = \\frac{1}{2}(10)t^2$$\n$$20 = 5t^2$$\n$$t^2 = 4$$\n$$t = 2 \\, \\text{seconds}$$"
}

-- Sample Short Text
{
  "type": "short_text",
  "difficulty": "easy",
  "tags": ["programming", "basics"],
  "points": 1,
  "prompt_md": "# Programming Basics\n\nWhat keyword is used in JavaScript to declare a variable that can be reassigned?\n\n```javascript\n// Example:\n___ count = 0;\ncount = count + 1; // This should work\n```",
  "correct_answer_json": "let",
  "explanation_md": "The answer is `let`.\n\n```javascript\nlet count = 0;\ncount = count + 1; // Works!\n```\n\n- `let` - can be reassigned\n- `const` - cannot be reassigned\n- `var` - legacy, avoid using"
}

-- Sample Essay
{
  "type": "essay",
  "difficulty": "hard",
  "tags": ["biology", "evolution"],
  "points": 10,
  "prompt_md": "# Essay Question\n\nExplain Darwin's theory of natural selection. Include:\n\n1. The key principles\n2. Evidence supporting the theory\n3. Modern applications\n\n**Minimum 200 words.**",
  "correct_answer_json": null,
  "explanation_md": "## Grading Rubric\n\n| Criteria | Points |\n|----------|--------|\n| Key principles explained | 4 |\n| Evidence cited correctly | 3 |\n| Modern applications | 2 |\n| Writing quality | 1 |"
}
*/

-- ============================================================================
-- STORAGE BUCKET SETUP (run in Supabase Dashboard > Storage)
-- ============================================================================
/*
Create a bucket named 'attachments' with the following settings:
- Public: false (private bucket)
- File size limit: 10MB
- Allowed MIME types: image/*, application/pdf

Then add this storage policy via SQL:

CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can read attachments from their classes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Teachers can delete attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attachments'
  AND auth.role() = 'authenticated'
);
*/
