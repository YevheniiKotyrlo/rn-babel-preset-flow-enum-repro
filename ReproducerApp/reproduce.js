/**
 * Bundles enum/index.js with this app's metro.config.js and babel.config.js
 * (`presets: ['module:@react-native/babel-preset']`), prints the bundled
 * enum/Status.js module, runs the bundle in a new Node process and prints what
 * it printed.
 *
 * Exit status: 1 while the bundle reads `Status` without declaring it, 0 once
 * the enum is declared and the bundle prints `Status.getName(initial): Active`,
 * 2 when a step fails or the run ends another way.
 *
 * @format
 */

'use strict';

const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const appDir = __dirname;
const out = path.join(appDir, 'build', 'enum.bundle.js');

function version(name) {
  return require(path.join(appDir, 'node_modules', name, 'package.json'))
    .version;
}

function verdict(code, summary) {
  console.log(`\n${summary}`);
  process.exit(code);
}

async function main() {
  console.log(
    `node ${process.version}, ${os.type()} ${os.release()} ${process.arch}, ` +
      `react-native ${version('react-native')}, ` +
      `@react-native/babel-preset ${version('@react-native/babel-preset')}, ` +
      `metro ${version('metro')}, @babel/core ${version('@babel/core')}`,
  );
  console.log(
    `babel.config.js: ${JSON.stringify(require('./babel.config.js'))}`,
  );

  const Metro = require('metro');
  const config = Metro.mergeConfig(await Metro.loadConfig({cwd: appDir}), {
    reporter: {update: () => {}},
    resetCache: true,
  });
  fs.rmSync(path.dirname(out), {recursive: true, force: true});
  fs.mkdirSync(path.dirname(out), {recursive: true});
  await Metro.runBuild(config, {
    entry: path.join(appDir, 'enum', 'index.js'),
    platform: 'android',
    dev: false,
    minify: false,
    out,
  });
  const bundle = fs.readFileSync(out, 'utf8');
  console.log(
    '\n$ metro build enum/index.js --platform android --dev false --minify false',
  );
  console.log(`wrote ${path.relative(appDir, out)}`);

  const statusModule = bundle
    .split(/\n(?=__d\()/)
    .find(
      chunk => chunk.startsWith('__d(') && /exports\.initial =/.test(chunk),
    );
  if (statusModule == null) {
    verdict(2, 'FAILED: the bundle holds no enum/Status.js module');
  }
  console.log('\nenum/Status.js in the bundle:');
  console.log(statusModule.split('\n__r(')[0].trim());

  console.log(`\n$ node ${path.relative(appDir, out)}`);
  const run = spawnSync(process.execPath, [out], {encoding: 'utf8'});
  const printed = `${run.stdout}${run.stderr}`.trim();
  const shown = printed
    .split('\n')
    .filter(line => !/^\s+at /.test(line))
    .join('\n');
  console.log(shown);
  console.log(`(exit ${run.status})`);

  const declared = /\bStatus =/.test(statusModule);
  if (
    run.status === 0 &&
    declared &&
    /^Status\.getName\(initial\): Active$/m.test(run.stdout)
  ) {
    verdict(
      0,
      'PASS: @react-native/babel-preset declared the Flow enum `Status` and the bundle printed Status.getName(initial): Active',
    );
  }
  if (
    run.status !== 0 &&
    !declared &&
    /ReferenceError: Status is not defined/.test(run.stderr)
  ) {
    verdict(
      1,
      'FAIL: @react-native/babel-preset removed the Flow enum declaration `enum Status {Active, Off}`, so the bundle throws ReferenceError: Status is not defined',
    );
  }
  verdict(
    2,
    `FAILED: the run ended another way (exit ${run.status}, enum declared: ${declared})`,
  );
}

main().catch(error => {
  console.error(error);
  verdict(2, `FAILED: ${error.message.split('\n')[0]}`);
});
