import assert from 'node:assert/strict';
import {describe, test} from 'node:test';
import {buildSsml, loadConfig, parseScenes, sceneFileName} from './lib.ts';

describe('parseScenes', () => {
	test('splits on "## id" headings and joins wrapped lines', () => {
		const md = `# My video\n\n## intro\nHello there.\nThis wraps.\n\n## outro\nBye.\n`;
		const scenes = parseScenes(md);
		assert.deepEqual(scenes, [
			{id: 'intro', text: 'Hello there. This wraps.'},
			{id: 'outro', text: 'Bye.'},
		]);
	});

	test('rejects a script with no scenes', () => {
		const markdown = 'just some text';
		assert.throws(() => parseScenes(markdown), /no scenes/i);
	});

	test('rejects an empty scene and names it', () => {
		const markdown = '## intro\n\n## outro\nBye.';
		assert.throws(() => parseScenes(markdown), /intro/);
	});

	test('rejects duplicate scene ids', () => {
		const markdown = '## a\nx\n## a\ny';
		assert.throws(() => parseScenes(markdown), /duplicate.*a/i);
	});

	test('rejects ids that are unsafe as file names', () => {
		const markdown = '## ../evil\nx';
		assert.throws(() => parseScenes(markdown), /id/i);
	});
});

describe('buildSsml', () => {
	test('uses the locale from the voice name', () => {
		const input = {text: 'Hi', voice: 'en-GB-Ollie:DragonHDLatestNeural', style: null};
		const ssml = buildSsml(input);
		assert.ok(ssml.includes('xml:lang="en-GB"'));
		assert.ok(ssml.includes('<voice name="en-GB-Ollie:DragonHDLatestNeural">Hi</voice>'));
		assert.ok(!ssml.includes('express-as'));
	});

	test('escapes XML characters in the narration', () => {
		const input = {
			text: 'Fish & <chips> "now"',
			voice: 'en-GB-Ollie:DragonHDLatestNeural',
			style: null,
		};
		const ssml = buildSsml(input);
		assert.ok(ssml.includes('Fish &amp; &lt;chips&gt; &quot;now&quot;'));
		assert.ok(!ssml.includes('<chips>'));
	});

	test('wraps the text in express-as only when a style is given', () => {
		const input = {text: 'Hi', voice: 'en-US-Ethan:MAI-Voice-2.1', style: 'joyful'};
		const ssml = buildSsml(input);
		assert.ok(ssml.includes('<mstts:express-as style="joyful">Hi</mstts:express-as>'));
	});
});

describe('loadConfig', () => {
	const ok = {
		AZURE_SPEECH_ENDPOINT: 'https://x.cognitiveservices.azure.com/',
		AZURE_SPEECH_KEY: 'test-key-not-a-real-secret',
	};
	const settings = {voice: 'en-GB-Ollie:DragonHDLatestNeural', style: ''};

	test('builds the synthesis url without a double slash and treats blank style as none', () => {
		const env = {...ok};
		const config = loadConfig(env, settings);
		assert.equal(config.url, 'https://x.cognitiveservices.azure.com/tts/cognitiveservices/v1');
		assert.equal(config.style, null);
	});

	test('accepts resource URLs with an existing path without duplicating the speech path', () => {
		const endpoints = [
			'https://x.cognitiveservices.azure.com/speech',
			'https://x.cognitiveservices.azure.com/tts/cognitiveservices/v1',
		];
		for (const endpoint of endpoints) {
			const config = loadConfig({...ok, AZURE_SPEECH_ENDPOINT: endpoint}, settings);
			assert.equal(
				config.url, 'https://x.cognitiveservices.azure.com/tts/cognitiveservices/v1',
			);
		}
	});

	test('reads voice and style from settings, not environment overrides', () => {
		const env = {...ok, AZURE_SPEECH_VOICE: 'old-voice', AZURE_SPEECH_STYLE: 'old-style'};
		const config = loadConfig(env, {voice: settings.voice, style: 'cheerful'});
		assert.equal(config.voice, 'en-GB-Ollie:DragonHDLatestNeural');
		assert.equal(config.style, 'cheerful');
	});

	test('rejects unsafe endpoints without echoing private input', () => {
		const endpoints = [
			'private-endpoint-without-a-scheme',
			'http://test.cognitiveservices.azure.com',
			'https://untrusted.example.com',
			'https://user:private-password@test.cognitiveservices.azure.com',
		];
		for (const endpoint of endpoints) {
			assert.throws(
				() => loadConfig({...ok, AZURE_SPEECH_ENDPOINT: endpoint}, settings),
				(error: Error) => {
					assert.match(error.message, /AZURE_SPEECH_ENDPOINT/);
					assert.ok(!error.message.includes(endpoint));
					assert.ok(!error.message.includes('private-password'));
					return true;
				},
			);
		}
	});

	test('rejects invalid voice settings with a safe config error', () => {
		const invalid = [null, {}, {voice: ''}, {voice: settings.voice, style: 42}];
		for (const value of invalid) {
			assert.throws(() => loadConfig(ok, value as typeof settings), /voice.config.json/);
		}
	});

	test('supports regional Speech endpoints without the resource-only /tts prefix', () => {
		const env = {...ok, AZURE_SPEECH_ENDPOINT: 'https://uksouth.tts.speech.microsoft.com/'};
		const config = loadConfig(env, settings);
		assert.equal(config.url, 'https://uksouth.tts.speech.microsoft.com/cognitiveservices/v1');
	});

	test('names the missing variable but never echoes credentials', () => {
		const env = {...ok, AZURE_SPEECH_KEY: ''};
		assert.throws(() => loadConfig(env, settings), /AZURE_SPEECH_KEY/);
		assert.throws(
			() => loadConfig({...ok, AZURE_SPEECH_ENDPOINT: ''}, settings),
			(error: Error) => {
				assert.ok(!error.message.includes(ok.AZURE_SPEECH_KEY));
				assert.ok(!error.message.includes('.env'));
				return true;
			},
		);
	});
});

test('sceneFileName follows Remotion voiceover naming', () => {
	const first = sceneFileName(0, 'intro');
	const twelfth = sceneFileName(11, 'outro');
	assert.equal(first, 'scene-01-intro.mp3');
	assert.equal(twelfth, 'scene-12-outro.mp3');
});
