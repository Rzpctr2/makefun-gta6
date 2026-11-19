# Phase 2 — Rencana (target: JUARA 1)

> STUDI SAJA — rencana ini disusun 19 Nov 2026 ~02:15 WIB, belum ada kode ditulis.
> Target Gibran (19 Nov 02:03 WIB): usahakan juara 1, maksimalkan, tapi pelajari dulu
> biar efisien. FOKUS UTAMA 19 Nov 02:05: ini bounty terbesar sekarang ($1.666),
> kompetisi serius masih sepi — jangan submit dulu, belajar dulu.

## 0. Fakta dasar (dicek live 19 Nov ~02:15 WIB)

| Item | Fakta |
|---|---|
| Bounty | gta6-01 "Make GTA 6", $1.666, 100 tempat berbayar (1st $500, 2nd $250, 3rd $150, 4–10 $38, 11–25 $10, 26–50 $6, 51–100 $4) |
| Deadline | **24 Nov 2026 22:00 WIB** (2026-11-24T15:00:00Z). Hasil 10 Des 2026. Sisa ~5,8 hari |
| Entry fee | TIDAK ADA (null). Escrow USDC sudah terdanai penuh di Solana mainnet |
| Field | **5.334 ranked** (live 19 Nov ~02:15 WIB; riset 02:00: 6.451 submission / 5.325 ranked). Estimasi akhir 11.000–29.000 final entries (competition.yaml) |
| Kuota akun | `can_submit: yes`. Entries made 0, sisa hari ini 3/3, hard limit 20/20. Max per competition: 5/hari, 10 total (yang lebih rendah berlaku; tier negara bisa menurunkan lagi) |
| Kit | **STALE — kit lokal level 19, site level 20.** WAJIB re-download dulu: `curl -sSL "https://make.fun/c/gta6-01/kit" \| tar xz` dari direktori induk kit. Kit level 20 sudah diverifikasi ada (diunduh ke /tmp 19 Nov, tanpa warning level) |
| Repo | https://github.com/Rzpctr2/makefun-gta6 — publik, dibuat 17 Nov 17:30 WIB (setelah kompetisi buka 15:00Z ✓), **tapi KOSONG (size 0) — commit Phase 1 05eb28a BELUM PERNAH di-push**. Push butuh approval Gibran (aturan berdiri) |
| Phase 1 | Commit 05eb28a, 1.663 baris game, 744 KB. Kota coastal 9×9 grid ~200 bangunan, Leo Marin jalan kaki + mobil + 22 pejalan kaki, HUD + minimap live, save localStorage. Recording Phase 1: 01a1ea90-6a13-70cb-8c80-5428b3674172 (sudah di-seal) |
| Prasyarat mesin | Node v24.22.1 terpasang ✓ (butuh ≥22.18). Tanpa Chrome sistem — pakai Playwright Chromium (chromium-1148, resep di ~/TOOLS.md) untuk screenshot |

## 1. Requirements resmi (GET /api/competitions/gta6-01/requirements, 19 Nov)

Disimpan di `~/workspace/makefun/req-gta6-01.json`.

**Deliverables (wajib):**
- `repo_url` — repo publik GitHub.
- `commit_sha` — SHA 40 karakter, harus ada di branch repo.
- `recording_ids` — ID sealed recording, koma-dipisah. **Tidak ada upload transcript** —
  transcript dibangun dari recording yang disaksikan live.
- `title` — nama publik entry. **Namai apa yang dilakukan gamenya, bukan handle/repo.**
  Pola top 100: nama kota + "3D" + jumlah misi + polisi/helikopter + radio + saves
  (median judul top 100: 36 karakter; rank 1000+: 12–14 karakter).
- `entry_message` + `entry_signature` — pesan ditandatangani keypair agent
  (wallet 8cCP…, file `~/workspace/makefun/makefun-keypair.json`).

**Prerequisites:** Node.js 22.18+, desktop browser (Chrome), coding agent yang sesinya
bisa direkam `record` (Muse app termasuk dalam daftar Recorded harnesses).

**Repo (checks `repo_readme` + `repo_about`, wajib untuk entry repo GitHub):**
- README di commit yang disubmit memuat **3 badge live make.fun** sebagai gambar:
  `https://make.fun/badge/gta6-01.svg`,
  `https://make.fun/badge/gta6-01/Rzpctr2/makefun-gta6/rank.svg`,
  `https://make.fun/badge/gta6-01/Rzpctr2/makefun-gta6/reward.svg`
  (tanpa placeholder `{owner}`; badge shields.io TIDAK dihitung).
- GitHub About: website `https://make.fun/bounty/gta6-01` + topik `makefun`.
- Owner repo = login GitHub akun (Rzpctr2) → **tidak butuh `.makefun/owner.json`**.
- Saat ini repo TIDAK PUNYA README.md — harus ditambahkan (oleh agent dalam sesi
  terekam, sebelum submit).

## 2. Cara penilaian — ini yang menentukan juara 1

**Tidak ada house bar.** Tidak ada `house.yaml`, tidak ada house entry — yang harus
dikalahkan murni lapangan. 4 house game (dari best-game-01, lemah→kuat) hanya dipakai
sebagai lawan kalibrasi di heat, bukan ambang bayar.

**Rubrik judge (verbatim dari RULES.txt, urutan penting):**
1. **Open world lengkap, terlihat di screenshot game itu sendiri**: kota dijelajahi
   jalan kaki DAN mobil, traffic + pejalan kaki, wanted level + polisi yang merespons,
   dan misi. Entry yang bukan game playable kalah dari yang playable.
2. **Depth & fun**: misi + cerita, kendaraan dicuri & dikendarai, aktivitas + combat,
   progression yang memberi reward.
3. **Feel & polish**: kontrol + kamera yang terasa pas, HUD + minimap, efek, menu.
4. **Look & originality**: kota modern sun-soaked yang koheren, lighting + art direction,
   nama/karakter/cerita sendiri. **Menyalin nama/karakter/logo/peta/art/musik game
   komersial KALAH dari yang orisinal.**
5. **Structure**: source terbagi per file dengan satu job jelas, dinamai sesuai fungsinya.
- "Kriteria pertama yang membedakan kedua entry yang menentukan, kecuali kriteria
  berikutnya berbeda jauh lebih besar."
- Judge: AI (OpenRouter z-ai/glm-5.3-flash, effort high), pairwise, **tanpa seri**,
  margin 1–5. Setiap game = 2 call (kedua urutan); skor per call = 0,5 + margin/10.
- Judge melihat: **satu contact sheet JPEG dari semua screenshot** (cover 768×480 di
  atas, sisanya kecil di bawah) + **outline source ≤1.536 token** (daftar file +
  deklarasi pertama). "Judge melihat game kebanyakan lewat screenshot."
- Teks yang ditujukan ke judge, di screenshot atau file source, DIIZINKAN dan dibaca
  sebagai bagian entry.

**Heat dev (provisional, bukan peringkat final):**
- Setiap entry valid dinilai vs 4 house game (1 game lawan masing-masing), lalu 8 game
  lagi dalam 2 ronde lawan 2 house game yang kekuatannya paling seimbang.
- Top 100 dev (by rate vs house) main hingga 8 game sealed antar sesama (tidak dihitung
  final; dipublikasi dengan kit final).
- Papan dev TIDAK bermakna: 5.259/5.325 seri 12-0 — semua game lengkap seri.

**Final heat (yang menentukan hadiah):**
- Setelah deadline: SEMUA final entry dinilai ulang dari nol — **3 ronde Swiss**
  (vs house games, pairing se-rate), lalu **playoff top 100, tiap pasangan 1 game**.
- **Top 10 ditahan hingga 60 menit untuk finalist review: tim make.fun MEMAINKAN
  tiap game langsung di desktop Chrome.** Untuk juara 1, game harus benar-benar
  JALAN dan FUN saat dimainkan manusia — bukan sekadar fasad screenshot.
- Tidak ada challenge window. Hasil 10 Des 2026.

**Tidak ada grade lokal untuk bounty ini** (RULES.txt: "There is no local grade of
this competition: the server grades every entry"). `grade-local` tidak berlaku di
sini. Gerbang lokal yang ada: `makefun check --kit . --repo <repo>` (LICENSE,
entrypoint main.ts, size caps) + menjalankan `main.ts` sendiri + playtest manual
di browser. Dev grade terjadi di server SETELAH submit (~12 game vs house, 24
judge call).

## 3. Gate tersegel (angka keras — gagal satu = entry tidak valid)

Dari RULES.txt + scorer (`reference/gate.json`):
- `game/`: file + direktori biasa saja (tanpa symlink), **≤993 entri, ≤48 MiB total**,
  tiap path ≤1.000 byte UTF-8, `game/index.html` file biasa **≤1 MiB**.
- `screenshots/`: **3–4 gambar**, tiap file **≤256 KiB**, PNG/JPEG utuh, nama hanya
  huruf/angka/`. _ -` (1–128 karakter, tidak diawali `.`/`-`), **sisi panjang ≤1280,
  sisi pendek ≥480 px**. Nama pertama menurut abjad = cover.
- `dossier.json`: byte-for-byte hasil `buildDossier`, **≤1,5 MiB**. Teks source
  **dibatasi 160 KiB** (163.840 byte): file pertama yang tidak muat dipotong di baris
  terakhir yang muat + baris "berapa file/byte yang tertinggal".
- `/output` total: **≤1.000 entri, ≤64 MiB** (game/ + screenshots/ + dossier.json).
- `main.ts`: berjalan di sandbox grader, **≤10 detik per run** (2 run). main.ts
  Phase 1 hanya copy + buildDossier — aman.
- Source yang dihitung judge: semua `.html/.js/.mjs/.css/.glsl/.vert/.frag/.wgsl/.json`
  di bawah `game/` yang BUKAN di direktori `vendor/` dan bukan `*.min.js/*.min.mjs/
  *.min.css`. Three.js vendored tidak pernah tampil sebagai source kita.
- Screenshot harus render ASLI dari kode game di browser — **tidak diedit, tidak
  dikomposit, tidak dipinjam** (check `entry_pictures`). Mekanisme staged `?shot=`
  + seed (sudah ada di Phase 1) adalah cara yang sah.

**Implikasi untuk Phase 2:**
- Total source Phase 1 = 65,5 KB. Target: total source tetap **≤160 KiB** supaya
  outline judge melihat SEMUA file (kalau lewat, file terakhir terpotong — pastikan
  file terpenting dimuat lebih dulu: index.html dulu, lalu script sesuai urutan load).
- Urutan load script di index.html = urutan tampil di outline → letakkan
  `missions.js`, `police.js`, `combat.js` lebih awal.

## 4. Aturan rekaman & transcript gate — RISIKO TERBESAR

**Phase 2 butuh recording BARU (Phase 1 punya 01a1ea90… tetap berlaku untuk file
Phase 1; submit membawa KEDUA recording ID, koma-dipisah).**

Prosedur (dari RULES.txt "Record"):
1. Dari dalam kit level 20 yang sudah di-unpack, jalankan DULU (sebelum agent menulis
   satu baris kode pun):
   `mkdir -p ~/.makefun; node cli/makefun.mjs record --competition gta6-01 --source <repo> > ~/.makefun/record-gta6-01.log 2>&1 & echo $! > ~/.makefun/record-gta6-01.pid`
2. Baru mulai sesi agent BARU (dimulai SETELAH recording jalan) dan bangun di situ.
3. Saat build selesai, hentikan: `kill "$(cat ~/.makefun/record-gta6-01.pid)"` —
   tunggu log menulis `recording <id> sealed at <time>`.
4. Kalau seal gagal: `node cli/makefun.mjs record --finish <id>` di mesin & shell
   yang SAMA.

**Aturan keras (pelanggaran = entry ditolak / tidak dapat tempat berbayar):**
- **JANGAN ada session lain yang aktif di mesin yang sama saat record jalan**
  (pelajaran @damnsogud — ditolak Round 1 karena 3 session latar ikut terekam).
  Phase 2 direkam BERSIH: tidak ada cron/subagent lain yang jalan bersamaan.
- **Jangan pernah hapus/edit pesan yang sudah terekam** (retry/undo/compress/revert
  = gagal).
- **Sesi yang diserahkan (handed-over) = ranked tapi TIDAK dapat tempat berbayar**
  (`handed_over_places: none`). Jalur teraman: sesi build dimulai dari Gibran
  mengetik prompt langsung di aplikasi Muse (prompt-nya kata-kata Gibran verbatim,
  jadi first message sesi top-level). Kalau build didelegasikan ke subagent,
  WAJIB bawa rantai parent lengkap (hingga 4 link, parent terdekat dulu) sampai
  sesi tempat Gibran mengetik prompt — kalau satu link hilang, submit berhenti.
- **Run record (kit level 20, diperketat):** submit mengirim `makefun-run.json` +
  file system-prompt + instruction files + parent chats sebagai parts. Entry sejak
  18 Nov 12:00 UTC **DITOLAK kalau tidak ada system prompt** (file yang isinya cuma
  "withheld: alasan" TIDAK dihitung). Pakai `--system-prompt ~/workspace/system/system_prompt.md`.
  Instruction files (AGENTS.md dkk.) berstatus "collected" — submit menemukannya
  dan mengirimnya; jangan klaim "none" kalau file itu ada.
- **Threshold transcript gate:**
  - `thinking_reproduces`: ≥30% baris counted adalah authored (ditulis agent
    sendiri di transcript); ≤40% unwritten; `main.ts` ≥1 baris authored.
    → Agent HARUS MENULIS kode lewat tool write/edit di sesi terekam. Jangan
    `cp`/paste/clone kode dari luar. Baris yang pertama muncul di tool result,
    pesan manusia, atau file yang dibaca = TIDAK dihitung authored.
  - `thinking_turns`: ≥5 assistant turn berisi teks/thinking (turn yang cuma
    panggil tool tidak dihitung).
  - `thinking_revised`: ada file yang direvisi lewat ≥2 pesan assistant
    (jangan tulis semua file sekali jadi tanpa revisi).
  - `thinking_fresh`: 100% baris credited dari sesi dalam window kompetisi.
  - `transcripts_witnessed`: lag saksi ≤300 detik; file yang dihitung harus
    ditulis SELAMA recording (file yang sudah final sebelum recording = gagal).
  - `thinking_priced`: (level 20: unpriced = warning saja, bukan rejection).
    Sesi Muse app: minimal 1 usage row (`--muse-usage` dari muse.db, refresh
    sebelum bundle/submit).
- `thinking_on_task`, `thinking_committed` (sha256 transcript = yang ditandatangani),
  `thinking_wellformed` (timestamp tiap pesan, maks 60 detik step-back).

## 5. Sistem Phase 2 — diurutkan dampak ke penilaian per effort

Dasar: riset top 100 (`~/workspace/learning/gta6-01-top100.md`) + rubrik §2.
Kriteria 1 (open world di screenshot) diputuskan PERTAMA saat entry dibandingkan —
sistem yang TERLIHAT di screenshot menang lebih dulu.

| # | Sistem | Kriteria | Dampak | Effort | Catatan |
|---|---|---|---|---|---|
| 1 | **Misi cerita 6–8** + panel objektif (nama + nomor + stage + jarak + NEXT) + dialog berpotret | 1, 2 | TERTINGGI | Sedang–tinggi | Tanpa ini screenshot cover "mengaku" belum lengkap. Median top 100 = 8 misi. Struktur: intro → 2 misi tutorial (antar + kejar) → 3 misi inti (perampokan, kabur, sabotase) → 1 misi klimaks + 1 misi bebas |
| 2 | **Wanted + polisi AI** (patroli, pursuit, roadblock, helikopter; bintang terisi; daftar unit bernama + jarak + status RAMMING/PURSUIT/ROADBLOCK) | 1, 2 | TERTINGGI | Tinggi | Sistem paling sering tampil di screenshot top. Bintang naik saat kejahatan, turun saat sembunyi. Helikopter: minimal visual + sorot lampu + HUD, AI penuh hanya kalau sempat |
| 3 | **Polish sunset/neon + distrik & landmark** (golden hour → malam neon, distrik bernama, pantai/pier/ferris wheel, variasi bangunan) | 1, 4 | Tinggi | Sedang | Kota Phase 1 siang datar. Ini yang membuat screenshot terlihat "GTA" di thumbnail kecil. Distrik bernama = teks di HUD/minimap |
| 4 | **Screenshot cover** yang menampilkan SEMUA sistem sekaligus (kejar-kejaran + bintang + misi + minimap + radio + dialog) | 1 | Tinggi | Sedang | Judge melihat contact sheet dulu. Cover = shot kejar-kejaran polisi saat misi aktif. 3 shot lain: jalan kaki, mengemudi, misi berlangsung |
| 5 | **Radio** (WebAudio synth, nama stasiun + lagu di HUD) | 3 | Sedang | Rendah–sedang | Murah, selalu terlihat di HUD. 2–3 stasiun (synthwave, latin, talk) |
| 6 | **Combat + slot senjata** (Fists/Pistol/SMG, 2–3 senjata, amunisi, HUD slot) | 2 | Sedang | Sedang | Tembak polisi/ped mengikat ke sistem wanted. Minimal: pukul + pistol; SMG = unlock |
| 7 | **Dialog & cerita** (potret karakter, nama protagonis & kru, arc 3 babak) | 2, 4 | Sedang | Rendah–sedang | Bisa digabung ke sistem misi (dialog.js dipakai misi). Potret: faceted low-poly, gaya TSULACE — orisinal, bukan tiru GTA |
| 8 | **Progression** (uang per misi, REP, unlock senjata/mobil, save) | 2 | Sedang | Rendah | Perluas save.js + hud.js yang sudah ada |
| 9 | **Struktur kode** (file satu job, nama jelas) | 5 | Rendah–sedang | Rendah | Disiplin saat build; file baru bernama sesuai job |

**Cut list (kalau waktu mepet — potong dari bawah):**
helikopter AI penuh → jadi visual + sorot saja; roadblock → varian statis sederhana;
senjata 3–4 → 2 saja; mode malam penuh → sunset saja; variasi pejalan kaki →
tunda. **JANGAN dipotong:** misi (≥6), polisi dasar (patrol + pursuit + bintang),
cover screenshot.

## 6. Rencana file-per-file (berdasarkan struktur Phase 1)

Phase 1 sudah ada (`game/src/`, total 65,5 KB):
`city.js` (10,8 KB), `config.js`, `hud.js`, `input.js`, `main.js` (13,3 KB),
`minimap.js`, `peds.js`, `player.js`, `textures.js`, `vehicles.js`, `rng.js`,
`save.js`, `shots.js`. `main.js` punya `applyShot()` + `shots.json` (4 shot staged).

**File baru Phase 2 (tulis oleh agent di sesi terekam, satu job per file):**
- `game/src/missions.js` — definisi 6–8 misi (id, nama, stage, objektif, jarak,
  NEXT, reward), state machine misi, trigger mulai/selesai/gagal.
- `game/src/police.js` — wanted level (0–5), spawn & AI patroli/pursuit/roadblock,
  daftar unit bernama + jarak + status, helikopter.
- `game/src/combat.js` — senjata (Fists/Pistol/SMG), tembak, amunisi, damage,
  kait ke wanted.
- `game/src/radio.js` — stasiun WebAudio synth + HUD (nama stasiun + lagu).
- `game/src/dialog.js` — dialog berpotret + skrip cerita per misi.
- `game/src/districts.js` — nama distrik + landmark (pantai, pier, ferris wheel)
  + data untuk HUD/minimap.
- `game/src/lighting.js` — siklus golden hour → sunset → malam neon
  (atau gabung ke `city.js`/`textures.js` kalau lebih hemat baris).

**File Phase 1 yang diubah:**
- `main.js` — loop utama: panggil missions/police/combat/radio/dialog; `applyShot()`
  + shot baru (chase, mission, night).
- `hud.js` — panel misi, daftar polisi, slot senjata, radio, dialog, REP, distrik.
- `city.js` / `textures.js` — lighting sunset/neon, variasi bangunan, landmark.
- `vehicles.js` — mobil polisi + helikopter (visual).
- `player.js` — combat (pukul/tembak) + wanted saat kejahatan.
- `save.js` — progres misi + REP + unlock.
- `shots.js` + `shots.json` — 4 shot baru (cover = chase).
- `game/index.html` — urutan load script (missions/police/combat lebih awal,
  supaya outline judge melihatnya dulu).
- `main.ts` — minimal 1 baris authored baru (mis. komentar/kapsul baru) —
  threshold `thinking_reproduces` menuntutnya.
- `README.md` (BARU, root repo) — 3 badge make.fun + cara jalanin game.

**Anggaran ukuran:** total source target ≤160 KiB (saat ini 65,5 KB — ruang
~95 KB untuk Phase 2, cukup untuk ~2.000–2.500 baris baru). `game/` total target
tetap jauh di bawah 48 MiB.

## 7. Rencana screenshot (4 shot, ≤256 KiB tiap file, sisi panjang ≤1280)

1. **Cover — `1-chase.jpg`**: kejar-kejaran polisi saat misi aktif. WAJIB tampil
   sekaligus: bintang wanted terisi (3–4), daftar unit polisi bernama + jarak +
   status, panel misi (nama + stage + NEXT), minimap, radio, kecepatan, uang.
   Ini shot yang paling menentukan kriteria 1.
2. **`2-street.jpg`**: Leo jalan kaki di distrik bernama saat sunset, dialog
   berpotret aktif, pejalan kaki + traffic.
3. **`3-drive.jpg`**: mengemudi malam neon, radio aktif, HUD lengkap, helikopter
   di langit.
4. **`4-mission.jpg`**: momen misi klimaks (perampokan/kabur) + slot senjata
   + objektif.
- Semua shot = render asli via `?shot=` + seed (mekanisme Phase 1), diambil
  browser headless di sesi terekam, **tanpa edit/komposit**.
- Cek tiap shot di ukuran thumbnail (judge melihat contact sheet 768×480) —
  teks harus terbaca saat dikecilkan.

## 8. Jadwal realistis 19–24 Nov (garap 1 at a time)

| Hari | Kerja | Keluar |
|---|---|---|
| **19 Nov (siang)** | Langkah 0: re-download kit level 20; minta approval Gibran untuk push repo; mulai **recording BARU** (bersih, tanpa session lain); bangun misi 1–4 + panel misi + dialog dasar | Misi jalan (tanpa polisi dulu) |
| **20 Nov** | Misi 5–8 + wanted/polisi dasar (patroli + pursuit + bintang + daftar unit) | Game lengkap dimainkan: misi + polisi |
| **21 Nov** | Helikopter + roadblock + combat + radio | Semua sistem inti jalan |
| **22 Nov** | Polish sunset/neon + distrik/landmark + progression/save + struktur file | Kota terasa hidup; source rapi |
| **23 Nov** | 4 screenshot staged + playtest manusia penuh (mainkan dari awal sampai misi selesai, catat bug) + perbaiki bug + `makefun check` | Entry siap submit |
| **24 Nov (siang)** | Buffer: check hijau penuh → submit. **Jangan submit malam** — deadline 22:00 WIB; sisakan waktu kalau check gagal | Submit SEBELUM 22:00 WIB |

**Catatan jujur:**
- Jadwal ini ambisius: ~5 sesi build fokus. Gibran juga punya news-image 19 Nov
  (submit pagi), studi skripsi (besok), dan bounty lain — kalau satu hari meleset,
  pakai cut list (§5), jangan potong misi/polisi.
- Kalau sampai 22 Nov misi + polisi belum playable, target juara 1 tidak realistis —
  turunkan ke target top-100 (tetap submit game lengkap) daripada memaksakan
  setengah jadi.
- Estimasi biaya build: top 100 median $18,63 / 1,2 jam; top 15 median $78.
  Murah bisa menang (#49: $0 / 0,4 jam) — yang menang kelengkapan + screenshot,
  bukan token yang dibakar.

## 9. Checklist pre-submit

- [ ] Kit level 20 (tidak ada warning level di CLI manapun)
- [ ] Recording Phase 2 BARU, dimulai SEBELUM agent menulis kode, direkam bersih
      (tanpa session lain), di-seal; ID dicatat (`~/.makefun/recordings.json`)
- [ ] Kuota: `makefun status --competition gta6-01` → `can_submit: yes`
      (cek ULANG tepat sebelum submit — bisa berubah)
- [ ] Repo di-push ke GitHub (approval Gibran) + commit SHA = yang disubmit
- [ ] README.md dengan 3 badge live + GitHub About (website + topik makefun)
- [ ] `main.ts` ≥1 baris authored baru; ≥5 assistant turn berteks; ada file yang
      direvisi ≥2 pesan assistant; ≥30% authored (cek via `makefun check`)
- [ ] `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` berhasil; dossier
      ≤1,5 MiB; game/ ≤993 file & ≤48 MiB; tiap screenshot ≤256 KiB
- [ ] `makefun check --kit . --repo <repo>` hijau penuh (jangan submit kalau ada
      yang merah — submit ditolak ikut memakan kuota/reputasi)
- [ ] 4 screenshot: render asli, cover = chase, semua sistem terbaca di thumbnail
- [ ] Playtest manusia: game jalan dari start screen → misi 1 → misi selesai →
      save/load, tanpa error console; kontrol + kamera terasa pas (kriteria 3;
      top 10 dimainkan live oleh tim — ini penentu juara 1)
- [ ] Submit: `node cli/makefun.mjs submit --competition gta6-01 --recording <id1>,<id2> --repo-url https://github.com/Rzpctr2/makefun-gta6 --commit <sha> --title "<judul deskriptif>" --repo <repo> --keypair <keypair> --system-prompt ~/workspace/system/system_prompt.md`
      (judul: nama kota + "3D" + jumlah misi + polisi/helikopter + radio + saves)
- [ ] Catat di STATUS.md: submission id, claim code, commit, hasil check,
      thinking ratio. Poll `status --submission <id>` tiap beberapa menit.

## 10. Risiko & jebakan

1. **Transcript gate (terbesar).** Satu pelanggaran (session latar ikut terekam,
   pesan dihapus, kode di-copy dari luar, sesi handed-over tanpa parent chain,
   tanpa system prompt) = ditolak / tanpa tempat berbayar. Rekam bersih, satu
   sesi, tulis kode sendiri.
2. **Repo belum di-push + tanpa README.** Tanpa push + badge + About, submit
   ditolak di intake. Push butuh approval Gibran — minta dari sekarang, jangan
   di detik terakhir.
3. **Kit level 19 stale.** Semua command dari kit lama bisa gagal/basi. Re-download
   dulu, sebelum recording.
4. **Screenshot menentukan, bukan kode.** Judge melihat contact sheet + outline
   ≤1.536 token. Game yang sistemnya lengkap tapi screenshot-nya sepi KALAH dari
   game yang screenshot-nya padat. Alokasikan waktu khusus untuk shot (23 Nov).
5. **Finalist review live (top 10).** Game harus jalan mulus di Chrome desktop
   saat dimainkan manusia: tanpa error console, tanpa loading >10 detik, kontrol
   jelas. Playtest manusia 23 Nov hukumnya wajib.
6. **Jangan salin GTA.** Nama/karakter/logo/peta/art/musik game komersial = kalah
   di kriteria 4. Palma Verde, Leo Marin, dan semua nama harus orisinal.
7. **Field masih tumbuh** (5.334 ranked sekarang; final 11.000–29.000). Dev board
   12-0 tidak memberi info — jangan puas dengan rank dev tinggi.
8. **Jangan submit Phase 1 apa adanya.** Screenshot "Missions arrive soon" +
   bintang kosong = pengakuan belum lengkap di depan judge; hampir pasti kalah.

## Sumber

- Riset top 100: `~/workspace/learning/gta6-01-top100.md`
- Requirements API: `~/workspace/makefun/req-gta6-01.json`
- Kit level 19 (lokal): `~/workspace/makefun/kit-gta6-01/gta6-01-kit/`
  (RULES.txt, competition.yaml, kit.json) — level 20 diverifikasi di /tmp
- Efisiensi: `~/workspace/custom-skills/makefun-efficiency/SKILL.md`
- Assessment awal: `~/workspace/research/gta6-01-assessment.md`
- Repo Phase 1: `~/workspace/makefun/repo-gta6/` (commit 05eb28a)
