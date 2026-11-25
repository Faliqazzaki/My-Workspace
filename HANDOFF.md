# HANDOFF
Terakhir: 25 Nov 2026
Item: UI-11 bugfix (ToastProvider root & FlashToasts) — SELESAI
File utama: resources/js/app.jsx,
  resources/js/components/toast.jsx,
  resources/js/layouts/admin-layout.jsx
Status: ToastProvider dipindahkan ke app.jsx membungkus <App> agar useToast()
  dapat dipanggil di komponen halaman (/admin/work-items); jembatan flash→toast
  dipertahankan di AdminLayout lewat FlashToasts; check.sh hijau.
Berikutnya: AUTH-09 (remember me & masa berlaku session) dari antrean FEATURES.md
