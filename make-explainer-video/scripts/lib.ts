export type Scene = {id: string; text: string};

export type Config = {
	url: string;
	key: string;
	voice: string;
	style: string | null;
};

// A script is markdown: each "## scene-id" heading starts a scene, with narration below it.
export const parseScenes = (markdown: string): Scene[] => {
	const raw: {id: string; lines: string[]}[] = [];

	for (const line of markdown.split('\n')) {
		const heading = line.match(/^##\s+(.*?)\s*$/);
		if (heading) {
			raw.push({id: heading[1], lines: []});
		} else if (raw.length > 0) {
			raw[raw.length - 1].lines.push(line);
		}
	}

	if (raw.length === 0) {
		throw new Error('No scenes found. Start each scene with a "## scene-id" heading.');
	}

	const seen = new Set<string>();
	return raw.map(({id, lines}) => {
		if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
			throw new Error(`Invalid scene id "${id}": use lowercase letters, digits and dashes.`);
		}

		if (seen.has(id)) {
			throw new Error(`Duplicate scene id "${id}".`);
		}

		seen.add(id);
		const text = lines.join(' ').replace(/\s+/g, ' ').trim();
		if (!text) {
			throw new Error(`Scene "${id}" has no narration text.`);
		}

		return {id, text};
	});
};

const escapeXml = (s: string) =>
	s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

export const buildSsml = ({
	text,
	voice,
	style,
}: {
	text: string;
	voice: string;
	style: string | null;
}) => {
	const locale = voice.split('-').slice(0, 2).join('-');
	const body = escapeXml(text);
	const inner = style
		? `<mstts:express-as style="${escapeXml(style)}">${body}</mstts:express-as>`
		: body;
	const namespaces =
		'xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts"';
	const voiceTag = `<voice name="${escapeXml(voice)}">${inner}</voice>`;

	return `<speak version="1.0" ${namespaces} xml:lang="${locale}">${voiceTag}</speak>`;
};

export type VoiceSettings = {voice: string; style?: string | null};

export const loadConfig = (
	env: Record<string, string | undefined>,
	settings: VoiceSettings,
): Config => {
	for (const name of ['AZURE_SPEECH_ENDPOINT', 'AZURE_SPEECH_KEY']) {
		if (!env[name]?.trim()) {
			throw new Error(
				`${name} is not set. Use scripts/speech.sh to inject vault credentials.`,
			);
		}
	}

	if (
		!settings || typeof settings.voice !== 'string' || !settings.voice.trim() ||
		(settings.style != null && typeof settings.style !== 'string')
	) {
		throw new Error(
			'Invalid voice.config.json: set voice to a name and style to text or null.',
		);
	}

	let endpoint: URL;
	try {
		endpoint = new URL(env.AZURE_SPEECH_ENDPOINT!.trim());
	} catch {
		throw new Error('AZURE_SPEECH_ENDPOINT must be a valid Azure HTTPS URL.');
	}
	const regional = endpoint.hostname.endsWith('.tts.speech.microsoft.com');
	const resource = endpoint.hostname.endsWith('.cognitiveservices.azure.com');
	if (
		endpoint.protocol !== 'https:' || endpoint.username || endpoint.password ||
		(!regional && !resource)
	) {
		throw new Error(
			'AZURE_SPEECH_ENDPOINT must be an Azure Speech HTTPS URL without credentials.',
		);
	}
	// Resource URLs may contain a portal/API path already; use only their origin.
	const path = regional ? '/cognitiveservices/v1' : '/tts/cognitiveservices/v1';
	return {
		url: new URL(path, endpoint.origin).href,
		key: env.AZURE_SPEECH_KEY!.trim(),
		voice: settings.voice.trim(),
		style: settings.style?.trim() || null,
	};
};

// Matches Remotion's voiceover guide: scene-01-intro.mp3
export const sceneFileName = (index: number, id: string) =>
	`scene-${String(index + 1).padStart(2, '0')}-${id}.mp3`;
