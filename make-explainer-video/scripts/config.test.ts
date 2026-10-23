import assert from 'node:assert/strict';
import {copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {test} from 'node:test';

const fixture = (t: {after: (fn: () => void) => void}) => {
	const dir = mkdtempSync(join(tmpdir(), 'speech-config-test-'));
	t.after(() => rmSync(dir, {recursive: true, force: true}));
	mkdirSync(join(dir, 'scripts'));
	for (const file of ['env.ts', 'lib.ts']) {
		copyFileSync(new URL(file, import.meta.url), join(dir, 'scripts', file));
	}
	writeFileSync(join(dir, 'voice.config.json'), JSON.stringify({
		voice: 'en-GB-RyanNeural', style: 'cheerful',
	}));
	writeFileSync(join(dir, '.env'), [
		'AZURE_SPEECH_KEY=legacy-test-key',
		'AZURE_SPEECH_ENDPOINT=https://legacy.cognitiveservices.azure.com',
		'AZURE_SPEECH_VOICE=legacy-voice',
	].join('\n'));
	return dir;
};

test('loads tracked voice settings from any working directory and ignores legacy .env', (t) => {
	const dir = fixture(t);
	const modulePath = join(dir, 'scripts', 'env.ts');
	const code = `import {loadSkillConfig} from ${JSON.stringify(modulePath)};
		console.log(JSON.stringify(loadSkillConfig()));`;
	const result = spawnSync(process.execPath, [
		'--disable-warning=ExperimentalWarning', '--experimental-strip-types',
		'--input-type=module', '-e', code,
	], {
		cwd: tmpdir(), encoding: 'utf8',
		env: {
			AZURE_SPEECH_KEY: 'injected-test-key',
			AZURE_SPEECH_ENDPOINT: 'https://test.cognitiveservices.azure.com/speech',
			AZURE_SPEECH_VOICE: 'ignored-env-voice',
			AZURE_SPEECH_STYLE: 'ignored-env-style',
		},
	});
	assert.equal(result.status, 0, result.stderr);
	assert.deepEqual(JSON.parse(result.stdout), {
		url: 'https://test.cognitiveservices.azure.com/tts/cognitiveservices/v1',
		key: 'injected-test-key', voice: 'en-GB-RyanNeural', style: 'cheerful',
	});
});

test('a legacy .env cannot supply missing vault credentials', (t) => {
	const dir = fixture(t);
	const modulePath = join(dir, 'scripts', 'env.ts');
	const code = `import {loadSkillConfig, run} from ${JSON.stringify(modulePath)};
		await run(async () => { loadSkillConfig(); });`;
	const result = spawnSync(process.execPath, [
		'--disable-warning=ExperimentalWarning', '--experimental-strip-types',
		'--input-type=module', '-e', code,
	], {cwd: dir, encoding: 'utf8', env: {}});
	assert.equal(result.status, 1);
	assert.match(result.stderr, /AZURE_SPEECH_ENDPOINT.*vault credentials/);
	assert.ok(!result.stderr.includes('legacy-test-key'));
	assert.ok(!result.stderr.includes('legacy.cognitiveservices.azure.com'));
	assert.equal(result.stdout, '');
});
