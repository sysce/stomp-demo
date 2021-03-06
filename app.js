import { Command, Option } from 'commander';
import build from './cli/build.js';
import server from './cli/server.js';

const program = new Command();

program
	.command('server')
	.description('Start the standalone server (bareserver, webserver, compiler)')
	.addOption(
		new Option('--bd, --bare-directory <URL>', 'Bare URL directory').default(
			'/bare/'
		)
	)
	.addOption(
		new Option('--sd, --stomp-directory <URL>', 'Stomp directory').default(
			'/stomp/'
		)
	)
	.addOption(
		new Option('--h, --host <string>', 'Listening host').default('localhost')
	)
	.addOption(
		new Option('--p, --port <number>', 'Listening port').default(80).env('PORT')
	)
	.addOption(new Option('--e, --errors', 'Error logging'))
	.addOption(
		new Option(
			'--skip-bare',
			'Skip creating a Bare Server, bare-directory may be on a different URL'
		)
	)
	.addOption(new Option('--development', 'Verbose scripts, skip minification'))
	.action(server);

program
	.command('build')
	.description('Build the frontend')
	.argument(
		'<output>',
		'Location for static HTML files',
		undefined,
		'tompfrontend'
	)
	.addOption(new Option('--bd, --bare <URL>', 'Bare server').default('/bare/'))
	.addOption(
		new Option('--sd, --stomp <URL>', 'Stomp directory').default('/tomp/')
	)
	.addOption(new Option('--w, --watch', 'Watch filesystem for updates'))
	.addOption(
		new Option(
			'--development',
			'If TOMP should be configured to be more verbose and if code should be minified.'
		)
	)
	.action(build);

program.parse(process.argv);
