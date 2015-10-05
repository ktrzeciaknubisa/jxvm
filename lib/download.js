// Copyright & License details are available under JXCORE_LICENSE file

var https = require('https');
var url = require("url");
var fs = require("fs");
var path = require("path");
var AdmZip = require("adm-zip");

var common = require("./common.js");
var db = require("./db.js");
var console = jxcore.utils.console;

var localZip = path.join(common.dirVersions, "downloaded.zip");


exports.download = function (input, cb) {

  var dir = path.dirname(localZip);

  try {
    if (!fs.existsSync(dir))
      fs.mkdirSync(dir);
  } catch (ex) {
    return cb("Cannot create local dir: " + dir + ". " + ex);
  }

  try {
    var file = fs.createWriteStream(localZip);
  } catch (ex) {
    return cb("Cannot create local file: " + localZip.replace(process.cwd(), "."));
  }

  var options = url.parse(input.url);
  options.rejectUnauthorized = false;

  var req = null;

  var _exit = function (err) {
    if (req)
      req.abort();

    if (err)
      err = console.setColor("Cannot download file:", input.url, "\n", "red") + err;

    cb(err);
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

      common.clearLineAbove();
      common.logPair("Progress", str);
    };

    common.logPair("Downloading", input.url + "\n", "green");
    res.on('data', function (chunk) {
      downloaded += chunk.length;
      writePercent(downloaded);
    }).on('end', function () {
      writePercent("Done");

      file.on('finish', function () {
        file.close();
        return _exit(false);
      });

      file.end();
    });
  }).on('error', function (e) {
    return _exit(e);
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
    common.clearLineAbove();
    common.logPair("Unzipping", name);
  };

  // needed one empty line
  console.log("");
  zipEntries.forEach(function (zipEntry) {
    writeStatus(zipEntry.name);
    zip.extractEntryTo(zipEntry, input.localDir, /*maintainEntryPath*/false, /*overwrite*/true);

    if (!common.isWindows && zipEntry.name === "jx") {
      try {
        fs.chmodSync(path.join(input.localDir, "jx"), 0755);
      } catch (ex) {
      }
    }
  });

  writeStatus("Done");
  db.addEntry(input);
  try {
    fs.unlinkSync(localZip);
  } catch (ex) {
  }
  cb();
};


exports.getLatestInfo = function (cb) {

  var _url = "https://jxcore.s3.amazonaws.com/latest.txt";
  var options = url.parse(_url);
  options.rejectUnauthorized = false;

  var req = null;

  var _exit = function (str, ret) {
    if (req)
      req.abort();

    if (str)
      str = console.setColor("Cannot fetch JXcore latest release info:", _url, "\n", "red") + str;

    cb(str, ret);
    return;
  };

  common.logPair("Fetching JXcore latest release info", "...");
  req = https.get(options, function (res) {

    if (res.statusCode !== 200)
      return _exit(console.setColor("Error status code:", res.statusCode, "red"));

    if (!res.headers || res.headers["content-type"] !== "text/plain")
      return _exit(console.setColor("Invalid content-type:", res.headers["content-type"], "red"));

    var body = "";
    res.on('data', function (chunk) {
      body += chunk;
    }).on('end', function () {
      // expected body e.g.: https://jxcore.s3.amazonaws.com/0304|Beta-0.3.0.4
      var arr = body.split("|");
      if (arr.length !== 2)
        return _exit("Invalid data: " + body);

      common.clearLineAbove();
      common.logPair("Fetching JXcore latest release info", arr[1], "green");

      return _exit(false, {urlPath: arr[0], version: arr[1]});
    });
  }).on('error', function (e) {
    return _exit(e);
  });
};