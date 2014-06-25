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
  this.cacheLoadParameter = cacheLoadParameter;

  // Ensure parameters are how we want them...
  cacheBackend = typeof cacheBackend === "object" ? cacheBackend : FilesystemBackend;
  cacheLoadParameter = cacheLoadParameter instanceof Array ? cacheLoadParameter : [cacheLoadParameter];

  // Now we can just run the factory.
  this.datastore = cacheBackend.apply(cacheBackend,cacheLoadParameter);

  // Instruct the backend to load up.
  this.datastore.load();
};

Cache.prototype = new EventEmitter();

// Set up data import and export functions
Cache.prototype.setCacheData = function(queueObject,data,callback) {
  var cache = this;
  var cacheObject = cache.datastore.setItem(queueObject,data,function (cacheObject) {
    cache.emit("setcache",queueObject,data,cacheObject);
    return cacheObject;
  });
};

Cache.prototype.getCacheData = function(queueObject,callback) {
  this.datastore.getItem(queueObject,callback);
};

Cache.prototype.saveCache = function() {
  this.datastore.saveCache();
};

module.exports = Cache;
module.exports.Cache = Cache;
