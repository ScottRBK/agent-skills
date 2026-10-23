#!/usr/bin/env -S node --experimental-strip-types
// Usage: bash speech.sh voices [filter]   e.g. bash speech.sh voices en-GB
// Lists the voices your resource offers, with the emotion styles each one accepts.
import {loadSkillConfig, run} from './env.ts';

await run(async () => {
	const filter = (process.argv[2] ?? '').toLowerCase();
	const config = loadSkillConfig();
	const response = await fetch(config.url.replace('/v1', '/voices/list'), {
		redirect: 'error',
		signal: AbortSignal.timeout(30000),
		headers: {'Ocp-Apim-Subscription-Key': config.key},
	});

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}

	const voices = (await response.json()) as {
		ShortName: string;
		Gender: string;
		VoiceType: string;
		StyleList?: string[];
	}[];

	for (const v of voices) {
		if (!`${v.ShortName} ${v.Gender} ${v.VoiceType}`.toLowerCase().includes(filter)) continue;
		const styles = v.StyleList?.join(',') ?? '-';
		console.log(`${v.ShortName}\t${v.Gender}\t${v.VoiceType}\t${styles}`);
	}
});
