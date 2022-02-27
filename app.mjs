import { program, Option } from 'commander';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import FastifyServer from 'fastify';
import FastifyStatic from 'fastify-static';
import { Server as BareServer } from '../bare-server-node/Server.mjs';
import { Server as HTTPServer } from 'node:http';
import { Builder } from '../toomanyproxies/Builder.mjs';
import './Builder.mjs';

program
.addOption(new Option('--bd, --bare-directory <URL>', 'Bare URL directory.').default('/bare/'))
.addOption(new Option('--td, --tomp-directory <URL>', 'TOMP directory.').default('/tomp/'))
.addOption(new Option('--h, --host <string>', 'Hostname to listen on').default('localhost'))
.addOption(new Option('--p, --port <number>', 'Port to listen on').default(80).env('PORT'))
.addOption(new Option('--e, --errors', 'Error logging').default(false))
;

program.parse(process.argv);

const options = program.opts();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const public_dir = join(__dirname, 'public');
const builder_folder = join(public_dir, options.tompDirectory);
const builder = new Builder(builder_folder);
console.info('Created builder on folder:', builder_folder);

const emitter = builder.watch();

emitter.on('error', errors => {
	for(let error of errors){
		console.error(error);
	}

	console.error('Failure building TOMP');
});

emitter.on('bulit', () => {
	console.log('Successfully built TOMP');
});

const bare = new BareServer(options.bareDirectory, options.error);
console.info('Created Bare Server on directory:', options.bareDirectory);
console.info('Error logging is', options.errors ? 'enabled.' : 'disabled.');

const http = new HTTPServer();
console.info('Created HTTP server.');

let fastify_handler = () => {};

const fastify = new FastifyServer({
	serverFactory(handler){
		fastify_handler = handler;
		return http;
	},
});

console.log(public_dir);
fastify.register(FastifyStatic, {
	root: public_dir,
	list: {
		names: [ 'tests' ],
		format: 'html',
		render: (dirs, files) =>
`<!DOCTYPE HTML>
<html>
	<head>
		<meta charset="utf-8" />
		<title>Directory Listing</title>
		</head>
	<body>
		<h1>Directory Listing</h1>
		<hr />
		<table>
			<thead>
				<tr>
					<th>Name</th>
				</tr>
			</thead>
			<tbody>
				${dirs.map(file => '<tr><td><a href=' + JSON.stringify('.' + file.href + '/') + '>' + file.name + '/</a></td></tr>').join('\n  ')}
				${files.map(file => '<tr><td><a href=' + JSON.stringify('.' + file.href) + '>' + file.name + '</a></td></tr>').join('\n  ')}
			</tbody>
		</table>
	</body>
</html>`,
	},
});

http.on('request', (req, res) => {
	if(bare.route_request(req, res))return;
	fastify_handler(req, res);
});

http.on('upgrade', (req, socket, head) => {
	if(bare.route_upgrade(req, socket, head))return;
	socket.end();
});

fastify.listen(options.port, options.host, (error, url) => {
	if(error){
		throw error;
	}

	console.log('HTTP server listening. View live at', url);
});