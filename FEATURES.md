# FEATURES — My Workspace

Checklist fitur dan rencana pengembangan. Dokumen ini adalah sumber kebenaran
untuk **apa yang sudah selesai** dan **apa yang akan dibangun**.

> Terakhir diperbarui: 27 November 2026

## Cara pakai dokumen ini

- `[x]` = selesai, sudah ada kode, test, dan pernah diverifikasi.
- `[ ]` = belum dikerjakan.
- `[~]` = sedang dikerjakan (ubah hanya jika kamu benar-benar mulai).
- Satu increment = satu fitur kecil yang bisa selesai, dites, dan dirilis.
- Jangan mencentang fitur sebelum test dan build lolos.
- Detail teknis, alur, dan acceptance criteria ada di `AGENT_CONTEXT.md`.

## Legenda prioritas

| Prioritas | Arti |
| --- | --- |
| P0 | Pondasi / blocker. Harus selesai sebelum fitur lain. |
| P1 | Nilai tinggi, sebaiknya berikutnya. |
| P2 | Penting, tapi bisa menyusul. |
| P3 | Eksperimen / nice to have. |

---

## 1. Fondasi & Infrastruktur

- [x] **FND-01** Laravel 12 + Inertia v2 + React 19 + Vite 7
- [x] **FND-02** Tailwind CSS v4 + komponen shadcn/ui
- [x] **FND-03** Font Plus Jakarta Sans di seluruh aplikasi
- [x] **FND-04** Koneksi PostgreSQL (`my_workspace`) untuk runtime
- [x] **FND-05** Database test SQLite in-memory lewat `phpunit.xml`
- [x] **FND-06** Pint, ESLint, Prettier, dan `npm run build` sebagai quality gate
- [x] **FND-07** Struktur test Pest + `RefreshDatabase`
- [x] **FND-08** CI GitHub Actions: Pint, ESLint, Prettier check, Pest, build
- [ ] ~~**FND-09** Script deploy / dokumentasi deployment~~ (pemakaian lokal saja, tidak dideploy)
- [x] **FND-10** Backup database terjadwal + dokumentasi restore

## 2. Autentikasi & Keamanan

- [x] **AUTH-01** Halaman login admin di `/`
- [x] **AUTH-02** Login dengan akun admin dari tabel `users`
- [x] **AUTH-03** Autentikasi Laravel + middleware `admin.auth`
- [x] **AUTH-04** Logout di `/keluar` + invalidasi session
- [x] **AUTH-05** Rate limit login (10 percobaan/menit)
- [x] **AUTH-06** Redirect tamu ke halaman login
- [x] **AUTH-07** Ganti kredensial hardcoded dengan tabel `users` + password hash
- [x] **AUTH-08** Ubah password dari halaman **Keamanan**
- [x] **AUTH-09** Remember me + masa berlaku session yang jelas
- [ ] **AUTH-10** Audit log login (waktu, IP, user agent)
- [ ] **AUTH-11** Hapus atau integrasikan route Fortify yang tidak terpakai
- [ ] **AUTH-12** Pertimbangkan 2FA untuk akun admin

## 3. Admin Shell & UI

- [x] **UI-01** Layout admin dengan sidebar responsif + topbar
- [x] **UI-02** Navigasi: Beranda, Catatan, Pekerjaan
- [x] **UI-03** Dark mode toggle + persistensi tema
- [x] **UI-04** Flash message sukses
- [x] **UI-05** Palet indigo/fuchsia/sky, tombol solid tanpa gradient
- [x] **UI-06** Komponen dialog, input, label, button, spinner, input error
- [x] **UI-07** Empty state yang konsisten di setiap halaman
- [x] **UI-08** Command palette / quick capture (`Ctrl/Cmd + K`)
- [x] **UI-09** Keyboard shortcuts untuk aksi utama
- [ ] **UI-10** Audit aksesibilitas (fokus, label, kontras, navigasi keyboard)
- [x] **UI-11** Toast global (bukan hanya banner flash)
- [ ] **UI-12** Halaman 404/500 yang ramah

## 4. Dashboard

- [x] **DASH-01** Statistik: jumlah catatan, pekerjaan, dikerjakan, terlambat
- [x] **DASH-02** Daftar pekerjaan aktif (todo + in progress, urut tenggat)
- [x] **DASH-03** Distribusi status pekerjaan dengan progress bar
- [x] **DASH-04** Catatan terbaru (4 item)
- [x] **DASH-05** Sapaan + tanggal panjang bahasa Indonesia
- [x] **DASH-06** Empty state untuk pekerjaan aktif dan catatan
- [x] **DASH-07** Widget kebiasaan "1 Hari 1 Pengetahuan" + streak
- [x] **DASH-08** Grafik aktivitas 7/30 hari (catatan & pekerjaan selesai)
- [ ] **DASH-09** Widget 3 berita teknologi pilihan AI
- [x] **DASH-10** Ringkasan agenda: tenggat hari ini dan minggu ini
- [ ] **DASH-11** Quick actions: catatan cepat, pekerjaan cepat

## 5. Catatan (Notes)

- [x] **NOTE-01** CRUD catatan di `/admin/notes`
- [x] **NOTE-02** Field judul, isi Markdown, tag, dan pin
- [x] **NOTE-03** Pencarian judul/isi dengan debounce
- [x] **NOTE-04** Filter berdasarkan tag
- [x] **NOTE-05** Pin catatan + urutan pin di atas
- [x] **NOTE-06** Pagination 12 catatan/halaman
- [x] **NOTE-07** Tag disimpan sebagai JSONB, dinormalisasi (trim, unik, maks 10)
- [x] **NOTE-08** Halaman detail catatan `/admin/notes/{note}`
- [x] **NOTE-09** Render Markdown yang aman (GFM, code block, tabel)
- [x] **NOTE-10** Preview Markdown saat menulis
- [x] **NOTE-11** Tautan catatan ↔ pekerjaan (many-to-many)
- [x] **NOTE-12** Arsip / soft delete + restore
- [x] **NOTE-13** Auto-save draft ke localStorage
- [ ] **NOTE-14** Template catatan (harian, belajar, snippet)
- [ ] **NOTE-15** Full-text search PostgreSQL (tsvector) + fallback SQLite
- [ ] ~~**NOTE-16** Catatan publik / share link (opsional, read-only)~~ (pemakaian lokal saja, tidak dideploy)
- [x] **NOTE-17** Dialog detail catatan (pratinjau Markdown) dari daftar

## 6. Pekerjaan (Work Items)

- [x] **WORK-01** CRUD pekerjaan di `/admin/work-items`
- [x] **WORK-02** Field judul, deskripsi, status, prioritas, tenggat, tag
- [x] **WORK-03** Status: backlog, todo, in_progress, done
- [x] **WORK-04** Prioritas: low, medium, high, urgent
- [x] **WORK-05** Tab status dengan jumlah per status
- [x] **WORK-06** Filter prioritas + pencarian judul/deskripsi (debounce)
- [x] **WORK-07** Ubah status cepat dari daftar
- [x] **WORK-08** Indikator tenggat dan "terlambat"
- [x] **WORK-09** `completed_at` otomatis saat status `done`
- [x] **WORK-10** Pagination 15 item + empty state
- [x] **WORK-11** Kanban board dengan drag & drop
- [x] **WORK-12** Toggle tampilan list ↔ board
- [x] **WORK-13** Proyek / area + filter per proyek
- [x] **WORK-14** Subtask / checklist di dalam pekerjaan
- [x] **WORK-15** Tampilan kalender berdasarkan tenggat
- [ ] **WORK-16** Pekerjaan berulang (recurring)
- [ ] **WORK-17** Lampiran file pada pekerjaan
- [x] **WORK-18** Riwayat aktivitas pekerjaan
- [x] **WORK-19** Saved views / filter tersimpan
- [x] **WORK-20** Bulk action (ubah status/hapus beberapa item)
- [x] **WORK-21** Dialog detail pekerjaan dengan deskripsi Markdown ter-render

## 7. Pengetahuan & Produktivitas

- [x] **KNOW-01** Kebiasaan "1 Hari 1 Pengetahuan" + streak harian
- [x] **KNOW-02** Statistik pengetahuan: catatan/minggu, tag teratas
- [ ] **KNOW-03** Review harian/mingguan (catatan + pekerjaan)
- [ ] **KNOW-04** Target harian/mingguan yang bisa diatur
- [ ] **PROD-01** Quick capture global
- [ ] **PROD-02** Bookmark / reading list
- [ ] **PROD-03** Snippet / developer notes
- [x] **PROD-04** Pencarian global lintas catatan & pekerjaan
- [x] **PROD-05** Notifikasi in-app untuk tenggat
- [ ] ~~**PROD-06** Pengingat email / web push~~ (pemakaian lokal saja, tidak dideploy)
- [x] **PROD-07** PWA + mode offline baca
- [ ] ~~**PROD-07a** Baca catatan offline (cache data terautentikasi, bersihkan saat logout)~~ (pemakaian lokal saja, tidak dideploy)
- [x] **PROD-08** Export/import JSON & Markdown
- [ ] **PROD-09** Halaman pengaturan workspace

## 8. Berita Teknologi & AI

- [ ] **NEWS-01** Tabel sumber berita + konfigurasi RSS/API
- [ ] **NEWS-02** Command terjadwal `news:fetch` + queue job
- [ ] **NEWS-03** Deduplikasi artikel berdasarkan URL/hash
- [ ] **NEWS-04** Ringkasan artikel dengan AI (bahasa Indonesia)
- [ ] **NEWS-05** Pilih 3 berita terbaik per hari
- [ ] **NEWS-06** Widget berita di dashboard + halaman arsip
- [ ] **NEWS-07** Fallback saat AI/API gagal
- [ ] **NEWS-08** Log biaya/token AI
- [ ] **AI-01** Abstraksi provider AI (OpenAI/Anthropic/lokal)
- [ ] **AI-02** Asisten tanya-jawab atas catatan
- [ ] **AI-03** Embedding catatan + semantic search (pgvector)
- [ ] **AI-04** Ringkasan otomatis catatan panjang
- [ ] **AI-05** Cite source saat menjawab

## 9. Multi-Agent (produk)

> Ini fitur produk, bukan cara kerja antar coding agent. Eksekusi agent
> dijalankan oleh service terpisah; Laravel hanya control plane.

- [ ] **AGT-01** Tabel `agents` (nama, role, prompt, model, tools, enabled)
- [ ] **AGT-02** Tabel `agent_runs` (work_item, agent, status, input/output, token, biaya)
- [ ] **AGT-03** Tabel `agent_approvals` (human-in-the-loop)
- [ ] **AGT-04** Tabel `agent_artifacts` (diff, file, link)
- [ ] **AGT-05** Endpoint membuat run + dispatch job ke service eksternal
- [ ] **AGT-06** Webhook callback bertanda tangan untuk update status
- [ ] **AGT-07** UI memilih agent dan menjalankan dari work item
- [ ] **AGT-08** UI review hasil: approve / reject / minta revisi
- [ ] **AGT-09** Batas biaya, timeout, retry, dan pembatalan run
- [ ] **AGT-10** Audit log semua aksi agent

## 10. Kualitas & Observability

- [x] **QA-01** 127 test Pest lolos (995 assertion)
- [x] **QA-02** Test fitur untuk auth, catatan (termasuk detail), pekerjaan, dashboard
- [x] **QA-03** Format PHP dengan Pint
- [x] **QA-04** Lint JS dengan ESLint + format Prettier
- [x] **QA-05** Production build Vite berhasil
- [x] **QA-06** Test browser end-to-end (Playwright)
- [ ] **QA-07** Test aksesibilitas otomatis
- [ ] **QA-08** Logging terstruktur + error tracking
- [ ] **QA-09** Health check & monitoring uptime
- [ ] **QA-10** Query performance review + index tambahan
- [ ] **QA-11** Rate limit untuk aksi tulis
- [ ] **QA-12** Dokumentasi arsitektur & ADR

---

## Ringkasan progres

| Area | Selesai | Total |
| --- | ---: | ---: |
| Fondasi | 9 | 9 |
| Autentikasi | 9 | 12 |
| UI | 10 | 12 |
| Dashboard | 9 | 11 |
| Catatan | 14 | 16 |
| Pekerjaan | 19 | 20 |
| Pengetahuan & Produktivitas | 6 | 12 |
| Berita & AI | 0 | 13 |
| Multi-Agent | 0 | 10 |
| Kualitas | 6 | 12 |

**Total: 82 dari 127 item selesai.**

## Antrean berikutnya (urut, lokal dulu)

Fitur yang bisa dikerjakan tanpa layanan eksternal/AI:

1. QA-10 Query performance review + index tambahan
2. QA-12 Dokumentasi arsitektur & ADR
3. WORK-17 Lampiran file pada pekerjaan

Ditunda (butuh layanan eksternal/biaya token): NEWS-*, AI-*, AGT-*.

## Non-goals saat ini

- Deployment ke server produksi dan akses publik.
- Aplikasi multi-user, registrasi publik, atau role/permission kompleks.
- Kolaborasi real-time antar pengguna.
- Mobile native app.
- Menjalankan agent langsung di dalam proses Laravel.
- Fitur berita palsu/dummy di dashboard. Dashboard hanya menampilkan data nyata.
- Rewrite stack. Tetap Laravel + Inertia + React.

## Aturan update checklist

1. Ambil satu item dengan prioritas tertinggi yang dependensinya sudah selesai.
2. Ubah `[ ]` menjadi `[~]` saat mulai, dan `[x]` hanya setelah definition of done.
3. Jika item dipecah, tambahkan sub-item dengan ID baru (mis. `NOTE-11a`).
4. Jika item dibatalkan, jangan hapus; tandai `~~coret~~` dan tulis alasannya.
5. Perbarui tabel ringkasan progres setelah mencentang item.
