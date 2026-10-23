---
name: make-explainer-video
description: >-
  Make a narrated explainer or demo video with Remotion, with an Azure AI voiceover (Ollie) and
  background music. Use when the user wants a voiced video, a "how I built X" video to share,
  or voiceover/narration for a Remotion video.
---

# Make explainer video

Remotion composes video; it cannot speak. This skill adds the voice: narration text goes to the
Azure Speech (Foundry) resource, comes back as one mp3 per scene, and Remotion plays them.
Personal/fun videos only; keep anything confidential out of the script (it is sent to Azure).

Scripts live in `scripts/` and use Node 22.18+ (no package installation needed). Always run them
through `scripts/speech.sh`: it injects credentials with envault and works from any directory.

- `envault.toml` maps `AZURE_SPEECH_KEY` to `azure-speech-secret` and `AZURE_SPEECH_ENDPOINT` to
  `azure-speech-url`. It contains alias names only, so it is safe to commit.
- `voice.config.json` contains the public `voice` and `style` preferences; keep it tracked.
- Never create or read a `.env` for this skill. Never print credentials, endpoint URLs, or Azure
  response bodies. Do not copy any private values into this public repository.
- Keep video projects, scripts, generated audio and review files outside this skill/repository.

## 1. Check setup

- Read the `envault` skill. `envault ls --json` should list `azure-speech-secret` (key) and
  `azure-speech-url` (endpoint). Both must be separately addressable entries: envault cannot inject
  a secret's URL metadata property. Never inspect the vault files or ask for plaintext values.
- Node and envault are on PATH. The wrapper loads the manifest automatically; no manual exports,
  endpoint rewriting, or repeated setup smoke tests are needed.
- The endpoint must be HTTPS on a Cognitive Services resource or regional Speech host. Existing
  paths are replaced automatically with the correct synthesis path; invalid hosts are rejected.
- A Remotion project exists. If not, create one in its own subfolder of
  `~/videos/` (`~/videos/<name>`, one folder per video), following the Remotion skills'
  `remotion-create`, and audit packages before installing.
- Remotion skills are read from `~/source/third_party/remotion/packages/skills/skills/` (start with
  `remotion-best-practices/SKILL.md`). Use the same Remotion version as the project.

Done when both vault aliases exist and a project folder is chosen. If access needs checking, use
`bash "$S/scripts/speech.sh" voices en-GB` after setting `S` as below; this does not generate audio.

## 2. Write the script

Ask what the video should show (audience, key points, length). Write `script.md` in the project:

```markdown
## intro
Hello! I built a skill that writes our release notes.

## how-it-works
It reads the work items, groups them by theme, and drafts the lot in about a minute.
```

- Each `## scene-id` (lowercase, digits, dashes) is one scene and one audio file.
- Aim for 1-3 short sentences per scene, spoken in about 5-15 seconds.
- Write the way it is said: spell out acronyms and numbers the voice might misread ("A D O",
  "twenty twenty-six").
- Ollie takes no style tags; the emotion comes from the wording, so write "Great news!" not
  "The release has been completed."

Done when the user has approved the script. Do not generate audio before that: every run costs
credits.

## 3. Generate the voiceover

```bash
S=~/.agents/skills/make-explainer-video
bash "$S/scripts/speech.sh" tts script.md public/voiceover/<comp-id>
```

It writes `scene-01-<id>.mp3`, `scene-02-<id>.mp3`... (Remotion's voiceover naming) and regenerates
every scene each run. Done when one mp3 per scene exists and the user has listened to at least the
first one. An HTTP failure prints one `Error:` line with the status, never the response body.
The wrapper reads voice preferences from the skill's config and credentials only from injected
process variables. It never loads a `.env`. Do not regenerate a setup clip every time; only run
an explicit smoke test when requested or when diagnosing a failure, and keep its files in `/tmp`.

## 4. Build the composition

Load the Remotion skills' `remotion-markup/voiceover.md` and follow it from "Dynamic composition
duration with calculateMetadata" onward; skip its ElevenLabs section, the mp3 files already exist.
Also load `audio.md` and `multi-scene-video.md` from the same folder.

- Scene length comes from each mp3's duration, so visuals follow the voice.
- Music: ask the user for a track (put it in `public/music/`); play it at volume about 0.1-0.15
  under the voice. Do not invent or download tracks without the user choosing one.
- Sound effects: `sfx.md`. Word-by-word captions are optional: `remotion-captions`.

Check visuals sparingly, or the conversation grows until the model API times out: build and review
one scene at a time, render at most 3 stills per scene (start, middle, end), and delete the stills
afterwards. Never load dozens of frames. Stop any Studio server you started.

Done when the Studio preview plays with voice and music in sync. Open the preview
(`remotion-studio` skill); only render when the user explicitly asks.

## Reference

- **Voices.** `bash "$S/scripts/speech.sh" voices en-GB` lists offered voices and their styles.
  Change `voice` and `style` in `voice.config.json`; use `null` for no style. Old voice/style
  environment variables are ignored.
- **Ollie** is `en-GB-Ollie:DragonHDLatestNeural` (Dragon HD): no styles, no `<prosody>` or
  `<emphasis>`, so pace and tone are controlled only by the text.
- **Styles** exist on MAI-Voice-2.1 voices (e.g. `en-US-Ethan:MAI-Voice-2.1`: `joyful`,
  `determined`) and `en-GB-RyanNeural` (`cheerful`, `chat`). The documented British MAI voices
  (Emily, Harry) were not on this resource when last checked.
- **MAI-Voice is in preview**: generate once and keep the mp3s.
- **Tests** (no vault access or Azure credits):
  ```bash
  node --disable-warning=ExperimentalWarning --experimental-strip-types \
    --test "$S"/scripts/*.test.ts
  ```
  Covers parsing, SSML, endpoint normalization/validation, tracked voice config, ignoring legacy
  `.env` files, CLI audio output, voice listing, and private response-body suppression.
- **Why these checks:** the old tests supplied a root endpoint and voice variables directly, so
  they missed both existing URL paths (HTTP 404) and the real on-disk config-loading path.
- **REST reference:**
  https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech
