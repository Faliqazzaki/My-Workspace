# HANDOFF
Terakhir: 25 Nov 2026
Item: NOTE-13 (auto-save draft catatan) — SELESAI
File utama: resources/js/components/notes/note-editor-dialog.jsx,
  AGENT_CONTEXT.md, FEATURES.md
Status: draft judul/isi/tag tersimpan ke localStorage per catatan (atau `new`)
  dengan debounce 400ms, dipulihkan saat dialog dibuka lagi, dihapus setelah
  simpan sukses atau tombol Batal; Esc/overlay tetap menyimpan draft; akses
  localStorage dibungkus try/catch; check.sh hijau
Berikutnya: UI-09 (keyboard shortcuts untuk aksi utama) dari "Antrean berikutnya"
  FEATURES.md
