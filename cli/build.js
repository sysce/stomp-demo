import Builder from '../Builder.js';
import { cwd } from 'node:process';
import { resolve } from 'node:path';

export default async function (output, { bare, stomp, watch, development }) {
	if (development) {
		console.log('Building in DEVELOPMENT mode');
	} else {
		console.log('Building in PRODUCTION mode');
	}

	output = resolve(cwd(), output);

	const builder = new Builder(output, bare, stomp, development);
	console.info('Created builder on folder:', output);

	if (watch) {
		console.info('Watching directory for changes');

		const emitter = builder.watch();

		emitter.on('error', errors => {
			for (let error of errors) {
				console.error(error);
			}

			console.error('Failure building');
		});

		emitter.on('bulit', () => {
			console.log('Successfully built');
		});
	} else {
		try {
			await builder.build();
			console.log('Success');
			process.exit();
		} catch (err) {
			for (let error of [].concat(err)) {
				console.error(error);
			}

			console.error('Failure');
		}
	}
}
