var path = require('path');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var Promise = require('promise');

var fs = require('fs');
var readPath = Promise.denodeify(require('glob'));
var readFile = Promise.denodeify(fs.readFile);
var writeFile = Promise.denodeify(fs.writeFile);
var parseXml = Promise.denodeify(parser.parseString);

function parseFile(filename, defaultLanguage, opts) {
  var tokens = path.basename(filename, path.extname(filename)).split('.');
  var module = tokens[0];
  var language = (tokens[1] || defaultLanguage || 'en-US').replace(/[_-]/g, opts.underscores ? '_' : '-');
  //console.log('- ' + filename + ' : ' + language + '\r\n' + JSON.stringify(opts));
  return readFile(filename)
    .then(parseXml)
    .then(function (result) {
      var keyValues = {};
      if (result.root.data) {
        result.root.data.forEach(function (item) {
          var key = item.$.name;
          var val = item.value && item.value.length === 1 ? item.value[0] : item.value;
          keyValues[key] = val || '';
        });
      }
      return {
        language: language,
        module: module,
        keyValues: keyValues
      };
    });
}

function readLocales(sourcePath, targetPath, options) {
  var opts = options || {
    underscores: false,
    defaultLanguage: 'en-US'
  };
  return readPath(sourcePath, 'utf-8')
    .then(function (files) {
      return Promise.all(files.map(function (file) {
        return parseFile(file, null, opts);
      }));
    })
    .then(function (results) {
      return Promise.all(results.map(function (result) {
        var fileName = path.resolve(targetPath, './' + result.language + '.json');
        var data = JSON.stringify(result.keyValues, null, 2);
        return writeFile(fileName, data);
      }));
    });
}


module.exports = function (sourcePath, targetPath, options, cb) {
  if (!sourcePath) {
    cb('No source path defined', null);
  }
  if (!targetPath) {
    cb('No target path defined', null);
  }
  readLocales(sourcePath, targetPath, options).nodeify(cb);
};