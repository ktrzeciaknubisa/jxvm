// Copyright & License details are available under JXCORE_LICENSE file

var https = require('https');
var url = require("url");
var fs = require("fs");
var path = require("path");
var AdmZip = require("adm-zip");

var common = require("./common.js");
var jx_utils = require("./jx_utils.js");
var db = require("./db.js");
var console = jx_utils.console;

var localZip = path.join(__dirname, "..", "versions", "downloaded.zip");


exports.download = function (input, cb) {

  try {
    var file = fs.createWriteStream(localZip);
  } catch (ex) {
    cb("Cannot create local file: " + localZip.replace(process.cwd(), "."));
    return;
  }

  var options = url.parse(input.url);
  options.rejectUnauthorized = false;

  var req = null;

  var _exit = function (str) {
    if (req)
      req.abort();

    str = console.setColor("Cannot download file:", input.url, "\n", "red") + str;

    cb(str);
    return;
  };

  req = https.get(options, function (res) {

    if (res.statusCode !== 200)
      return _exit(
        console.setColor("Error status code:", res.statusCode, "red") + "\n" +
        console.setColor("Required version might not be supported for that platform:", "magenta") + "\n" +
        console.setColor("  version  :", input.version) + "\n" +
        console.setColor("  engine   :", input.engine) + "\n" +
        console.setColor("  arch     :", input.arch) + "\n"
      );

    if (!res.headers || res.headers["content-type"] !== "application/zip")
      return _exit(
        console.setColor("Invalid content-type:", res.headers["content-type"], "red")
      );

    var bytes = res.headers["content-length"] || 0;
    var downloaded = 0;
    res.pipe(file);

    var writePercent = function (downloaded) {
      var str = "";
      if (!isNaN(downloaded)) {
        if (bytes)
          str = Number(downloaded * 100 / bytes).toFixed(2) + " %";
        else
          str = "? %";
      } else {
        str = downloaded;
      }

      common.clearLine();
      common.logPair("Progress", str);
    };

    common.logPair("Downloading", input.url + "\n", "green");
    res.on('data', function (chunk) {
      downloaded += chunk.length;
      writePercent(downloaded);
    }).on('end', function () {
      writePercent(console.setColor("Done", "green"));

      file.on('finish', function () {
        file.close();
        cb(false);
      });

      file.end();
    });
  }).on('error', function (e) {
    cb("Cannot download file " + input.url + "\n" + e);
  });
};


exports.unzip = function (input, cb) {

  if (!fs.existsSync(localZip))
    return cb(console.setColor("Cannot unzip file:", localZip, "\nFile does not exist.", "red"));

  if (!fs.existsSync(input.localDir))
    fs.mkdirSync(input.localDir);

  var zip = new AdmZip(localZip);
  var zipEntries = zip.getEntries();

  var writeStatus = function (name) {
    common.clearLine();
    common.logPair("Unzipping", name);
  };

  // needed one empty line
  console.log("");
  zipEntries.forEach(function (zipEntry) {
    writeStatus(zipEntry.name);
    zip.extractEntryTo(zipEntry, input.localDir, /*maintainEntryPath*/false, /*overwrite*/true);

    if (zipEntry.name === "jx") {
      try {
        fs.chmod(path.join(input.localDir, "jx"), 0755);
      } catch (ex) {
      }
    }
  });

  writeStatus(console.setColor("Done", "green"));
  db.addEntry(input);
  try {
    fs.unlinkSync(localZip);
  } catch (ex) {
  }
  cb();
};
