# GULDUST STUDIO — état du build & décisions autonomes

> Application **Next.js 14 (App Router) + TypeScript + Tailwind + Zustand**, dark, identité GULDUST
> (or patiné / obsidienne), **entièrement navigable** avec une couche providers **mock**
> (aucune clé API requise). Le « réel » se branche brique par brique dans `lib/providers/`.

## Ce qui tourne (`npm run dev`)

1. **Accueil** — stats (dépensé/jour, générations en cours, disque), reprendre un projet, grille « nouveau projet » par style.
2. **Nouveau run** depuis n'importe quel style → ouvre un onglet.
3. **Canvas de run** — toolbar (marque, style, modèles, format, **mode VO/Dialogue/Mixte**, Tout générer / Tout animer), panneau **Script + cadrage**, upload VO `.mp3` (lit la vraie durée), **Analyser** (découpe scènes, tags Hook/Problème/Agitation/Solution/Preuve/CTA, lignes VO calées, casting), **Voix off** numérotée, **Casting**.
4. **Frames** (placeholders SVG stylés) reliées à leurs **vidéos** par le **fil d'or**.
5. **Cartes de scène** — perso, produit (Star/Fond/Masqué), prompt custom, régénérer + coût ; **bloc dialogue** (qui parle, réplique éditable, voix, TTS→lip-sync, refaire lip-sync, hors-champ).
6. **Livraison** — « Prêt pour le montage », coût total, **export .zip** (manifest EDL + frames).
7. **Brands** — Nom + Brand DNA markdown, images produit drag&drop, **Import DNA** (modal, section « DÉTAILS SOURCE »).
8. **Historique** — filtrable par style, groupé par jour.
9. **Réglages** — clés API par provider (KIE, Anthropic + modèle, HeyGen, HeyGen MCP), masquage `1623c••••d3ef`.
10. **Outils / Création** — Create Avatar, Native Ads, Adapt Créa (démarrent un run), Voix (bibliothèque), Visualiseur/Scripts/Copy Ads (scaffold « en câblage »).

## Décisions prises en autonomie (modifiables)

| Sujet | Décision | Réversible ? |
|---|---|---|
| Runtime | Next.js web local (confirmé) | — |
| Persistance | **localStorage** (proto) → SQLite + backend local ensuite | Oui |
| Providers | **Couche abstraite + adaptateur mock** ; réel branché plus tard | Oui (c'est le but) |
| Polices | Google Fonts via `<link>` (pas `next/font`, build-safe hors-ligne) | Oui |
| Analyse | Heuristique locale (tags/dialogue/durées) → Claude en réel | Oui |
| Découpage | 1 phrase VO = 1 scène | Oui |
| Dialogue | TTS avant frames (cale la durée) ; lip-sync réparable seul ; hors-champ | Oui |

## Pour passer au RÉEL — il me faut les docs providers
`lynae.e-corp.studio` est injoignable depuis l'environnement (egress bloqué). Donne-moi :
- **A.** le repo GitHub de la V1 (`owner/repo`) → je porte l'intégration exacte, **ou**
- **B.** les appels réseau (DevTools → Network) d'une génération, **ou**
- **C.** la checklist API (endpoints + auth + payloads) — cf. `00-ANALYSE-ET-DIRECTION.md` §3-C.

## Architecture des fichiers
```
lib/         types · seed · store (Zustand+persist) · format · providers/(types,mock,index)
components/  shell/(Sidebar,TabBar,AppShell) · run/(RunToolbar,ScriptPanel,SceneColumn) · ui/(StyleCard,TagChip)
app/         page(accueil) · new · run/[id] · brands · history · settings · tools/[tool]
```

## ⚠ Leçon retenue
Le container est éphémère : **tout commit doit être poussé immédiatement** sur `claude/session-48kw5y`,
sinon une réinitialisation du container efface le travail non poussé.

## Limites connues du prototype
- Frames = SVG placeholder ; vidéos = poster de la frame (pas de vraie animation).
- TTS/lip-sync simulés (durée estimée, pas d'audio réel).
- Coûts = tarifs simulés (`MOCK_COSTS`).
- Pas encore de backend/queue de jobs (générations séquentielles côté client).
