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
          if (opts.categories) {
            if (!keyValues[module]) {
              keyValues[module] = {};
            }
            keyValues[module][key] = val || '';
          } else {
            keyValues[key] = val || '';
          }
        });
      }
      return {
        language: language,
        module: module,
        keyValues: keyValues
      };
    });
}

function replaceValues(target, keyValues) {
  if (!target) {
    target = {};
  }
  Object.keys(keyValues || {}).forEach(function (key) {
    target[key] = keyValues[key];
  });
  return target;
}

function readLocales(sourcePath, targetPath, options) {
  var opts = options || {
    underscores: false,
    categories: false,
    defaultLanguage: 'en-US'
  };
  return readPath(sourcePath, 'utf-8')
    .then(function (files) {
      return Promise.all(files.map(function (file) {
        return parseFile(file, null, opts);
      }));
    })
    .then(function (results) {
      var files = results.reduce(function (memo, item) {
        if (!memo[item.language]) {
          memo[item.language] = {};
        }
        replaceValues(memo[item.language], item.keyValues);
        return memo;
      }, {})

      return Promise.all(
        Object.keys(files).map(function (language) {
          var fileName = path.resolve(targetPath, './' + language + '.json');
          var data = JSON.stringify(files[language], null, 2);
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
