# BUILD BRIEF — Palma Verde Phase 2 (gta6-01, target JUARA 1)

> **BACA FILE INI DULU sebelum menulis satu baris kode pun.** Ini satu-satunya
> dokumen yang perlu dibaca sesi build pagi 19 Nov. Semua yang ada di sini
> adalah KEPUTUSAN FINAL dari 6 studi semalam — jangan buka ulang file studi
> saat build (buang token + waktu). `PHASE2-PLAN.md` tetap jadi referensi
> untuk angka gate, perintah submit, dan checklist lengkap; file studi lain
> hanya latar belakang.
>
> Sumber yang disintesis: `PHASE2-PLAN.md` (rencana master) ·
> `gta6-cut-the-corner.md` (strategi top 20) ·
> `gta6-halcyon-architecture.md` (bedah arsitektur top 5) ·
> `gta6-top20-repos.md` (temuan repo) · `gta6-game-design.md` (desain game) ·
> `gta6-threejs-patterns.md` (pola Three.js).
>
> Aturan kerja sesi build: **satu sistem sampai playable sebelum buka sistem
> berikut. Game harus submittable di tiap akhir hari mulai hari ke-2.**

## 0. Fakta dasar (dicek live 19 Nov)

- Bounty gta6-01 "Make GTA 6", **$1.666**, 100 tempat berbayar (1st $500).
  **Deadline 24 Nov 2026 22:00 WIB. Submit 24 Nov SIANG.** Hasil 10 Des.
- Field: 5.334 ranked (19 Nov ~02:15); estimasi akhir 11.000–29.000 entry.
  Papan dev tidak bermakna (top 6 seri 12-0, interval rank #1 = 1–4.446).
  Yang menentukan: **final heat** (3 ronde Swiss + playoff top 100, judge
  pairwise dari contact sheet screenshot + outline source) dan **finalist
  review top 10** (tim make.fun MEMAINKAN game langsung di Chrome).
- Kuota: `can_submit: yes`, 0 entry, 3/3 hari ini, 20/20 hard limit.
  Cek ulang tepat sebelum submit — bisa berubah.
- Kit: lokal sudah di-upgrade ke **level 20** semalam — verifikasi dengan
  satu run CLI (tidak boleh ada warning level) SEBELUM recording.
- Repo: https://github.com/Rzpctr2/makefun-gta6 — publik, kosong di GitHub,
  commit Phase 1 `05eb28a` belum pernah di-push. Push butuh approval Gibran.
- Phase 1 (sudah ada, 70,8 KiB / 72.551 byte): kota coastal 9×9 grid ~200 bangunan, Leo
  Marin jalan kaki + mobil + 22 pejalan kaki, HUD + minimap live, save
  localStorage, `applyShot()` + `shots.json`. Recording Phase 1:
  `01a1ea90-6a13-70cb-8c80-5428b3674172` (sudah di-seal; submit membawa
  KEDUA recording ID).
- Jatah token: 12,5% ≈ 500 juta (estimasi kebutuhan Phase 2 hanya puluhan
  juta). Kendala BUKAN token — kendalanya **5 sesi build + transcript gate**.

## 1. Target & non-negotiables

0. **Prinsip Gibran (19 Nov 03:19): anggap ini MEMBUAT GAME, bukan cuma
   bounty.** Patokannya kualitas game-nya sendiri — apakah enak dimainkan,
   apakah terasa seperti game beneran — bukan sekadar rubric. Kalau "menang
   rubric" dan "game yang bagus" bertabrakan, pilih game yang bagus.
   **Benchmark = GTA San Andreas (19 Nov 03:29).** Yang diukur adalah
   seberapa dekat game ini dengan SA — top 3 bounty itu kompetitor yang
   harus dikalahkan, SA itu standar yang harus didekati.
1. **JUARA 1.** Bukan "yang penting submit". Setiap keputusan di bawah ini
   ditimbang terhadap dua hal: menang perbandingan screenshot, dan lolos
   dimainkan manusia.
2. **Transcript gate (5 baris — langgar satu = ditolak / tanpa tempat berbayar):**
   (a) recording BARU dimulai SEBELUM satu baris kode ditulis, direkam
   BERSIH (tanpa session/subagent/cron lain di mesin yang sama);
   (b) semua kode ditulis lewat tool write/edit DI sesi terekam — tidak
   ada `cp`/paste/clone dari luar, tidak ada kode dari repo pemenang;
   (c) ≥30% baris counted adalah authored, `main.ts` ≥1 baris authored,
   ≥5 assistant turn berteks, ada file yang direvisi ≥2 pesan;
   (d) sesi dimulai dari prompt ketikan Gibran sendiri (first message sesi
   top-level) — sesi handed-over = ranked tapi TIDAK dapat tempat berbayar;
   (e) submit pakai `--system-prompt ~/workspace/system/system_prompt.md`
   + `--muse-usage` yang di-refresh sebelum bundle/submit.
3. **Total source ≤160 KiB (163.840 byte).** Phase 1 70,8 KiB (72.551 byte,
   terukur — bukan 65,5 KB seperti tertulis lama; index.html 4.974 byte
   ikut dihitung) → sisa ~91 KB untuk Phase 2.
   **Kenapa ini keunggulan:** repo #1 (704 KB) dan #4 (391 KB) SAMA-SAMA
   melewati cap — outline judge mereka TERPOTONG. Outline kita dilihat
   SEMUA. Jaga total tetap ≤160 KiB; kalau mendekati cap, potong komentar
   dulu (GRATIS — komentar bukan deklarasi, tidak menghilangkan satu baris
   outline pun), lalu race, lalu misi 3.
   **KOREKSI (studi 19 Nov 03:45): tuas urutan outline BUKAN tag script di
   `index.html`** — index.html kita hanya punya SATU module script
   (`src/main.js`). Urutan dossier setelah index.html adalah **DFS walk
   atas static import dari main.js**. Supaya missions/police/combat tampil
   di depan, `main.js` harus mengimpor mereka paling awal. Setiap file
   source WAJIB terjangkau dari main.js; sistem di balik dynamic `import()`
   tidak terlihat outline. Deklarasi pertama `main.js` saat ini generik
   semua (`params`, `seed`, `shot`, `canvas`...) — pindahkan perakitan
   sistem (const `city`/`player`/`traffic`/…) ke atas, sebelum parsing
   params/seed/shot.
4. **Tampilan San Andreas, isi orisinal.** Sun-soaked, golden hour, palm
   tree, distrik ala Los Santos, malam neon — tapi SEMUA nama/tokoh/tempat
   orisinal (Palma Verde, Leo Marin, Nadia Sol, Kiko, Ilsa Maren). Menyalin
   nama/karakter/art/musik game komersial = KALAH di kriteria 4.
5. **Dua game harus menang.** Screenshot (judge AI) DAN live play (manusia).
   Fasad HUD di atas game rusak = kalah dua kali. Core loop harus JALAN:
   misi → kejahatan → wanted → kejar-kejaran → kabur → hadiah.
6. **Sistem yang tidak terlihat di screenshot = tidak dinilai.** Setiap
   sistem baru WAJIB bisa di-`applyShot()` — kalau tidak bisa dipaksa ke
   state tampil di cover, jangan dibangun.

## 2. Daftar fitur final — urutan build (jangan diubah urutannya)

| # | Sistem | Pola yang dipakai | File | Anggaran |
|---|---|---|---|---|
| 1 | **Radio + SFX** | Stasiun = data `{name, genre, color, bpm, root, scale, chords}`; judul lagu dari step count (tanpa state playlist); scheduler look-ahead 25 ms / 0,15 dtk; 1 fungsi schedule, 3 cabang pola; lazy `AudioContext` HANYA dari gestur. **SFX tinggal di radio.js** (4 helper bersama + 1 buffer noise 2 dtk, 18 suara, ~190 baris; hari-1: klik UI, statis, mesin, sting misi, blip — hari-2: sirene, sting wanted/busted, tembakan, thud; **guard wajib: semua sfx.play() no-op kalau !ctx** — tanpa gestur, `?shot=` headless error dan screenshot rusak; sumber: `gta6-procedural-sfx.md`) | `radio.js` (baru) | ~370 baris / ~15 KB |
| 2 | **Dialog** | Overlay DOM + potret SVG faceted (palet TSULACE); typewriter 2 karakter/frame, Enter/klik = skip; misi dijeda selama dialog; 2–4 baris per misi (intro + tengah + selesai) | `dialog.js` (baru) | ~150 baris / ~6 KB |
| 3 | **Mesin misi + misi 1–3** | Misi = data, satu runner kecil (lihat §3). `stageProgress()` hanya hitung stage yang dihadapi pemain → HUD `{stage, total, next}` | `missions.js` (baru) | ~350 baris / ~14 KB (mesin + 8 misi + race) |
| 4 | **Wanted + polisi dasar** | Heat float 0–100 + tabel kejahatan; `witnessed()` (saksi + line of sight); pool 8 unit, call sign deterministik; pursuit = intersepsi + `Car.drive()`; `describeResponse()` on-demand untuk HUD | `police.js` (baru) | ~350 baris / ~14 KB |
| 5 | **Sunset/neon + distrik** | Lerp warna DirectionalLight + fog + emissive (0 draw call baru); 6 distrik bernama, varian palet; 2 landmark; banner distrik saat masuk | `districts.js` (baru) + `lighting.js` (baru, atau gabung ke `city.js`/`textures.js` kalau lebih hemat) | ~250 baris / ~10 KB |
| 6 | **Combat minimal** | Hitscan + tabel senjata + pool tracer; Fists + Pistol; SMG LOCKED sampai misi 5 selesai; tiap hit → `police.addHeat(30)` | `combat.js` (baru) | ~200 baris / ~8 KB |
| 7 | **Misi 5–8** | Data saja — mesin sudah ada, tambah entri (lihat §3). Misi 4: stage combat-nya baru aktif setelah combat (langkah 6) jadi | `missions.js` (tambah data) | ~0 baris kode baru |
| 8 | **Helikopter visual + roadblock + respray** | Heli: 1 Group (badan + rotor + cone sorot transparan — BUKAN SpotLight asli), hover 40 m, muncul ≥4 bintang. Roadblock: 2 unit parkir melintang 80 m di depan pemain, ≥3 bintang, statis. Respray "Fresh Coat" $150: satu interaksi, wanted → 0 | `police.js` + `vehicles.js` + `player.js` (edit) | ~80 baris / ~3 KB |
| 9 | **Pause 1 tab + % COMPLETE + save** | Pause SATU tab: peta + grid progres + % COMPLETE + statistik hidup. `% COMPLETE = 10% per misi cerita (80%) + race menang 10% + 5 kali lolos wanted 10%`. Save diperpanjang: misi + REP + uang + unlock + statistik | `hud.js` + `save.js` (edit) | ~100 baris / ~4 KB |
| 10 | **Race (side job)** | Entri di data MISSIONS, tipe `race`, repeatable. Checkpoint = stage `reach` dengan gate neon (beacon beda warna). 2 rival = mobil traffic yang diarahkan ke waypoint sama. Hadiah $1.000 | `missions.js` (tambah data + ~40 baris) | ~40 baris / ~2 KB |
| 11 | **HUD diperpanjang** | Panel misi (nama + nomor + stage + jarak + NEXT), daftar unit polisi (maks 5 baris, hitung 4×/detik, tulis DOM hanya saat string berubah), slot senjata, radio, REP, banner distrik, jam/hari. Layout 4 sudut + tengah (pinjam dari #1). Teks HUD ≥14px pada render 1280px, kontras ≥4,5:1 | `hud.js` (edit) + `minimap.js` (titik polisi + objektif + zona pencarian + rute GPS) | ~150 baris / ~6 KB |
| 12 | **Orkestrasi + shot** | `main.js`: panggil `update()` tiap sistem di loop; `applyShot()` diperpanjang (semua state baru bisa dipaksa); `shots.js` + `shots.json`: 4 shot baru. `main.ts`: ≥1 baris authored baru. `main.js`: urutan import (§1.3). `README.md` (BARU, root repo): 3 badge make.fun + cara jalanin game | `main.js`, `shots.js`, `index.html`, `main.ts`, `README.md` | ~60 baris / ~2,5 KB |

**Total baru: ~2.670–3.020 baris ≈ 109–119 KB → total ~179–189 KB (margin ~-19 sampai -29 KB — LEWAT CAP di atas kertas).** Tambahan sejak sintesis awal: aturan feel SA ~150–170 baris (§5b), SFX ~190 baris, retune mengemudi ~90 baris baru (§5c), juice Tier 1 ~150 baris (§5d), title screen ~240 baris (§5e), traffic/peds wajib ~69 baris (§5g), instancing ~100–150 baris (§5i — PRASYARAT, bukan optimasi). **Koreksi basis (studi 19 Nov 03:45): Phase 1 terukur 70,8 KiB, bukan 65,5 KB — total di atas sudah memakai basis yang benar.**

**KEPUTUSAN PILAH (Gibran, 19 Nov 13:05 WIB): JANGAN POTONG DULU — PADATKAN DULU.** Terukur 19 Nov 13:05: komentar + baris kosong di `game/src` Phase 1 = **11.328 byte (~11,3 KB)** yang bisa dipangkas — nol biaya skor, karena komentar TIDAK terlihat di outline penjurian (judge cuma lihat nama file + deklarasi). Strategi: (1) pangkas komentar/blank Phase 1 saat file-file itu diedit di sesi Phase 2 (wiring/distrik/garis pantai memang menyentuh file-file itu); (2) tulis semua kode Phase 2 dengan gaya ringkas dari awal — format rapat, komentar minimal (hemat ~10% dari estimasi baru); (3) data-driven + helper bersama tetap jadi kompresi utama (8 misi = data + 1 runner, 18 SFX dari 4 helper). Estimasi baris meleset ±30–50%, jadi selisih di atas kertas belum tentu nyata — **ukur `du -sb game/src` tiap akhir sesi (§9) dan putuskan dari byte asli.** Potong HANYA kalau byte asli masih lewat cap, urutan tetap: SFX nice-to-have (klakson, pintu, langkah, ombak, rotor, ledakan) → juice Tier 2 → squash & stretch → damage number → slow-mo fanfare → drift Opsi A (bukan B) → misi 3 → misi 7. **Badai misi 8 DITUNDA** sampai byte asli kelihatan (itu biaya tambah 2,5–3 KB, bukan potongan). **Misi 3 dan 7 jalan terakhir** — pertahankan dulu. Versi minimal title (~150 baris ≈ 6 KB: logo + HOW TO PLAY + info save + kamera stage + navigasi keyboard, tanpa Credits/footer/slider volume) adalah fallback kalau pemadatan tidak cukup.

### Pola kunci per sistem (ringkas — detail penuh ada di file studi)

- **Misi (§3):** 5 tipe stage — `reach` (dalam radius), `combat` (semua
  musuh habis), `escape` (wanted harus 0), `talk` (dialog selesai),
  `wanted` (set minimum wanted). Stage scripting (`talk`/`wanted`/`lawless`)
  disembunyikan dari hitungan HUD. Flag `lawless` (1 boolean) mematikan
  pelaporan kejahatan saat adegan scripted. `statsAtStart`: snapshot
  statistik saat misi mulai → hasil misi = selisih. Gagal misi ≠ game over
  (toast + ulang dari stage 0, jeda 3 dtk). Auto-start misi berikut 2,5 dtk
  setelah selesai. Beacon: SATU geometri + material bersama, dipakai ulang.
- **Wanted:** heat 0–100; bintang = `floor(heat/20)` (0–5). Tabel kejahatan:
  curi mobil +25, tabrak pejalan kaki +20, tembak +30, bunuh +40, bunuh
  polisi +50, ledakan +30. `witnessed()`: kejahatan hanya menaikkan heat
  kalau ada saksi (pejalan kaki/polisi dalam 300/520 unit + line of sight)
  atau mobil polisi <520 unit; kalau level >0 semua kejahatan disaksikan.
  Zona pencarian radius awal `260 + level*90` (nilai #1 — TUNE ke skala
  grid Palma Verde, target ≈ 2 blok); zona mengikuti pemain saat terlihat.
  `evadeNeed = 5 + level*1,8` detik tak terlihat & di luar zona → heat
  reda 2,5/dtk, bintang turun satu per satu. Tertangkap: jalan kaki +
  bintang ≤2 + polisi <3 m + diam 1,6 dtk → respawn safehouse + denda,
  wanted reset. Ganti mobil saat bintang ≤2 = −1 bintang.
- **Polisi:** pool 8 unit (dibuat sekali, `visible=false` saat OFF).
  `UNITS_BY_STARS = [0,2,3,4,6,8]`. Call sign deterministik:
  `NAMES[i%6] + '-' + (10+i*7)`, NAMES = IBIS, TARPON, HERON, PELICAN,
  EGRET, OSPREY. Spawn 60–100 m di belakang pemain di jalan terdekat,
  tidak pernah di depan mata; despawn >150 m. Pursuit: bidik titik
  intersepsi (posisi pemain + kecepatan×0,6 dtk), setir = `clamp(diff*2)`,
  pakai `Car.drive()` yang sudah ada. Status dari jarak: <6 m RAMMING,
  <25 m BOXING IN, sisanya PURSUIT (dihitung saat HUD menggambar, bukan
  state tersimpan). Unstick: kecepatan <25 padahal gas penuh >1,1 dtk →
  mundur 0,9 dtk setir dibalik. Officer turun jalan kaki kalau pemain
  jalan kaki + jarak <150 m. Wreck polisi TIDAK dihapus — jadi scenery.
  Busted: pemain pelan (<1) + unit <3 m selama 3 dtk.
- **Combat:** `WEAPONS` = tabel data. Fists (dmg 15, range 2,5, rate 2,5/dtk,
  tak terbatas), Pistol (34, range 60, rate 3/dtk, mag 12, reload 1,1 dtk),
  SMG (18, range 45, rate 9/dtk, auto, mag 32, reload 1,6 dtk, LOCKED
  sampai misi 5). Hitscan: SATU `Raycaster` dipakai ulang, target =
  peds + polisi aktif (±30 objek), `recursive=false`. Tracer pool 6 garis
  (hidup 60 ms), flash pool. Melee = cek radius, tanpa raycast. Reload
  tombol R. Tanpa sistem armor — health saja + regen di luar bahaya.
- **Radio:** 3 stasiun — CORAL FM 96.4 (synthwave, bpm 112, sawtooth),
  SOL 101.9 (latin, bpm 96, triangle), TALK 88.1 (talk malam, bpm 80,
  sine). Ganti stasiun = bunyi statis 0,3 dtk. SFX jalur terpisah: sirene
  (1 osilator + LFO), mesin (pitch ∝ kecepatan), tembakan (noise burst).
- **Dialog:** pemeran — Leo Marin (protagonis), Nadia Sol (fixer; kacamata
  hitam, rambut dicepol, jaket denim), Kiko "Tangan Emas" (montir),
  Ilsa Maren (peretas). JANGAN pakai nama JUNO/SOL dari contoh file pola —
  itu placeholder studi. Durasi baris = `min(6,5, 1,8 + len*0,045)` detik.
- **Distrik (6):** Pelabuhan Solmar (pier + mercusuar), Boulevard Palma
  (ferris wheel), Kota Tua / Casco Viejo (alun-alun + air mancur), Distrik
  Neon / La Rosa (menara jam neon), Bukit Marisol (vila), Pasar Ikan /
  Mercado (pasar terbuka + perahu). Tiap distrik 2–3 detail unik.
- **Bentuk peta JANGAN grid kotak biasa (Gibran, 19 Nov 03:26).** Phase 1
  itu 9×9 grid polos — Phase 2 harus memecahnya: garis pantai tidak lurus
  (teluk yang masuk ke kota + semenanjung + pantai pasir di barat),
  distrik mengikuti garis pantai, bukan kotak. Murah: ubah seed/outline
  peta di `city.js` saat langkah distrik (bukan sistem baru) — pantai +
  teluk + 1 tanjung sudah cukup membuat minimap terlihat tidak biasa.
- **Siklus hari:** jam maju 1 menit game per ~2 detik nyata. Misi malam:
  jam langsung diset 21:00 + notifikasi "Later that night..." (tanpa
  menunggu siklus). Malam neon = jendela + lampu jalan + billboard menyala
  (emissive) + maks 3–4 PointLight di landmark.

## 3. Delapan misi — satu baris tiap misi (arc 3 babak)

| # | Misi | Mekanik baru | Stage (tipe) | Wanted | Hadiah |
|---|---|---|---|---|---|
| 1 | "Selamat Datang di Palma Verde" (tutorial) | Jalan kaki, masuk/keluar mobil, mengemudi, minimap | talk → reach → reach (drive) | 0 | $300 + safehouse |
| 2 | "Paket Panas" | Timer misi, mengemudi cepat di traffic | reach (timer) → reach | 1 | $500 + REP |
| 3 | "Tukar Guling" | Curi mobil sport, hindari saksi, ganti identitas | reach → reach (curi) → escape | 0–1 | $700 + mobil sport dibuka. **Kandidat potong #1** |
| 4 | "Sarang di Menara" | Combat pertama, baku tembak + kabur lewat atap | reach → combat → escape | 2–3 | $1.200 + pistol dibuka |
| 5 | "Kasir Kosong" | Timer alarm, tahan kasir sampai brankas terbuka | hold → escape | 2–3 | $1.500 + SMG dibuka |
| 6 | "Sopir Pelarian" | Peran terbalik: kamu menyetir, Ilsa menembak otomatis dari jendela; roadblock | escape (drive) → reach | 4 | $2.000 + NOS |
| 7 | "Jembatan Terbakar" | Sergap konvoi: hancurkan 3 mobil, kabur saat heli datang | combat (kendaraan) → escape | 4 | $2.500 + REP besar. **Kandidat potong #2** (gabung ke misi 6 sebagai stage tambahan) |
| 8 | "Bank Solmarina" (klimaks) | Semua sistem sekaligus; ending | hold → combat → escape | 5 | $5.000 + ending "LEO MARIN — LEGENDA PALMA VERDE" |

**JANGAN dipotong:** misi 1 (tutorial), 4 (baku tembak pertama), 6
(getaway), 8 (klimaks). Minimal 6 misi. Tiap misi kabur punya 2 rute
(jalan utama cepat + ramai vs gang sempit lambat + sepi). Tiap misi punya
SATU "momen yang bisa diceritakan orang". Wanted, radio, traffic JALAN
TERUS selama misi — jangan matikan sistem kota saat misi berjalan.
Jeda dialog singkat di safehouse sebelum misi 4 dan 8 (Nadia menelepon).

## 4. Cut list — yang TIDAK dibangun (alasan per potongan)

| Dipotong | Alasan |
|---|---|
| Lapisan ekonomi penuh (toko senjata, safehouse/properti yang bisa dibeli, tangga respect) | Tidak terlihat di cover; live review (60 menit untuk 10 game) tidak akan membuka menu toko. Pengganti: respray $150 + SMG $1.000 — uang tetap punya tempat pergi, tanpa satu sistem pun |
| Kolektibel (20 Sunset Tapes / idol) | Tidak terlihat di screenshot; diganti % COMPLETE yang terlihat di setiap shot |
| Helikopter AI penuh (tembak dari udara) | Di screenshot, heli visual = heli AI; di live play, heli yang menembak justru berisiko menjengkelkan |
| Stasiun radio ke-4 | Judge tidak mendengar; HUD menampilkan nama + lagu dengan cara yang sama |
| Distrik ke-7..9, pulau/jembatan | Distrik = teks + palet di mata judge; #8 dengan 16 distrik kalah dari #1 dengan 9. **Dikonfirmasi Gibran 19 Nov 03:31: gausah ditambah** |
| Aktivitas sampingan (taksi, vigilante, biliar, dll.) | Bukan inti loop; makan sesi tanpa menambah skor screenshot. **Gibran 19 Nov 03:31: gausah.** Race side job (§2 langkah 10) TETAP — itu bagian dari % COMPLETE, bukan aktivitas tambahan |
| Senjata ke-4 (shotgun/rifle) | Slot HUD menampilkan 3 senjata (satu LOCKED) sudah cukup sebagai bukti progres |
| Pause 4 tab → 1 tab | Yang dibaca judge: % COMPLETE + peta; navigasi tab tidak dinilai |
| Renderer custom WebGL2 | Three.js mencapai piksel yang sama dengan risiko bug jauh lebih kecil; sudah ada di Phase 1 |
| AI pejalan kaki baru / variasi pejalan kaki | **KLAIM LAMA SALAH (studi 19 Nov 03:39):** 2 variabel memberi variasi, bukan perilaku — perilaku butuh state + cabang, paket wajib ~69 baris (lihat §5g) |
| Mode malam penuh (siklus 24 jam nyata) | Sunset + neon via lerp sudah memberi 4 waktu berbeda untuk 4 shot |

## 5. Keputusan saat studi bertentangan (satu baris tiap keputusan)

1. **Ekonomi:** cut-the-corner menang atas top20-repos — tanpa toko/properti;
   uang pergi ke respray + SMG. Alasan: tak terlihat di cover, #16 top 20
   tanpa ekonomi.
2. **Wanted:** heat + `witnessed()` (halcyon/game-design) menang atas
   `seen()` jarak-saja (patterns) — keadilan di live play + chip
   IN SIGHT/EVADING adalah tell screenshot.
3. **Pursuit:** setir langsung (patterns/#4) menang atas road-graph (#1) —
   Phase 1 tidak punya road graph; membangunnya di luar anggaran.
4. **Heli:** cone mesh transparan (patterns) menang atas SpotLight asli (#4)
   — aturan satu lampu berbayang; visual di screenshot identik.
5. **Distrik:** 6 (game-design + cut-the-corner) menang atas 7+ (top20-repos)
   — #8 dengan 16 distrik tidak mengalahkan #1 dengan 9.
6. **Misi:** 8 (game-design) menang atas minimum 6–7 — mesin data-driven
   membuat misi ke-7/8 hanya entri data; urutan potong: 3 lalu 7.
7. **Pause:** 1 tab (cut-the-corner) menang atas 4 tab (#1) — judge hanya
   membaca % COMPLETE + peta.
8. **Radio:** scheduler look-ahead (halcyon) menang atas setInterval
   (patterns); pola arp bersama (#4) menang atas pola per stasiun —
   satu fungsi schedule, 3 cabang.
9. **HUD:** DOM + cache-signature (Phase 1/#4) menang atas canvas (#1) —
   tanpa tulis ulang; layout 4 sudut dipinjam dari #1.
10. **SMG unlock:** misi 5 (game-design) menang atas misi 4 (contoh patterns)
    — hadiah perampokan cocok dengan fiksi.
11. **Race:** side-job di data MISSIONS (cut-the-corner + top20-repos) menang
    atas sistem terpisah — pakai ulang runner + stage checkpoint.
12. **Waktu shot:** 4 waktu berbeda (cut-the-corner Tier C) digabung ke 4 shot
    rencana awal — shot yang sama, lighting berbeda tiap shot.

## 5b. Aturan feel dari gameplay SA (studi video 19 Nov 03:26, +~150–170 baris)

Sumber: `gta6-sa-gameplay.md` — 4 video SA ditonton frame per frame
(10 menit pertama, Wrong Side of the Tracks, Reuniting the Families,
balapan + wanted 5). Tambahan ini muat dalam anggaran karena sebagian
besar retune + toast, bukan sistem baru.

1. **Gameplay pertama = kejar-kejaran.** Misi 1 langsung bergerak ke
   objektif terlihat; dialog pembuka maks 2 baris; hadiah pertama <3 menit.
   (SA sendiri: 3 menit cutscene dulu — JANGAN ditiru durasinya, curi
   urutannya saja: ancaman → identitas → aksi.) `missions.js` + `dialog.js`,
   ~30 baris.
2. **Satu kalimat perintah, selalu terlihat.** Toast perintah per stage +
   panel misi kecil. `missions.js`, ~15 baris.
3. **Lock-on assist untuk menembak.** Snap ke musuh terdekat dalam kerucut
   ~15°, crosshair berubah warna saat hit/kill. SA memakai lock-on (R1),
   free aim murninya diakui clunky. `combat.js`, ~25 baris.
4. **Wanted yang bernapas.** 1 bintang hilang sendiri ~15 dtk tanpa
   terlihat; **heli visual mulai 3 bintang (bukan 4)**; busted = denda +
   respawn (jangan rampas senjata — SA merampas, dan itu dibenci);
   1 unit polisi muncul dari depan saat masuk distrik baru (wanted ≥2).
   `police.js`, ~40 baris (sebagian besar retune angka).
5. **Tiap misi berakhir dengan kaki pulang + ketukan tenang.** Stage
   `return` (reach + dialog) sebelum "Mission Passed" — SA selalu menutup
   misi dengan tenang, bukan ledakan. `missions.js`, ~20 baris.
6. **Hal kecil feel-per-baris (urut dampak):** nama distrik saat masuk
   (~5) > toast skill/unlock (~10) > pejalan kaki lari + panggil polisi
   (~15) > nama stasiun radio (~5) > traffic mengerem (~10).
   **Layout HUD "ringkas" SA (terukur dari frame):** minimap bundar kiri
   bawah, jam/uang/health/bintang/senjata kanan atas, objektif bawah-tengah,
   nama distrik font script, radio kiri atas.

## 5c. SFX + retune mengemudi (studi 19 Nov 03:33–03:34)

Sumber: `gta6-procedural-sfx.md` (16 resep diukur di headless Chromium —
semua jalan, tidak clip lewat kompresor) + `gta6-driving-feel.md` (semua
angka Phase 1 dihitung dari kode, bukan tebakan).

**SFX (~190 baris, di radio.js — lihat langkah 1):** 4 helper bersama
(`tone`/`noise`/`blip`/loop + 1 buffer noise 2 dtk dari `mulberry32(99)`),
satu suara baru = 3–6 baris. **Arah Gibran (19 Nov 03:37): suara seperti
film jaman dulu / DOOM — kecil ukurannya tapi ada suaranya (prosedural,
tanpa file audio — sesuai pendekatan studi ini).** Urut feel-per-baris: mesin (pitch ∝ kecepatan)
#1 — tanpa ini 150 km/jam terasa seperti 60; sirene (gain ∝ jarak + pan +
Doppler ±5%); tembakan pistol vs SMG yang beda terdengar; 4 sting (Mission
Passed, wanted naik/turun, busted); thud tabrakan; statis radio; klik UI;
blip unlock. Mix: music 0,45 / sfx 0,9, kompresor -12 dB / ratio 12;
duck musik ke 0,3 saat dialog, 0,6 saat wanted ≥3. Dipotong: reverb,
PannerNode/HRTF, Doppler penuh, vokal synth.

**Mengemudi (retune + ~90 baris baru — angka titik awal, uji 23 Nov):**
- Phase 1 **TIDAK PUNYA handbrake** — `Space` = ACTION_CONFIRM.
  Opsi B (kecepatan lateral sungguhan, ~40–60 baris) di hari game-feel
  22 Nov; fallback Opsi A (drift palsu visual, ~20–30 baris) kalau mepet.
- Setir sama tajam di kecepatan berapa pun (radius belok konstan ~10,3 m;
  di 34 m/s putar 180° dalam 0,95 dtk — go-kart). Retune: otoritas setir
  0,55 → 0,28 di kecepatan maks + cap yaw rate 2,2 rad/dtk.
- **Bug tabrakan dinding:** `drive()` memanggil `collideCircle()` 2×;
  panggilan pertama sudah mendorong mobil keluar, jadi `speed *= 0,4` di
  panggilan kedua hampir tidak pernah terpicu. Perbaikan 1 baris (tangkap
  return panggilan pertama, potong ×0,55).
- **Tidak ada tabrakan mobil-mobil sama sekali** — pemain menembus traffic
  dan polisi. ~25 baris (cek lingkaran-lingkaran + dorong + potong
  kecepatan + getar + klakson). Kekurangan feel terbesar ke-2.
- Polisi tidak akan pernah mengejar di jalan lurus (sama-sama maks 34 m/s).
  Asimetri arcade: polisi 37,4 m/s di lurusan tapi otoritas setir ×0,8
  (mengejar di lurus, lolos di tikungan) — ~5 baris.
- Akselerasi terlalu cepat (0–34 m/s dalam ~2,1 dtk) → ~3 dtk (accel
  16 → 11–12); sport di misi 3 tetap 16 + maks 38 m/s via tabel statistik
  per jenis mobil (~15 baris).
- Sensasi kecepatan: dash tiap 12 m terlalu jarang (2,8/detik di kecepatan
  maks → retune ke 8 m); traffic terlalu sepi (14 mobil); belum ada whoosh
  menyalip.
- Race: checkpoint harus tiang vertikal (bukan lingkaran di tanah);
  rubber-band rival `targetSpeed × (1 + clamp(gap/120, −0,12, +0,15))`,
  cap 1,05× top speed pemain, JANGAN teleport. Roadblock 80 m di depan =
  2,35 dtk reaksi di kecepatan maks — harus ditelegrafkan (lampu berkedip +
  toast "ROADBLOCK AHEAD" + celah yang terlihat). Spike strip opsional
  bintang 4–5, terlihat dari 100 m (SA sendiri tidak pernah memakainya di
  gameplay — hanya disebut di cutscene).

## 5d. Juice (studi 19 Nov 03:35 — Tier 1 masuk, Tier 2 kondisional)

Sumber: `gta6-juice.md`. Satu sistem partikel pooled = 80% juice visual:
dua `THREE.Points` (1 aditif api/percikan, 1 normal asap), pool 256,
0 alokasi di frame, **+2 draw call total**. Semua efek = satu fungsi
`spawn` dengan parameter berbeda.

**Tier 1 (WAJIB, game-feel pass 22 Nov, ~150 baris ≈ 6 KB):** trauma shake
(~20) + partikel pooled (~90) + strobo polisi (~10) + hurt flash &
vignette HP rendah (~15) + hit-stop (~15).
**Tier 2 (opsional, ~143 baris ≈ 5,7 KB — TIDAK MUAT kecuali build di bawah
estimasi):** damage number, fanfare misi + slow-mo 0,35×, asap ban, ledakan
komposit, asap kerusakan, pulse bintang, squash & stretch. Urutan potong
Tier 2: squash & stretch → damage number → slow-mo fanfare. **Jangan
dipotong:** partikel pooled, strobo, trauma shake.

**Aturan:** trauma shake (bukan acak) — `trauma` 0–1, offset = `trauma² ×
0,15 m`, decay 1,5/dtk; pistol +0,12, kill +0,25, ledakan dekat +0,70;
**jangan pernah shake saat membidik.** Hit-stop 60 ms HANYA saat kill
(melee 80 ms, ledakan 100 ms); nol hit-stop tiap hit dan nol saat mengemudi
>20 m/s. Satu aksi = maks 2 lapis juice (ledakan pengecualian, 3 lapis);
asap tidak boleh menutupi HUD/beacon; cap 40 partikel baru per frame;
suara + visual di frame yang sama. **Tes SA:** kalau SA tidak melakukannya,
pakai setengah kekuatan (SA restrained: tanpa hit-stop/slow-mo/damage
number — umpan baliknya pejalan kaki terhuyung, puff darah, muzzle flash,
asap kerusakan → api → ledakan, asap ban, bintang berkedip).
**Dua penonton, dua juice:** judge AI melihat stills — shake/hit-stop/
slow-mo tidak terlihat; yang dinilai residu yang membeku (asap, strobo,
kilat ledakan, teks besar). Semua juice `[L]`-only dimatikan saat `?shot=`,
trauma dipaksa 0. Cover = strobo + asap ban, bukan ledakan. **Skid mark
TIDAK dibangun** (butuh sistem decal; asap ban sudah menjual "selip").

## 5e. Title screen (studi 19 Nov 03:36, ~240 baris ≈ 9,5 KB — danai dari potongan, lihat total di atas)

Sumber: `gta6-title-screen.md`. **Koreksi penting: title TIDAK masuk
4 screenshot penjurian (§6 melarangnya) — judge AI pairwise TIDAK PERNAH
melihatnya.** Nilainya di (a) live review top 10 — title adalah hal pertama
yang dilihat tim make.fun, (b) gerbang playtest start → bermain <10 dtk,
(c) "dua game harus menang" — title memenangkan game live-play, bukan game
screenshot.

**Phase 1 sudah punya title yang berfungsi, tapi belum menjual** (logo 64px
satu baris di tengah; top-3 ≈ 60–70% lebar layar; tidak ada karakter/mobil
yang di-frame; Continue tanpa info save; tidak ada HOW TO PLAY,
Controls/Credits; font system-ui). **3 jebakan Phase 1 yang wajib
diperbaiki:** (a) klik-di-mana-saja-untuk-mulai bisa menimpa save
(autosave 20 dtk) — HAPUS; (b) HUD bocor di balik overlay title (minimap +
panel cash terlihat — `#hud` tidak disembunyikan di mode menu); (c) kamera
menu drift dari posisi spawn acak + traffic/peds TIDAK di-update di mode
menu (kota di belakang title diam).

**Spesifikasi (@1280×800, pakai `clamp()`):** logo "PALMA" 84px putih +
"VERDE" 120px emas (Barlow Condensed 700) kiri atas — stacked dua baris
ala SA + outline tebal (BUKAN font Pricedown — lisensi komersial, dilarang);
tagline 2 baris max-width 460px; menu kiri-bawah 4 item (New Game /
Continue / Controls / Credits), tombol 260×44px, 18px; HOW TO PLAY
kanan-atas 28% lebar, panel alpha 0,6, 9 baris 14px (diambil dari #1 —
pembeda terbesar title #1); footer 12px (floor); scene 3D: Leo + mobil di
Boulevard Palma, golden hour 18:52, kamera orbit 14 m / 0,03 rad/s dengan
target di-offset supaya Leo jatuh di ~62% lebar layar; kota hidup (traffic
+ peds di-update di mode menu, ~2 baris). Logo flat putih + emas (bukan
gradasi pelangi #1/#3). Info save di Continue: "Mission 3/8 · $1,250 ·
REP 2 · 24% · Day 2, 14:30".

**Aturan interaksi:** navigasi keyboard ↑↓ + Enter wajib; Enter pertama =
aksi utama (Continue kalau ada save, New Game kalau tidak) — tanpa layar
perantara; AudioContext HANYA di dalam `startGame()` (aturan gestur
browser), radio fade-in 1 detik setelah mulai, volume di panel Controls;
modal Controls/Credits alpha 0,85 + backdrop gelap; tidak ada Settings
terpisah, Quit, LOAD duplikat, difficulty, atau splash screen. Font 0 byte
tambahan (Barlow + Oswald sudah di paket font HUD). Urutan potong title
kalau anggaran menipis: Credits → footer → slider volume; JANGAN dipotong:
logo besar, HOW TO PLAY, info save, kamera stage, navigasi keyboard.

## 5f. Cuaca (studi 19 Nov 03:37 — vonis: TOLAK hujan jatuh, TERIMA "basah setelah hujan")

Sumber: `gta6-weather.md`. **Hujan yang jatuh DITOLAK:** tidak terlihat di
screenshot (tetes = noise yang menurunkan kontras HUD); di live play ~6
menit hampir pasti tidak pernah muncul; biaya ~110–120 baris ≈ 4–5 KB dari
sisa margin. **TERIMA "basah setelah hujan"** — aspal lebih gelap + genangan
cahaya lebih besar di bawah neon — sebagai tampilan shot malam saja,
~20–25 baris ≈ 1 KB, 0 draw call baru, masuk langkah 5 (`lighting.js`).
**OPSI (keputusan Gibran pagi):** badai hanya di misi 8 (klimaks), ~60–80
baris ≈ 2,5–3 KB, dibayar dengan SFX nice-to-have + potongan komentar/race.
Kabut DITOLAK (variasinya sudah ada di 4 keyframe waktu). Petir DITOLAK
berdiri sendiri (kilat di langit cerah = bug; hanya bersama badai).

## 5g. Pejalan kaki & traffic (studi 19 Nov 03:39 — paket wajib ~69 baris)

Sumber: `gta6-traffic-peds.md`. **Audit draw call (hitung statis dari
kode): total ~574 mesh** — pejalan kaki 5 mesh/unit × 22 = 110, mobil 11
mesh/unit × 41 = 451, kota 23. **Terukur 19 Nov 03:48 (lihat §5i): ~673
call/frame di jalan, ~725 dari udara** — jauh di atas target <150; angka
per-frame diukur lewat `renderer.info.render.calls` di playtest 23 Nov
(expose renderer di `window.__game`, 1 baris); hitungan 574 adalah mesh
yang ADA, per-frame lebih rendah karena frustum culling.

**Prinsip game jadul (Gibran, 19 Nov 03:40):** open world hanya merender
apa yang di depan kamera — hemat. Sudah diterapkan: frustum culling
Three.js (otomatis per objek) + fog sebagai batas jarak pandang (60–320,
objek di luar fog tidak terlihat) + spawn ring (pejalan kaki/traffic hanya
ada di dekat pemain). Angka per-frame diukur di playtest via
`renderer.info.render.calls`.

**Dua bug Phase 1:** (a) traffic "wrap" = teleport ke sisi berlawanan +
mobil hasil wrap melaju menembus gedung (`Traffic.update` tidak memanggil
`collideCircle`); (b) alokasi array `[...cars, playerCar]` per mobil per
frame — melanggar aturan nol-alokasi.

**Paket WAJIB ~69 baris** (lari saat tembakan, saksi menelepon, belok hanya
di sudut blok, ring pejalan kaki, ring traffic + hapus wrap, rem untuk
pejalan kaki + pemain jalan kaki) — dijadwalkan #2/#5/#6 di hari polisi
20 Nov, sisanya hari game-feel 22 Nov. **Paket BAGUS ~86 baris** (lari dari
mobil kencang, diam/berpasangan/berani/menunduk, menyeberang, belok halus +
klakson + menepi + menyalip + lampu rem) — kondisional.

**Spawn ring adalah jawaban kepadatan, bukan tambah unit:** 28 pejalan kaki
+ 20 traffic dengan ring terasa lebih ramai dari 40/24 tanpa ring. Radius:
pejalan kaki despawn >160 m / spawn 100–140 m; traffic despawn >180 m /
spawn 120–160 m di jalan. Deterministik (seeded rng). Jumlah akhir:
traffic 14 → 20, pejalan kaki 22 → 28; batas atas tanpa instancing: 24
traffic / ~30 pejalan kaki. Instancing (pejalan kaki 150 → 5 draw call)
hanya kalau playtest bilang kota terasa sepi.

**Spesifikasi saksi untuk `witnessed()`:** pejalan kaki melihat kejahatan
dalam 30 m → berhenti 2 dtk → `addHeat` sekali → lari; mendengar tembakan
(60 m) → lari saja, tidak menelepon; sopir traffic 40 m + kerucut ±60° →
klakson + setengah heat. Line of sight TIDAK di-raycast — jarak saja
(keputusan sadar, dicatat).

**Sengaja TIDAK dibangun:** lampu lalu lintas (~60 baris, tak terlihat di
screenshot), pejalan kaki menyerang balik, road rage. **Jangan dirusak:**
rem untuk mobil di depan, lajur kanan, belok 30%, parkir statis.

## 5h. Outline & dossier (studi 19 Nov 03:45 — mengubah cara build)

Sumber: `gta6-outline-dossier.md` (mekanika diverifikasi dari `RULES.txt`
+ `vendor/makefun-game.ts` `buildDossier`/`importOrder`, bukan dari
ingatan).

**Outline dimenangkan lewat NAMA, bukan prosa.** Outline dihasilkan mesin:
path + ukuran + **deklarasi pertama** tiap file (fungsi, class, method,
export, top-level assignment). **Komentar TIDAK muncul di outline** (bukan
deklarasi), dan "whole sources" hanya muncul kalau ada sisa token setelah
semua deklarasi masuk — praktis tidak pernah. Jadi: nama file, nama
fungsi/class/const, dan urutannya adalah satu-satunya real estate outline.

**Urutan dossier = DFS walk atas static import dari main.js** (lihat §1.3).
File #1–#10 dapat 2–3 baris deklarasi, #11–#17 dapat 1–2, #18–#22
path+ukuran saja. Kerangka draf outline (§6 file studi): 22 file dalam
urutan dossier target + header comment 1–2 baris tiap file + anggaran
token — dirancang untuk **~55 baris (≈550 token)**. Angka ("8 misi",
"3 senjata") TIDAK muncul dari deklarasi — mereka muncul di screenshot
(panel "MISSION 3/8", slot senjata) dan judul submit; jangan memutar kode
demi menyelundupkannya ke outline.

**Dossier punya DUA cap, yang mengikat adalah 1,5 MiB (scorer)** — bukan
4 MiB milik buildDossier. Matematika: 4 × 256 KiB gambar → base64 ≈
1.365 KiB + teks 160 KiB + overhead ≈ 1.528 KiB — muat dengan sisa ~8 KiB
saja. **Target tiap screenshot ≤200 KiB** (sisa ~300 KiB, aman).
**Over-cap TIDAK merusak game** (game/ punya cap sendiri 48 MiB) — ia
hanya membutakan judge terhadap file yang terpotong. Potongan jatuh pada
file TERAKHIR urutan dossier, makanya `shots.js`/`input.js`/`rng.js`
sengaja ditaruh paling akhir.

**Teks ke judge hanya bekerja lewat screenshot** (teks objektif/toast/
dialog yang dirender game dan terlihat di contact sheet) — bukan lewat
komentar source. Jangan buang byte source untuk pesan ke judge.
**Baris `Source files: N (X bytes)` + `Totals` di Game block adalah
satu-satunya angka agregat yang judge lihat dari kode** — N ≈ 22 file dan
X ≈ 150–160 KB (tanpa cut line) adalah sinyal sehat; jangan menggelembungkan
N/X demi baris ini. Id-id HTML di index.html (`cash-panel`,
`wanted-panel`, `minimap`, `objective`…) adalah satu-satunya tempat outline
"melihat" HUD.

**Checklist pre-submit khusus dossier:** jalankan main.ts 2× (byte harus
sama), cek tidak ada baris `[Cut at 163840 bytes: ...]` (target: tidak
ada; kalau ada, pastikan yang terpotong hanya ekor), cek urutan seksi
`### game/...`, dossier ≤1.572.864 byte, **jangan pernah edit dossier.json
manual** (gate `dossier_matches` byte-for-byte), screenshot ≤200 KiB, dan
tes baca: dari heading + 3 baris pertama tiap file saja, apakah orang asing
bisa menebak game ini punya misi, polisi, combat, radio, dialog, distrik?

## 5i. Performa (studi 19 Nov 03:48 — instancing adalah PRASYARAT Phase 2)

Sumber: `gta6-performance.md` (semua angka TERUKUR di headless Chromium
Playwright 1148 + SwiftShader, CDP membungkus `drawArrays/drawElements` —
bukan teori; repo tidak disentuh).

**Terukur Phase 1: ~673 draw call/frame di jalan, ~725 dari udara, ~37
ribu segitiga/frame.** Anggaran literatur <150 call. Game ini
**draw-call-bound, bukan triangle-bound** — segitiga remeh. **Bayangan =
41% dari semua call** (tanpa bayangan: 398 call). Shadow pass +275 call,
~24% waktu frame. **DPR 2 = 2,5× lebih lambat dari DPR 1** (1,53 → 0,6 fps
di SwiftShader). Phase 1 mengizinkan ratio sampai 2,0 — melanggar aturan
pola (cap 1,5). Perbaikan 1 baris. **~450 geometri + ~450 material hidup**
— tiap `box()` membuat geometri + material baru (8 geo/mat per mobil × 41
= 328, 5 × 22 pejalan kaki = 110, 7 pemain, 8 kota = 453 geometri / ~455
material).

**Cap "6 unit polisi kalau total >130" di brief TIDAK ADA ARTINYA sekarang**
— Phase 1 sendirian sudah 398 call di main pass. Polisi 8 unit = +176
call di struktur lama → total ~1.140 call/frame. **Instancing mobil +
pejalan kaki adalah prasyarat Phase 2, bukan optimasi** — target
pasca-instancing ~55 call/frame, dan polisi praktis tidak menambah call.
Instancing ~100–150 baris baru, dikerjakan SEBELUM langkah polisi, dibayar
dari Tier 2 juice + SFX nice-to-have dulu (urutan potong §2).

**FPS SwiftShader (1,5 fps) TIDAK mewakili FPS GPU asli** — yang eksak dan
sama di mana-mana: draw call + segitiga. Target: 60 fps p95 ≤16,7 ms DPR 1
(asumsi mesin: laptop menengah, 1080p, DPR 1–2), fallback 30 fps.

**Deviasi Phase 1 dari pola yang ditemukan:** pixel ratio cap 2,0 (bukan
1,5); tanpa fixed-step (dt variabel dijepit 0,05 — di bawah 20 fps game
slow-motion); `setClock` + `showSpeed` tanpa guard; minimap digambar ulang
tiap frame; **tidak ada FPS counter dan `renderer` tidak terekspos** di
`window.__game` (terverifikasi `main.js:359`) — playtest 23 Nov butuh ini
dulu. FPS counter murah ~20 baris (lapor p50/p95/worst + % di atas 16,7 ms,
bukan rata-rata).

**Jangan pernah:** PointLight berbayang (6 pass); upgrade vendor three ke
r186+ tanpa ganti PCFSoft. **Urutan degradasi 7 langkah** (pixel ratio →
shadow mapSize → shadow autoUpdate → partikel → traffic/peds → bayangan
mati → fog) + fallback 30 fps (dt 0,033 masih real-time; slow motion baru
<20 fps).

## 5j. Top-20 study (19 Nov ~16:00 WIB — Gibran: "bebas", masukkan ke Phase 2)

Studi: `~/workspace/learning/gta6-01-top20-study.md` (604 baris, 20 entry satu per satu).
- **Dev board imbang 6.430 arah** (98,6% field 12-0; #1 0,993977 vs #20 0,992703,
  selisih 0,13%). Dev rank BUKAN ranking kekuatan; final heat (3 Swiss + playoff
  top-100, dinilai ulang dari nol) + top 10 dimainkan live yang menentukan.
- **Formula konvergen:** 20/20 3D low-poly coastal crime, median 8 misi, wanted
  5 bintang + roadblock + heli, radio bernama, minimap bundar, REP ladder,
  dialog portrait, save + % COMPLETE, garage/gun shop. **Panel dispatch polisi
  (unit bernama + jarak live + kata kerja taktik: RAMMING / ROADBLOCK /
  SPOTLIGHT) ada di 18/20** — pola paling sering diulang; rencana kita sudah
  punya ini.
- **Biaya TIDAK prediksi rank:** #20 cuma $2,61 (5 misi, tanpa dispatch/garage/
  heli — satu golden hour beku 18:42 + framing chapter); #1 $31,79; termahal
  #9 $230,82 cuma rank 9. **Minimum yang menang: misi + wanted + radio +
  minimap + satu look yang kuat.**
- **Tiap top entry punya SATU hook khas** (checklist = syarat masuk, hook =
  pembeda): #1 dispatch hidup, #10 countdown badai 7 hari, #13 debt clock +
  perahu, #9 district standing, #7 briefing telepon + par time, #12 palet dusk
  kelabu + diegesis Spanyol penuh, #20 satu jam golden hour beku.
- **Keunggulan kita yang nyata:** sumber ≤160 KiB — repo #1 704 KB dan #4
  391 KB melebihi cap sehingga outline judge-nya terpotong; outline kita
  terlihat penuh.
- **Tiga tambahan ke rencana (murah, data-driven, muat di budget compact-first):**
  1. **Garage shop kecil dengan upgrade berharga** (~30–50 baris) — gap paling
     terlihat: money sink kita cuma stub (respray $150 + SMG $1.000), semua
     top-20 punya garage 4+ upgrade. Bangun sebagai data (tabel upgrade) +
     satu UI beli.
  2. **Pause 1 tab jadi progress dashboard** (hampir gratis, DOM text): daftar
     misi + payout, harga garage, statistik, hitungan collectible.
  3. **Par-time bonus per misi** (~15–25 baris) — hook termurah yang menyentuh
     semua misi; catat par time di data misi, bonus kalau selesai di bawah par.
- **Hook khas kita (diputuskan di sesi build, bukan di sini):** rencana sudah
  punya semua checklist; satu hook yang membedakan harus dipilih saat build —
  kandidat termurah: par time (#3 di atas) atau frozen golden hour 18:52
  sebagai identitas waktu (sudah ada di rencana sunset/neon).

## 5k. Golden ratio (φ) — prinsip desain universal (Gibran 16:05 WIB)

"Seluruh dunia apapun itu kalau pakai golden ratio pasti bagus" — φ adalah
prinsip keindahan UNIVERSAL, bukan cuma buat palem. Berlaku untuk semuanya:
layout berita, game ini, komisi. Terapkan φ di Palma Verde, terukur tapi
jangan jadi obsesi (kalau sebuah elemen terlihat benar tanpa φ yang persis,
biarkan).
- **Konstanta kerja (Gibran 16:16 WIB): π = 3.14159 dan φ = 1.61803 (5 digit
  masing-masing).** GR mirip π — keduanya konstanta irasional universal; 10 digit
  π saja cukup untuk mendaratkan manusia di Bulan, jadi 5 digit lebih dari
  cukup untuk desain (di kanvas 1024px, digit ke-5 φ mengubah ukuran
  ~0,00001px — di bawah satu piksel). φ untuk proporsi; π untuk geometri
  lingkaran (cakra matahari, minimap bundar, busur/arc, sudut emas
  360/φ² = 137,50776°).
- **Komposisi cover/screenshot:** elemen kunci (Leo + mobil, matahari, beacon
  misi) di titik φ frame; horizon di 1/φ dari bawah/atas; jarak kamera chase
  : tinggi kamera mendekati φ.
- **HUD:** pembagian layar mengikuti φ (minimap bundar di titik φ, panel misi
  lebar ~1/φ dari lebar layar, ukuran font hierarki dalam deret φ: 12 / 14 /
  18 / 22 / 30 px).
- **Kota:** ukuran distrik + jarak antar landmark mengikuti deret φ (distrik
  besar : sedang : kecil ≈ φ : 1 : 1/φ); jalan utama membagi peta di titik φ;
  posisi matahari golden hour 18:52 di titik φ langit.
- **Karakter:** proporsi Leo sudah CJ (~7 kepala — proporsi manusia klasik
  mendekati φ di beberapa rasio: tinggi : pinggang, lengan : lengan bawah).
- **Misi:** struktur 3 babak (setup : aksi : pulang) dalam rasio φ; durasi
  misi target mengikuti deret φ (mis. 90 dtk / 150 dtk / 240 dtk ≈ φ).
- **Title screen:** "PALMA" : "VERDE" ukuran dan posisi mengikuti φ;
  tagline di titik φ bawah.
- **Jangan:** jangan paksa φ sampai merusak gameplay (kamera, handling,
  readability HUD selalu menang atas φ yang persis).

## 6. Screenshot — 4 shot, cover menentukan segalanya

Judge melihat SATU contact sheet JPEG (cover 768×480 di atas, sisanya kecil
di bawah) + outline source ≤1.536 token. Semua shot = render ASLI via
`?shot=` + seed, browser headless di sesi terekam, **tanpa edit/komposit**.
Tiap file ≤256 KiB, sisi panjang ≤1280, sisi pendek ≥480 px. Nama pertama
menurut abjad = cover.

| Shot | Waktu | Isi (semua sistem harus terlihat) |
|---|---|---|
| `1-chase.jpg` (COVER) | Sunset | Kejar-kejaran polisi saat misi aktif: bintang terisi (3–4) + daftar unit bernama + jarak + status + panel misi (nama + stage + NEXT) + minimap + radio + kecepatan besar + uang + jam/hari. Kamera third-person rendah, kota isi 2/3 frame, horizon di sepertiga atas |
| `2-street.jpg` | Golden hour | Leo jalan kaki di distrik bernama, dialog berpotret aktif, pejalan kaki + traffic, banner distrik |
| `3-drive.jpg` | Malam neon | Mengemudi malam neon, radio aktif, HUD lengkap, helikopter di langit |
| `4-mission.jpg` | Fajar (dawn) | Momen klimaks Bank Solmarina + slot senjata + objektif + wanted 5 |

- Cek tiap shot di ukuran thumbnail 768×480 — teks harus terbaca saat
  dikecilkan. Draft cover HARI 21 (bukan 23): cek kepadatan sebelum semua
  sistem selesai.
- **DILARANG di shot:** teks "Missions arrive soon" / "Phase 1: no police
  yet"; bintang kosong saat adegan kejar-kejaran; title screen sebagai salah
  satu shot; HUD menutupi mobil/karakter utama.

## 7. Playtest — checklist (23 Nov, seserius menulis kode)

**60 detik pertama (paling menentukan):** start screen → bermain <10 dtk;
kontrol langsung jelas di layar pertama (WASD + mouse, E masuk mobil,
Space rem tangan); misi 1 dimulai dalam 30 dtk; hadiah pertama sebelum
menit ke-3; **nol error console**.

**Game feel:** kecepatan TERASA (FOV melebar saat ngebut, getar + suara saat
tabrakan); kamera chase stabil saat belok; respons instan (input lag
<100 ms); umpan balik setiap aksi (flash + suara + teks besar saat misi
selesai); gagal = respawn cepat di safehouse + petunjuk satu baris, tanpa
soft-lock.

**Checklist "terasa seperti GTA" (centang saat playtest):** nama distrik
muncul saat masuk distrik baru; sunset terlihat beda dari siang; malam neon
menyala; landmark dikenali dari jauh; pejalan kaki lari saat tembakan;
traffic melambat/menghindar; bintang naik HANYA saat ada saksi/alarm;
bintang berkedip saat garis pandang putus; roadblock terlihat di jalan;
heli terlihat + terdengar sebelum menyerang; ada cara lolos yang jelas;
8 misi (min 6) semuanya completable; dialog berpotret ≥2× per misi;
hadiah misi terasa (uang + teks besar + bunyi); semua nama orisinal.

## 8. Jadwal 19–24 Nov (garap 1 at a time)

| Hari | Kerja | Keluar |
|---|---|---|
| **19 Nov (siang)** | Langkah 0 (§10): verifikasi kit 20, approval push repo, mulai recording BARU (bersih), Gibran ketik prompt pembuka. Build: radio + dialog, mesin misi + misi 1–3 (data misi 4 ditulis, stage combat-nya aktif setelah combat jadi) | 3 misi playable + radio + dialog |
| **20 Nov** | Polisi dasar (heat + pool + pursuit + daftar unit) → sunset/neon + distrik + landmark → combat minimal → stage combat misi 4 aktif | **Tier A — SUBMITTABLE (top 20)** |
| **21 Nov** | Misi 5–8 (data saja) → heli visual + roadblock + respray → **draft cover** (cek kepadatan di thumbnail) | 8 misi + semua sistem inti |
| **22 Nov** | Pause 1 tab + % COMPLETE + save diperpanjang → race side job → game-feel pass (FOV, getar, feedback, respawn) | **Tier B (top 10)** |
| **23 Nov** | 4 screenshot final + playtest manusia penuh (start → misi 1 → misi selesai → save/load) + bugfix + `makefun check` hijau penuh | **Tier C + entry siap submit** |
| **24 Nov (siang)** | Buffer: cek kuota → check hijau → submit (§9). **JANGAN submit malam** — deadline 22:00 WIB | Submit SEBELUM 22:00 WIB |

**Kalau satu hari meleset:** pakai cut list (§4) + urutan potong misi (§3),
jangan potong misi/polisi/cover/playtest. Kalau sampai 22 Nov misi + polisi
belum playable, target turun ke top-100 (tetap submit game lengkap) daripada
memaksakan setengah jadi.

## 9. Jebakan — jangan lakukan ini

- **Copas kode dari repo pemenang / luar sesi terekam** = diskualifikasi +
  gagal transcript gate (baris copasan TIDAK dihitung authored).
- **File sudah final sebelum recording** = gagal (file yang dihitung harus
  ditulis SELAMA recording).
- **Session/subagent/cron lain jalan saat recording** = risiko ditolak
  (kasus @damnsogud) — lihat §10, jeda cron selama recording.
- **Hapus/edit pesan yang sudah terekam** (retry/undo/compress/revert) = gagal.
- **Repo belum di-push + tanpa README** = submit ditolak di intake.
- **Submit malam hari** = tidak ada waktu kalau check gagal.
- **Alokasi di loop:** nol `new THREE.*` di `frame()`/`update()` (kecuali
  node audio sekali pakai); geometri/material sekali di level modul; DOM
  hanya saat berubah; update HUD berat ≤5 Hz; raycast ke daftar kecil,
  `recursive=false`; satu lampu berbayang atau tidak sama sekali; pixel
  ratio ≤1,5; RNG ber-seed (`mulberry32`), jangan `Math.random()` untuk
  gameplay; hitung `du -sb game/src` tiap akhir sesi (cap 160 KiB).
- **AudioContext sebelum gestur** = game bisu di playtest live.
- **Draw call >150:** polisi = satu-satunya biaya besar baru (8 unit ≈ 80
  call) — cap 6 unit di bintang 5 kalau total >130.
- **Nama/karakter GTA asli** di mana pun (nama, dialog, musik, art).

## 10. Prosedur mulai pagi 19 Nov (30 menit pertama, berurutan)

1. **Verifikasi kit level 20** — dari direktori induk kit:
   `node gta6-01-kit/cli/makefun.mjs status --competition gta6-01`
   (tidak boleh ada warning level; kalau ada, re-download:
   `curl -sSL "https://make.fun/c/gta6-01/kit" | tar xz` dari direktori
   induk kit, lalu cek lagi).
2. **Jeda cron selama recording** — sale-watch (Meow/Matrix/Pod Squad,
   tiap 30 menit) + Cosmic watch + job terjadwal lain: JEDA sampai submit
   selesai, lalu nyalakan lagi. Alasan: session lain di mesin yang sama
   saat recording = risiko ditolak (kasus @damnsogud).
3. **Approval push repo** — minta Gibran menyetujui push commit Phase 1
   `05eb28a` ke https://github.com/Rzpctr2/makefun-gta6 (push ini aman
   dilakukan kapan saja — commit sudah ada, bukan penulisan kode).
4. **Mulai recording BARU** (sebelum satu baris kode ditulis), dari dalam
   kit level 20:
   `mkdir -p ~/.makefun; node cli/makefun.mjs record --competition gta6-01 --source <repo> > ~/.makefun/record-gta6-01.log 2>&1 & echo $! > ~/.makefun/record-gta6-01.pid`
5. **Gibran mengetik prompt pembuka** di aplikasi Muse, sesi top-level
   BARU (dimulai SETELAH recording jalan), dengan kata-katanya sendiri —
   intinya: bangun Phase 2 Palma Verde sesuai BUILD-BRIEF ini (misi,
   polisi, radio, combat, sunset/neon). Prompt itu = first message sesi.
6. **Build di sesi itu, dari file ini.** Tidak ada subagent untuk kode
   game atau screenshot (rantai parent harus utuh sampai prompt Gibran).
   Satu sistem sampai playable (§2) sebelum lanjut.
7. **Saat build selesai (23–24 Nov):** hentikan recording —
   `kill "$(cat ~/.makefun/record-gta6-01.pid)"`, tunggu log menulis
   `recording <id> sealed at <time>`. Kalau seal gagal:
   `node cli/makefun.mjs record --finish <id>` di mesin & shell yang SAMA.
   Catat ID di `~/.makefun/recordings.json`.

## 11. Checklist pre-submit (24 Nov siang)

- [ ] Kit level 20, tanpa warning di CLI manapun
- [ ] Recording Phase 2 BARU, dimulai SEBELUM kode ditulis, direkam bersih,
      di-seal; ID dicatat
- [ ] Kuota: `makefun status --competition gta6-01` → `can_submit: yes`
      (cek ULANG tepat sebelum submit)
- [ ] Repo di-push (commit SHA = yang disubmit); README.md dengan 3 badge
      live make.fun; GitHub About: website `https://make.fun/bounty/gta6-01`
      + topik `makefun`
- [ ] `main.ts` ≥1 baris authored baru; ≥5 assistant turn berteks; ada file
      yang direvisi ≥2 pesan assistant; ≥30% authored (cek via `makefun check`)
- [ ] `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` berhasil;
      dossier ≤1,5 MiB; game/ ≤993 file & ≤48 MiB; tiap screenshot ≤256 KiB
- [ ] `makefun check --kit . --repo <repo>` hijau penuh (jangan submit kalau
      ada yang merah — submit ditolak ikut memakan kuota/reputasi)
- [ ] 4 screenshot: render asli, cover = chase sunset, semua sistem terbaca
      di thumbnail 768×480
- [ ] Playtest manusia: start → misi 1 → misi selesai → save/load, tanpa
      error console; kontrol + kamera terasa pas
- [ ] Submit:
      `node cli/makefun.mjs submit --competition gta6-01 --recording <id1>,<id2> --repo-url https://github.com/Rzpctr2/makefun-gta6 --commit <sha> --title "Palma Verde 3D: 8 story missions, police helicopter, radio, saves" --repo <repo> --keypair <keypair> --system-prompt ~/workspace/system/system_prompt.md`
      (judul final boleh disesuaikan — pola: nama kota + "3D" + jumlah misi +
      polisi/helikopter + radio + saves)
- [ ] Catat di STATUS.md: submission id, claim code, commit, hasil check,
      thinking ratio. Poll `status --submission <id>` tiap beberapa menit.
- [ ] Nyalakan lagi cron yang dijeda di §10 langkah 2.
