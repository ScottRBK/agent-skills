#!/usr/bin/env -S node --experimental-strip-types
// Usage: bash speech.sh tts <script.md> <outDir>
// Writes one mp3 per "## scene-id" in the script, e.g. <outDir>/scene-01-intro.mp3
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {loadSkillConfig, run} from './env.ts';
import {buildSsml, parseScenes, sceneFileName} from './lib.ts';

const [scriptPath, outDir] = process.argv.slice(2);
if (!scriptPath || !outDir) {
	console.error('Usage: bash speech.sh tts <script.md> <outDir>');
	process.exit(1);
}

await run(async () => {
	const config = loadSkillConfig();
	const scenes = parseScenes(readFileSync(scriptPath, 'utf8'));
	mkdirSync(outDir, {recursive: true});

	console.log(`Voice: ${config.voice}${config.style ? ` (style: ${config.style})` : ''}`);

	for (const [index, scene] of scenes.entries()) {
		const response = await fetch(config.url, {
			method: 'POST',
			redirect: 'error',
			signal: AbortSignal.timeout(90000),
			headers: {
				'Ocp-Apim-Subscription-Key': config.key,
				'Content-Type': 'application/ssml+xml',
				'X-Microsoft-OutputFormat': 'audio-24khz-160kbitrate-mono-mp3',
				'User-Agent': 'make-explainer-video',
			},
			body: buildSsml({text: scene.text, voice: config.voice, style: config.style}),
		});

		if (!response.ok) {
			throw new Error(`Scene "${scene.id}" failed: HTTP ${response.status}`);
		}

		const file = join(outDir, sceneFileName(index, scene.id));
		writeFileSync(file, Buffer.from(await response.arrayBuffer()));
		console.log(`✔ ${file}`);
	}
});
