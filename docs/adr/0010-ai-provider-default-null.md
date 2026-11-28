# 0010 — Provider AI OpenAI-compatible dengan default null

## Konteks
Fitur berita/asisten akan membutuhkan AI, tetapi aplikasi ini dipakai secara
pribadi dan lokal. Tidak boleh ada data yang keluar tanpa keputusan eksplisit,
dan test tidak boleh membuat panggilan jaringan sungguhan.

## Keputusan
`config/ai.php` membaca `AI_PROVIDER` dengan nilai default null. Binding
`AiProvider` memilih `NullAiProvider` bila kosong, atau
`OpenAiCompatibleProvider` (HTTP POST ke `{base_url}/chat/completions`) bila
`openai_compatible`. Semua kegagalan menjadi `AiUnavailableException`.

## Konsekuensi
- Tanpa konfigurasi, `isAvailable()` false dan pemanggilan melempar exception;
  pemanggil wajib punya fallback.
- Kunci API tidak masuk exception maupun log; log hanya status dan durasi.
- Retry terbatas hanya untuk 429/5xx, dengan timeout dan batas token dari env.
- `ai:ping` meminta konfirmasi karena memakai token; panduan ada di
  [`docs/ai-setup.md`](../ai-setup.md).

## Status
Diterima (AI-01).
