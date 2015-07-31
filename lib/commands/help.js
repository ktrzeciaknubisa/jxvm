// Copyright & License details are available under JXCORE_LICENSE file

var common = require("../common.js");
var jx_utils = require("../jx_utils.js");
var console = jx_utils.console;

exports.displayCommandUsage = function (cmd, str) {

  if (str) {
    console.error(str, "\n");
    process.exit();
    return;
  }

  if (cmd === "use") {
    console.log("JXcore Version Manager\n", "cyan");

    console.log("    use <version> [<engine>] [<arch>]\n");
    console.log("where:");
    console.log("    <version>  : numeric version number, e.g.: 0304");
    console.log("    <engine>   : js engine type: 'sm' or 'v8'");
    console.log("                 This is optional. If omitted - 'v8' is used as default.");
    console.log("    <arch>     : architecture 'ia32' or 'x64'.");
    console.log("                 This is optional. If omitted - current platform's arch is used.");
    console.log("");
    console.log("The command switches jx binary to use the desired version.");
    console.log("If the binary is not installed yet, it gets downloaded.");
    console.log("");
    console.log("examples:");
    console.log("    > jxvm use 237");
    console.log("    > jxvm use 304 sm");
    console.log("    > jxvm use 0.3.0.4 sm 32");



  } else {
    exports.displayUsage("Invalid command: " + cmd);
  }

  console.log("");

  process.exit();
};

exports.displayUsage = function (str) {

  console.log("JXcore Version Manager\n", "cyan");

  console.log("Usage: jxvm <command>\n");
  console.log("commands:");
  console.log("    use <version> [<engine>] [<arch>]");
  console.log("    help <cmd>\n");

  if (str)
    console.error(str, "\n");

  process.exit();
};


exports.run = function (input) {

  var argv = common.parsedArgv;
  if (!argv.help.value)
    return exports.displayUsage("Please provide a command.");

  exports.displayCommandUsage(argv.help.value);
};