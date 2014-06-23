// Simplecrawler - cache module
// Christopher Giffard, 2011
//
// http://www.github.com/cgiffard/node-simplecrawler

var fs = require("fs");
var EventEmitter = require('events').EventEmitter;
var FilesystemBackend = require("simplecrawler").cache.FilesystemBackend;
var _ = require('underscore');
var crypto = require("crypto");
// var RedisBackend = require("cache-backend-redis.js");
// var MongoBackend = require("cache-backend-mongo.js");

// Init cache wrapper for backend...
var Cache = function Cache(cacheLoadParameter,cacheBackend) {
  // console.log(Crawler);
  // console.log(Crawler.cache);
  // console.log(Crawler.cache.FilesystemBackend);
  // var FilesystemBackend = Crawler.cache.FilesystemBackend;
  this.cacheLoadParameter = cacheLoadParameter;

  // Ensure parameters are how we want them...
  cacheBackend = typeof cacheBackend === "object" ? cacheBackend : FilesystemBackend;
  cacheLoadParameter = cacheLoadParameter instanceof Array ? cacheLoadParameter : [cacheLoadParameter];

  // Now we can just run the factory.
  this.datastore = cacheBackend.apply(cacheBackend,cacheLoadParameter);

  // Instruct the backend to load up.
  this.datastore.load();
};

function sanitisePath(path,queueObject) {
  // Remove first slash (as we set one later.)
  path = path.replace(/^\//,"");

  var pathStack = [];

  // Trim whitespace. If no path is present - assume index.html.
  var sanitisedPath = path.length ? path.replace(/\s*$/ig,"") : "index.html";
  var headers = queueObject.stateData.headers, sanitisedPathParts;
  console.log('headers');
  console.log(headers);

  if (sanitisedPath.match(/\?/)) {
    sanitisedPathParts = sanitisedPath.split(/\?/g);
    var resource  = sanitisedPathParts.shift();
    var hashedQS  = crypto.createHash("sha1").update(sanitisedPathParts.join("?")).digest("hex");
    sanitisedPath = resource + "?" + hashedQS;
  }

  pathStack = sanitisedPath.split(/\//g);
  pathStack = pathStack.map(function(pathChunk,count) {
    if (pathChunk.length >= 250) {
      return crypto.createHash("sha1").update(pathChunk).digest("hex");
    }

    return pathChunk;
  });

  sanitisedPath = pathStack.join("/");

  // Try to get a file extension for the file - for ease of identification
  // We run through this if we either:
  //  1) haven't got a file extension at all, or:
  //  2) have an HTML file without an HTML file extension (might be .php, .aspx, .do, or some other server-processed type)

  if (!sanitisedPath.match(/\.[a-z0-9]{1,6}$/i) || (headers["content-type"] && headers["content-type"].match(/text\/html/i) && !sanitisedPath.match(/\.htm[l]?$/i))) {
    var subMimeType = "";
    var mimeParts = [];

    if (headers["content-type"] && headers["content-type"].match(/text\/html/i)) {
      if (sanitisedPath.match(/\/$/)) {
        sanitisedPath += "index.html";
      } else {
        sanitisedPath += ".html";
      }

    } else if (headers["content-type"] && (mimeParts = headers["content-type"].match(/(image|video|audio|application)\/([a-z0-9]+)/i))) {
      subMimeType = mimeParts[2];
      sanitisedPath += "." + subMimeType;
    }
  }

  return sanitisedPath;
}

Cache.prototype = new EventEmitter();

// Set up data import and export functions
Cache.prototype.setCacheData = function(queueObject,data,callback) {
  data = this.rewriteURLs(queueObject,data);
  this.datastore.setItem(queueObject,data,callback);
  this.emit("setcache",queueObject,data);
};

Cache.prototype.getCacheData = function(queueObject,callback) {
  this.datastore.getItem(queueObject,callback);
};

Cache.prototype.saveCache = function() {
  this.datastore.saveCache();
};

// Make magic happen here
Cache.prototype.rewriteURLs = function (queueObject,data) {
  var resourceText = data.toString("utf8");
  queueObject.cacheLoadParameter = this.cacheLoadParameter;
  var res = resourceText.replace(/(\shref\s?=\s?|\ssrc\s?=\s?|url\()['"]([^"']+)/ig, function (match, a, b, c, offset, string) {
    if (match.match(/http(s)?\:\/\/[^?\s><\'\"]+/ig)) return match; // Full URL
    if (match.match('//')) return match; // Same as Full URL
    if (b === '#') return match; // Don't care about these
    console.log('String matched ' + match);
    console.log('Page is ' + queueObject.path);

    // A should be the http part
    // B should be what we want to rewrite
    // C could be anything

    // var mung = b;

    // // If the match started with a slash chop it off
    // if (mung.charAt(0) == '/') {
    //   mung = mung.slice(1);
    // }

    // This is the same format that cache-backend-fs uses to build it's directory structure
    var pathStack = [queueObject.cacheLoadParameter, queueObject.protocol, queueObject.domain, queueObject.port, b];
    // pathStack = _.compact(pathStack.concat(sanitisePath(b,queueObject).split(/\/+/g)));

    console.log(pathStack); // Should be the paths all split apart.
    pathStack = pathStack.join('/');

    console.log(pathStack);

    // We go back to the matched string and replace the path
    var outcome = match.replace(b, '/' + pathStack);

    console.log(outcome);
    console.log('');
    return outcome;
  });

  return res;
};

module.exports = Cache;
module.exports.Cache = Cache;
