# HANDOFF
Terakhir: 28 Nov 2026
Item: AI-01 Abstraksi provider AI — SELESAI
File utama: config/ai.php, app/Services/Ai/*, app/Providers/AiServiceProvider.php, app/Console/Commands/AiPingCommand.php, tests/Feature/AiProviderTest.php, docs/ai-setup.md, docs/adr/0010, .env.example, AGENT_CONTEXT.md §4/§5/§15.8, FEATURES.md
Status: default provider null (tanpa pengiriman data). OpenAiCompatibleProvider memakai Http client: Bearer, model/messages/max_tokens/temperature, timeout, retry 429/5xx terbatas; semua kegagalan jadi AiUnavailableException. Log hanya status + durasi; kunci API tidak di exception/log. ai:ping meminta konfirmasi karena memakai token.
Verifikasi: 12 test Pest dengan Http::fake + Http::preventStrayRequests lolos; check.sh hijau (pint/eslint/format/test/build). Tidak ada panggilan HTTP sungguhan ke penyedia mana pun. graphify update . dijalankan.
Bukan lingkup: tabel ai_usages (NEWS-08), embedding (AI-03), fitur pemanggil AI.
Berikutnya: WORK-17 Lampiran file pada pekerjaan dari antrean FEATURES.md.
