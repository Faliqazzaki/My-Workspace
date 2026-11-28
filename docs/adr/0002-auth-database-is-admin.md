# 0002 — Auth berbasis database dengan `is_admin`

## Konteks
Aplikasi personal hanya perlu satu akun admin. Fortify terpasang dari starter
kit, tetapi registrasi Fortify tidak boleh memberi akses ke area admin.

## Keputusan
Login memakai `Auth::attempt` dengan `username`, `password`, dan
`is_admin = true` di `AdminAuthController`. Grup `/admin` dilindungi middleware
`admin.auth` (`EnsureAdminAuthenticated`).

## Konsekuensi
- Akun dibuat oleh `AdminUserSeeder` dari `config/admin.php` (`ADMIN_*`).
- Login dibatasi `throttle:10,1`; sesi di-regenerate saat login/logout.
- Rute/settings Fortify tetap ada tetapi tidak terhubung ke UI admin.

## Status
Diterima (AUTH-07/08; §19 `AGENT_CONTEXT.md`).
