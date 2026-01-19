-- Seeding Canvas Question (Coordinate Systems)
-- Idempotency: Delete if exists
DELETE FROM "public"."questions" 
WHERE "class_id" = 'a4100085-abd7-4142-b123-912dddd38483' 
AND "prompt_md" LIKE 'Diketahui koordinat bola (r, \theta, \phi)%';

INSERT INTO "public"."questions" (
    "class_id", 
    "prompt_md", 
    "explanation_md", 
    "options_json", 
    "type", 
    "difficulty", 
    "tags", 
    "points",
    "created_by",
    "correct_answer_json"
) VALUES 
(
    'a4100085-abd7-4142-b123-912dddd38483',
    'Diketahui koordinat bola $(r, \theta, \phi)$ dari dua titik, $A(3, 60^\circ, 60^\circ)$ dan $B(2, 150^\circ, 30^\circ)$.

1.  Berapakah jarak antar titik A dan B?
2.  Jika O adalah titik origin, berapakah sudut yang terbentuk antara AOB?',
    '**Analisis Jawaban:**

**Langkah 1: Konversi ke Koordinat Kartesian (Opsional tapi membantu visualisasi)**
Definisi koordinat bola (konvensi fisika/umum):
*   $x = r \sin\theta \cos\phi$
*   $y = r \sin\theta \sin\phi$
*   $z = r \cos\theta$

**Titik A $(3, 60^\circ, 60^\circ)$:**
*   $x_A = 3 \sin(60^\circ) \cos(60^\circ) = 3 (\frac{\sqrt{3}}{2}) (\frac{1}{2}) = \frac{3\sqrt{3}}{4} \approx 1,299$
*   $y_A = 3 \sin(60^\circ) \sin(60^\circ) = 3 (\frac{\sqrt{3}}{2}) (\frac{\sqrt{3}}{2}) = \frac{9}{4} = 2,25$
*   $z_A = 3 \cos(60^\circ) = 3 (\frac{1}{2}) = 1,5$

**Titik B $(2, 150^\circ, 30^\circ)$:**
*   $x_B = 2 \sin(150^\circ) \cos(30^\circ) = 2 (\frac{1}{2}) (\frac{\sqrt{3}}{2}) = \frac{\sqrt{3}}{2} \approx 0,866$
*   $y_B = 2 \sin(150^\circ) \sin(30^\circ) = 2 (\frac{1}{2}) (\frac{1}{2}) = 0,5$
*   $z_B = 2 \cos(150^\circ) = 2 (-\frac{\sqrt{3}}{2}) = -\sqrt{3} \approx -1,732$

---

**Jawaban Pertanyaan 2: Sudut AOB ($\gamma$)**
Lebih mudah menghitung sudut dulu menggunakan prinsip *Dot Product* vektor posisi $\vec{A}$ dan $\vec{B}$.
$$ \vec{A} \cdot \vec{B} = |\vec{A}| |\vec{B}| \cos \gamma $$

Rumus Dot Product dalam koordinat bola:
$$ \cos \gamma = \cos\theta_A \cos\theta_B + \sin\theta_A \sin\theta_B \cos(\phi_A - \phi_B) $$

Substitusi nilai:
*   $\theta_A = 60^\circ, \theta_B = 150^\circ$
*   $\phi_A = 60^\circ, \phi_B = 30^\circ \implies \Delta\phi = 30^\circ$

$$ \cos \gamma = \cos(60)\cos(150) + \sin(60)\sin(150)\cos(30) $$
$$ \cos \gamma = (0,5)(-\frac{\sqrt{3}}{2}) + (\frac{\sqrt{3}}{2})(0,5)(\frac{\sqrt{3}}{2}) $$
$$ \cos \gamma = -\frac{\sqrt{3}}{4} + \frac{3}{8} $$
$$ \cos \gamma = \frac{3 - 2\sqrt{3}}{8} \approx \frac{3 - 3,464}{8} = -0,058$$

Maka besar sudut $\gamma$:
$$ \gamma = \arccos(-0,058) \approx 93,33^\circ $$

**Jawaban (2): $93,33^\circ$ (atau $\arccos(\frac{3 - 2\sqrt{3}}{8})$)**

---

**Jawaban Pertanyaan 1: Jarak AB ($d$)**
Gunakan Aturan Kosinus untuk segitiga AOB:
$$ d^2 = r_A^2 + r_B^2 - 2 r_A r_B \cos \gamma $$

Substitusi nilai:
*   $r_A = 3$
*   $r_B = 2$
*   $\cos \gamma = \frac{3 - 2\sqrt{3}}{8}$

$$ d^2 = 3^2 + 2^2 - 2(3)(2) (\frac{3 - 2\sqrt{3}}{8}) $$
$$ d^2 = 9 + 4 - 12 (\frac{3 - 2\sqrt{3}}{8}) $$
$$ d^2 = 13 - \frac{3}{2}(3 - 2\sqrt{3}) $$
$$ d^2 = 13 - 4,5 + 3\sqrt{3} $$
$$ d^2 = 8,5 + 3\sqrt{3} $$
$$ d^2 \approx 8,5 + 5,196 = 13,696 $$

$$ d = \sqrt{13,696} \approx 3,70 $$

**Jawaban (1): $\sqrt{8,5 + 3\sqrt{3}} \approx 3,70$ satuan panjang**',
    null, -- options_json is null for canvas
    'canvas',
    'hard',
    ARRAY['Matematika', 'Sistem Koordinat', 'Trigonometri', 'Vektor'],
    10,
    (SELECT user_id FROM class_members WHERE class_id = 'a4100085-abd7-4142-b123-912dddd38483' AND role = 'owner' LIMIT 1),
    '{"check": "manual"}'::jsonb -- Placeholder for manual grading
);
