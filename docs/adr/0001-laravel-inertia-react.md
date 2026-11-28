# 0001 — Laravel + Inertia + React, tanpa rewrite

## Konteks
Starter kit Laravel sudah menyediakan Inertia dan React. Frontend dan backend
ingin tetap berada dalam satu aplikasi tanpa lapisan API terpisah.

## Keputusan
Tetap memakai Laravel 12 + Inertia v2 + React 19. Tidak rewrite ke Node/SPA
terpisah, dan tidak menambah endpoint REST untuk halaman admin.

## Konsekuensi
- Controller merender halaman lewat `Inertia::render` dan mengirim props.
- Mutasi memakai helper `router` Inertia; flash Laravel diubah jadi toast.
- Perubahan UI tidak memerlukan koordinasi deploy frontend terpisah.

## Status
Diterima (§19 `AGENT_CONTEXT.md`).
