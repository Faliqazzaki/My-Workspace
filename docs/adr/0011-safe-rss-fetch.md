# 0011 — Pengambilan RSS dengan validasi target

## Konteks
`news:fetch` mengambil feed dari URL yang dimasukkan pengguna. Tanpa pengaman,
IT bisa dipakai untuk SSRF terhadap jaringan lokal atau metadata cloud.

## Keputusan
Antarmuka `HostResolver` dipakai `FeedFetcher` untuk memeriksa alamat hasil
resolusi sebelum request. Loopback, privat, link-local, metadata, ULA, dan
IPv4-mapped privat ditolak. Redirect tidak diikuti otomatis: maksimal 3,
setiap tujuan divalidasi ulang. Timeout koneksi 5 dtk, total 10 dtk, ukuran
maksimal 2 MB, User-Agent tetap `MyWorkspace/1.0`. XML diparse dengan
`LIBXML_NONET` dan tanpa `LIBXML_NOENT`. Dedupe memakai `NewsUrl::hash()`
(normalisasi scheme/host, buang fragment dan parameter pelacak) dengan
`insertOrIgnore` pada `url_hash` unik.

## Konsekuensi
- Satu sumber gagal tidak menghentikan sumber lain; log hanya `source_id` dan
  status, bukan isi respons.
- `last_fetched_at` hanya berubah setelah pengambilan berhasil.
- Test memakai `Http::fake`, `Http::preventStrayRequests`, dan resolver palsu.

## Keterbatasan yang tersisa
Validasi terjadi sebelum request, jadi **DNS rebinding** masih mungkin: DNS
boleh berubah antara pemeriksaan dan koneksi. Redirect ke hostname yang
berubah menjadi privat juga hanya terdeteksi bila resolusi kedua mengembalikan
alamat privat. Pengamanan penuh memerlukan resolver yang dipakai langsung oleh
HTTP client (pinning alamat IP) atau proxy egress; belum diterapkan di sini.

## Status
Diterima (NEWS-02/NEWS-03).
