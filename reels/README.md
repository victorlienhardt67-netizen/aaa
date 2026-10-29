# reels — montage automatique de Reels (Remotion)

Pipeline : rush face caméra → nettoyage → transcription mot à mot → resserrage des silences → plan de scènes → rendu 1080×1920.

```
reels/
  tools/clean_facecam.py   retire un bandeau incrusté (inpainting) + recadrage 9:16 → public/media/
  src/edit/cut.ts          resserre les blancs entre les mots (les mots ne sont jamais coupés)
  src/edit/words.json      transcription mot à mot (ElevenLabs Scribe)
  src/edit/reel01.tsx      le montage d'une vidéo : plan en secondes SOURCE, sous-titres, variations
  src/components/          briques réutilisables (fonds, TypeText, Captions, Phone/Feed, WordFlash…)
  src/scenes/              scènes de motion design, scènes typographiques, variations face caméra
  STYLE.md                 provenance de chaque procédé + approximations
```

## Nouvelle vidéo

1. `python3 tools/clean_facecam.py rush.mp4 public/media/facecam_clean.mp4` (adapter Y0 et le masque au bandeau).
2. Transcrire (mots + timecodes) → `src/edit/words.json` au format `[{t, s, e}]`.
3. Copier `src/edit/reel01.tsx` et écrire le plan : chaque scène commence à un temps **source** ; les textes se calent sur `at(tempsSource)`.
4. `npx remotion studio src/index.ts` pour prévisualiser, puis
   `npx remotion render src/index.ts Reel01 out/reel.mp4 --crf=17`.

Dans ce conteneur, ajouter `--browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`.

Les médias (`public/media`) et les rendus (`out/`) ne sont pas versionnés.
