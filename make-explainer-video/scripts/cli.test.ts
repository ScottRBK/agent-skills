import assert from 'node:assert/strict';
import {copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {test} from 'node:test';

const fixture = (t: {after: (fn: () => void) => void}, mockFetch: string) => {
	const dir = mkdtempSync(join(tmpdir(), 'speech-cli-test-'));
	t.after(() => rmSync(dir, {recursive: true, force: true}));
	mkdirSync(join(dir, 'scripts'));
	for (const file of ['env.ts', 'lib.ts', 'tts.ts', 'voices.ts']) {
		copyFileSync(new URL(file, import.meta.url), join(dir, 'scripts', file));
	}
	writeFileSync(join(dir, 'voice.config.json'), JSON.stringify({
		voice: 'en-GB-RyanNeural', style: null,
	}));
	writeFileSync(join(dir, 'mock-azure.mjs'), mockFetch);
	writeFileSync(join(dir, 'script.md'), '## intro\nHi & welcome.\n');
	return dir;
};

const execute = (dir: string, command: string, args: string[]) => spawnSync(process.execPath, [
	'--disable-warning=ExperimentalWarning', '--experimental-strip-types',
	'--import', join(dir, 'mock-azure.mjs'), join(dir, 'scripts', `${command}.ts`), ...args,
], {
	cwd: tmpdir(), encoding: 'utf8', timeout: 10000,
	env: {
		AZURE_SPEECH_KEY: 'fake-cli-test-key',
		AZURE_SPEECH_ENDPOINT: 'https://test.cognitiveservices.azure.com/speech',
	},
});

test('entry point rejects unknown commands before accessing the vault', () => {
	const script = new URL('speech.sh', import.meta.url).pathname;
	const result = spawnSync('bash', [script, 'unknown'], {encoding: 'utf8', timeout: 10000});
	assert.equal(result.status, 1);
	assert.match(result.stderr, /Usage:.*speech.sh/);
	assert.equal(result.stdout, '');
});

test('TTS CLI uses vault-style env and tracked voice config to write scene audio', (t) => {
	const dir = fixture(t, `
		import assert from 'node:assert/strict';
		globalThis.fetch = async (url, options) => {
			assert.equal(String(url),
				'https://test.cognitiveservices.azure.com/tts/cognitiveservices/v1');
			assert.equal(options.headers['Ocp-Apim-Subscription-Key'], 'fake-cli-test-key');
			assert.equal(options.redirect, 'error');
			assert.ok(options.body.includes('en-GB-RyanNeural'));
			assert.ok(options.body.includes('Hi &amp; welcome.'));
			return new Response('sample-audio-bytes', {
				status: 200, headers: {'Content-Type': 'audio/mpeg'},
			});
		};
	`);
	const out = join(dir, 'audio');
	const result = execute(dir, 'tts', [join(dir, 'script.md'), out]);
	assert.equal(result.status, 0, result.stderr);
	assert.equal(readFileSync(join(out, 'scene-01-intro.mp3'), 'utf8'), 'sample-audio-bytes');
	assert.ok(!result.stdout.includes('fake-cli-test-key'));
});

test('voice-list CLI uses the normalized endpoint and filters the offered voices', (t) => {
	const dir = fixture(t, `
		import assert from 'node:assert/strict';
		globalThis.fetch = async (url, options) => {
			assert.equal(String(url),
				'https://test.cognitiveservices.azure.com/tts/cognitiveservices/voices/list');
			assert.equal(options.headers['Ocp-Apim-Subscription-Key'], 'fake-cli-test-key');
			assert.equal(options.redirect, 'error');
			return Response.json([
				{ShortName: 'en-GB-RyanNeural', Gender: 'Male', VoiceType: 'Neural'},
				{ShortName: 'en-US-JennyNeural', Gender: 'Female', VoiceType: 'Neural'},
			]);
		};
	`);
	const result = execute(dir, 'voices', ['en-GB']);
	assert.equal(result.status, 0, result.stderr);
	assert.equal(result.stdout.trim(), 'en-GB-RyanNeural\tMale\tNeural\t-');
});

test('voice-list HTTP failures report status without leaking the response body', (t) => {
	const dir = fixture(t, `
		globalThis.fetch = async () => new Response('private-response fake-cli-test-key', {
			status: 403,
		});
	`);
	const result = execute(dir, 'voices', []);
	assert.equal(result.status, 1);
	assert.equal(result.stderr.trim(), 'Error: HTTP 403');
	assert.equal(result.stdout, '');
});

test('TTS HTTP failures report status without leaking the Azure response body', (t) => {
	const dir = fixture(t, `
		globalThis.fetch = async () => new Response('private-response fake-cli-test-key', {
			status: 401,
		});
	`);
	const result = execute(dir, 'tts', [join(dir, 'script.md'), join(dir, 'audio')]);
	assert.equal(result.status, 1);
	assert.equal(result.stderr.trim(), 'Error: Scene "intro" failed: HTTP 401');
	assert.ok(!result.stdout.includes('fake-cli-test-key'));
});
