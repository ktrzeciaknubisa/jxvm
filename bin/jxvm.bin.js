#!/usr/bin/env node

// Copyright & License details are available under JXCORE_LICENSE file

var fs = require('fs');
var path = require('path');


var jxtools = require('jxtools');
var common = require('../lib/common.js');

if (!common.init())
  return;

if (process.argv.length <= 2)
  return jxcore.utils.console.error('Too little arguments.');

var argv2 = process.argv[2].replace("--", "");

var parsedArgv = jxcore.utils.argv.parse();
if (parsedArgv.h || parsedArgv.help) {
  jxcore.utils.console.log(common.getHelp(argv2));
  return;
}

var files = fs.readdirSync(path.join(__dirname,  '../lib/commands'));
if (files.indexOf(argv2 + '.js') === -1) {
  jxcore.utils.console.error('Unknown command', argv2);
  process.exit(-1);
}

var mod = require(path.join('../lib/commands', argv2 + '.js'));
var input = common.getUserInput();

mod.run(input, function (err) {
  if (err)
    jxcore.utils.console.error(err);
});

