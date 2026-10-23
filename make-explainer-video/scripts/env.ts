import {readFileSync} from 'node:fs';
import {loadConfig} from './lib.ts';

// Only public voice preferences live on disk. Credentials come from envault's environment.
export const loadSkillConfig = () => {
	let settings;
	try {
		const file = new URL('../voice.config.json', import.meta.url);
		settings = JSON.parse(readFileSync(file, 'utf8'));
	} catch {
		throw new Error('Cannot read voice.config.json. Check that it contains valid JSON.');
	}
	return loadConfig(process.env, settings);
};

// Runs a script and prints failures as one clear line instead of a stack trace.
export const run = async (fn: () => Promise<void>) => {
	try {
		await fn();
	} catch (error) {
		console.error(`Error: ${error instanceof Error ? error.message : error}`);
		process.exitCode = 1;
	}
};
