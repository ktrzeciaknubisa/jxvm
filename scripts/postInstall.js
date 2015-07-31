#!/usr/bin/env node

// Copyright & License details are available under JXCORE_LICENSE file

var fs = require("fs");
var path = require("path");

var common = require("../lib/common.js");
var jx_utils = require("../lib/jx_utils.js");

try {
  if (!fs.existsSync(common.dirVersions))
    fs.mkdirSync(common.dirVersions);
} catch (ex) {
  console.error("Cannot create local dir: " + common.dirVersions, "\n", ex);
  process.exit();
}

try {
  fs.chmod(common.dirVersions, 0777);
} catch (ex) {
  console.error("Cannot chmod local dir: " + common.dirVersions, "\n", ex);
  process.exit();
}

