# Refaire exactement le même montage avec un autre Claude

## Le contenu du paquet

| Fichier | Contenu | Indispensable ? |
|---|---|---|
| `montage-reels.zip` | **La skill** : `SKILL.md` (le process pas à pas), `references/` (style, catalogue des scènes, leçons tirées de vos retours, analyse des références) et `template/` (le moteur Remotion complet : code, polices, visuels, outils de recadrage, de nettoyage, de transcription et de contrôle) | **Oui** |
| `references-videos.zip` | Les 9 vidéos de référence, renommées par famille (`motion_a8d5.mp4`…) | Non. Le style est déjà codé dans le moteur. Utile seulement pour réanalyser un procédé ou en ajouter un. |

À côté du paquet, l'autre Claude a besoin de :

1. **Un environnement qui exécute du code** avec Node 18+, ffmpeg et Python 3. C'est le cas de Claude Code (terminal, app desktop, claude.ai/code).
2. **Le connecteur ElevenLabs** activé sur le compte, pour la transcription mot à mot et la génération ou le détourage d'images. Sans lui, Claude peut transcrire avec Whisper en local et utiliser vos propres photos.
3. **Votre vidéo à monter.**

## Installation

### Option A : Claude Code (recommandé, c'est l'environnement qui a produit les tests)

1. Dézipper `montage-reels.zip` dans l'un de ces dossiers :
   - `~/.claude/skills/` : la skill est disponible dans tous vos projets ;
   - `<votre-projet>/.claude/skills/` : la skill est limitée à ce projet.

   Résultat attendu : `…/.claude/skills/montage-reels/SKILL.md`.
2. Démarrer Claude Code. La skill apparaît sous le nom `montage-reels`.
3. À la première utilisation, Claude copie `template/` dans un dossier de travail et lance `tools/setup.sh`.

Encore plus simple : la skill est déjà dans votre repo GitHub (`.claude/skills/montage-reels/` + `reels/`, branche `claude/zealous-wozniak-elpbh1`). Toute session Claude Code ouverte sur ce repo l'a automatiquement.

### Option B : claude.ai (chat)

Importez `montage-reels.zip` dans les paramètres du compte, rubrique des skills (l'exécution de code doit être activée). Le process et le style seront respectés. En revanche, le rendu vidéo (Remotion + Chromium) est lourd : le bac à sable du chat peut ne pas avoir le réseau ou le temps nécessaires. Pour produire les mp4, privilégiez l'option A.

## Le message à envoyer à l'autre Claude

> Utilise la skill montage-reels pour monter cette vidéo en Reel 9:16. [joindre la vidéo]
> (optionnel) Voici aussi references-videos.zip si tu dois réanalyser un procédé.

Claude suit alors les 10 étapes de `SKILL.md` :

1. analyse du rush ;
2. nettoyage ou recadrage ;
3. transcription ;
4. découpe ;
5. plan de montage ;
6. visuels ;
7. enregistrement de la composition ;
8. contrôle sur planches ;
9. rendu final ;
10. livraison, avec la liste des approximations.

## Garder la skill à jour

- Chaque retour que vous donnez est noté dans `references/LESSONS.md`.
- Chaque nouvelle scène est ajoutée dans `references/CATALOGUE.md`.
- Pour régénérer le paquet après des modifications, lancer depuis le repo : `bash reels/tools/export_skill.sh <dossier-des-videos-de-reference>`.
