// Copyright & License details are available under JXCORE_LICENSE file

var fs = require("fs");
var path = require("path");

var common = require('./common.js');

var db = null;
var dbFile = path.join(common.dirJXVM, "db.json");

var save = function () {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 4));
  //console.log("saved");
};

try {
  db = JSON.parse(fs.readFileSync(dbFile).toString());
} catch (ex) {
  db = {
    "versions": {},
    "config": {}
  };
  //save();
}

exports.versions = db.versions;


exports.addEntry = function (input) {

  db.versions[input.uniqueSID] = input;
  save();
};

exports.getConfig = function (name) {

  if (typeof db.config === "undefined" || typeof db.config[name] === "undefined")
    return undefined;

  return db.config[name];
};

exports.setConfig = function (name, value) {

  if (typeof db.config === "undefined")
    db.config = {};

  db.config[name] = value;
  save();
};