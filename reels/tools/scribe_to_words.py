# Convert an ElevenLabs Scribe "words.json" (or a faster-whisper dump) into the engine format
# [{"t": text, "s": start, "e": end}], dropping punctuation-only tokens.
# Usage: python3 -I scribe_to_words.py words_raw.json src/edit/<reel>.words.json
import json, sys

raw = json.load(open(sys.argv[1]))
items = raw["words"] if isinstance(raw, dict) else raw
out = []
for w in items:
    if w.get("type", "word") != "word":
        continue
    t = (w.get("text") or w.get("word") or "").strip()
    if not t or all(c in ":;!?.,…" for c in t):
        continue
    out.append({"t": t, "s": round(float(w["start"]), 3), "e": round(float(w["end"]), 3)})
json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False)
print(len(out), "words")
