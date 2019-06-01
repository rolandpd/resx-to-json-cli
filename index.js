#!/usr/bin/env node

var program = require('commander');
var process = require('process');
var version = require('./package.json').version;

var parseResX = require('./parse-resx');

program
  .version(version)
  .option('-b, --buildDateTime [name]', 'Add current local date/time to outut. Specify a name. Define module with --meta.', '')
  .option('-c, --categories', 'Use filename to build categories')
  .option('-u, --underscores', 'Use underscore instead of dash in culture, e.g. en_US')
  .option('-m, --meta [module]', 'Module name for meta information (corresponding files must exist)', 'app')
  .option('-s, --srcDir [dir]', 'Specify source files as glob [**/*.resx]', '**/*.resx')
  .option('-t, --targetDir [dir]', 'Specify target directory [.]', '.')
  .parse(process.argv);

parseResX(program.srcDir, program.targetDir, {
  underscores: program.underscores,
  categories: program.categories,
  metaModule: program.meta,
  buildDateTime: program.buildDateTime || false
}, function (err) {
  if (err) {
    throw new Error(err);
  }
  process.exit()
});
