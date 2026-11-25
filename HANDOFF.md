# HANDOFF
Terakhir: 25 Nov 2026
Item: UI-11 (toast global) — SELESAI
File utama: resources/js/components/toast.jsx,
  resources/js/layouts/admin-layout.jsx,
  app/Http/Middleware/HandleInertiaRequests.php,
  resources/js/pages/admin/work-items/index.jsx
Status: ToastProvider membungkus layout admin; useToast() menyediakan
  success/error/info; flash Laravel (success/error/info) otomatis tampil
  sebagai toast; maks 4 toast, auto-dismiss 5 detik, tombol tutup, aria-live;
  kegagalan ubah status Kanban memakai toast; check.sh hijau
Berikutnya: DASH-10 (ringkasan agenda) dari "Antrean berikutnya" FEATURES.md
