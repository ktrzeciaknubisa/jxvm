// Copyright & License details are available under JXCORE_LICENSE file

var fs = require("fs");
var path = require("path");

var db = null;
var dbFile = path.join(__dirname, "..", "db.json");

var save = function() {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 4));
};

try {
  db = JSON.parse(fs.readFileSync(dbFile).toString());
} catch (ex) {
  db = {
    "versions" : []
  };
  save();
}

exports.versions = db.versions;


exports.addEntry = function(input) {

  db.versions.push(input);
  save();
};

