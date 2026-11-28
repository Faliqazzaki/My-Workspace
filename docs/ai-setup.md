# Setup provider AI (AI-01)

Secara default **tidak ada provider aktif** (`AI_PROVIDER` kosong), sehingga
tidak ada satu pun data yang dikirim keluar. Abstraksi hanya dipakai oleh fitur
yang secara eksplisit memanggil `App\Services\Ai\AiProvider`.

## Memilih penyedia

Saat ini yang didukung: `openai_compatible` — penyedia apa pun yang menyerupai
API chat OpenAI (OpenAI, atau layanan lokal/Proxy yang kompatibel). Anthropic
dan embedding tidak termasuk lingkup AI-01.

## Menyiapkan kunci dan batas pengeluaran

1. Buat API key di dashboard penyedia yang kamu pilih.
2. Di dashboard yang sama, atur **batas pengeluaran/budget** dan, bila tersedia,
   batas per permintaan. Ini langkah penting: aplikasi ini tidak punya
   pencatatan biaya sendiri (tabel `ai_usages` belum dibuat).
3. Simpan kunci hanya di `.env` lokal (file ini di-gitignore). Jangan commit,
   jangan kirim ke orang lain.

## Mengisi `.env`

Salin entri kosong dari `.env.example`, lalu isi sesuai penyedia:

```dotenv
AI_PROVIDER=openai_compatible
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=<kunci-dari-dashboard>
AI_MODEL=gpt-4o-mini
AI_TIMEOUT=30
AI_MAX_TOKENS=1024
AI_TEMPERATURE=0.2
AI_RETRY_MAX=2
AI_RETRY_DELAY_MS=250
```

`AI_TIMEOUT` dalam detik. `AI_RETRY_MAX` adalah jumlah percobaan ulang
**setelah** percobaan pertama, maksimal 3; jeda pendek hanya dipakai untuk
status 429 dan 5xx. Kosongkan `AI_PROVIDER` untuk mematikan lagi.

Setelah mengubah `.env`, jalankan `php artisan config:clear`.

## Menguji

```bash
php artisan ai:ping
```

Perintah ini **memakai token** dan mengirim satu prompt sangat singkat, lalu
meminta konfirmasi sebelum mengirim. Jawaban ditampilkan bila berhasil; bila
gagal, hanya pesan aman yang tampil (kunci API tidak pernah dicetak atau
dimasukkan ke log). Jangan jalankan perintah ini tanpa persetujuan pemilik
kunci.

## Peringatan privasi

Saat fitur yang memakai AI dijalankan, **isi catatan atau teks yang diringkas
akan dikirim ke penyedia** melalui HTTPS. Jangan mengaktifkan provider bila
catatanmu bersifat sensitif dan kamu tidak ingin meninggalkan perangkat ini.
Semua kegagalan dilempar sebagai `AiUnavailableException` agar pemanggil bisa
fallback tanpa halaman rusak.
