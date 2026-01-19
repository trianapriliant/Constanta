# Future AI Features (Backlog)

## 1. Import Soal dari PDF (AI Generator)
**Status**: Planned / Deferred

**Concept**:
Fitur untuk mengotomatisasi input soal dari dokumen PDF (Bank Soal konvensional) menjadi format digital terstruktur di Database Konstanta.

**Workflow**:
1.  **Upload**: Teacher mengupload file PDF (Teks atau Scan).
2.  **Processing**:
    -   System mengekstrak teks (menggunakan library PDF Parser atau OCR untuk scan).
    -   AI (LLM) memparsing teks mentah menjadi array object JSON:
        -   Prompt (Soal & Gambar jika ada)
        -   Options (Pilihan Ganda)
        -   Correct Answer (Kunci Jawaban)
        -   **Enhanced Explanation**: AI men-generate pembahasan rinci dan mencari referensi terkait.
3.  **Review (Staging)**:
    -   User melihat hasil parsing di tabel sementara.
    -   User mengedit jika ada kesalahan parsing (misal rumus LaTeX kurang pas).
4.  **Save**: User menyimpan soal yang valid ke Database.

**Technical Stack**:
-   Vercel AI SDK
-   PDF Parser / Tesseract.js (OCR)
-   LLM (OpenAI/Gemini/Anthropic) via API

**Notes**:
-   Kesulitan utama ada pada ekstraksi rumus Matematika/Fisika ke format LaTeX yang valid.
