var fs = require('fs');
var cheerio = require('cheerio');
var _ = require('underscore');
var Intern = require('./intern.js');
var logger = require('tracer').colorConsole({
  format : "{{timestamp}} <{{title}}> [Intern] {{message}}",
  dateformat : "HH:MM:ss.l"
});

var Intern = function (site, postal) {
  var intern = this;

  // Check for key info
  intern.site = site;
  intern.postal = postal;
  intern.queue = [];
  intern.processPageInterval = 5;

  intern.postal.publish({
      channel: 'Sites',
      topic: 'readyforlinking',
      data: intern.site._id
  });

  intern.postal.subscribe({
    channel: 'Sites',
    topic: 'pagesforlinking',
    callback: intern.addQueue
  }).withContext(intern);

  intern.start();
};

Intern.prototype.start = function () {
  // Start processing files
  // logger.error(this.site);
  var intern = this;

  intern.interval = setInterval(intern.processPageQeue, 1000 * intern.processPageInterval, intern);
};

Intern.prototype.processPageQeue = function (self) {
  var intern = self;

  var unlinkedPage = _.findWhere(intern.queue, { status: 'unlinked', type: 'text/html' });

  if (unlinkedPage !== undefined) {
    fs.readFile(unlinkedPage.cacheObject.dataFile, 'utf8', function (err, data) {
      if (err) throw err;
      var newData = intern.rewriteURLs(data, unlinkedPage.queueItem);

      fs.writeFile(unlinkedPage.cacheObject.dataFile, newData, function (err) {
        if (err) throw err;
        logger.info('Successfully replaced links in %s', unlinkedPage.cacheObject.dataFile);
      });
    });

    _.each(intern.queue, function (elem, index, list) {
      if (elem._id === unlinkedPage._id) {
        list[index].status = "linked";
      }
    }, intern);

  } else {
    intern.finished();
  }
};

Intern.prototype.finished = function () {
  var intern = this;

  intern.postal.publish({
    channel: 'Sites',
    topic:   'completedlinking',
    data: intern.site
  });
};

Intern.prototype.addQueue = function (data) {
  var intern = this;

  if (data.sitescan_id === intern.site._id) {
    intern.queue = data.pages;
    logger.info('Recieved data for %s', data.host);
    intern.postal.unsubscribe({
        channel: "Sites",
        topic: "pagesforlinking"
    });
  }
};

// Make magic happen here
Intern.prototype.rewriteURLs = function (data, queueObject) {
  var intern = this;
  var resourceText = data.toString("utf8");
  var basePath = 'cached_sites/' + intern.site._id;

  var res = resourceText.replace(/(\shref\s?=\s?|\ssrc\s?=\s?|url\()['"]([^"']+)/ig, function (match, a, b, c, offset, string) {
    if (match.match(/http(s)?\:\/\/[^?\s><\'\"]+/ig)) return match; // Full URL
    if (match.match('//')) return match; // Same as Full URL
    if (b === '#') return match; // Don't care about these, leave em be

    // A should be the http part
    // B should be what we want to rewrite
    // C could be anything

    // This is the same format that cache-backend-fs uses to build it's directory structure
    var pathStack = [basePath, queueObject.protocol, queueObject.port, b];
    // pathStack = _.compact(pathStack.concat(sanitisePath(b,queueObject).split(/\/+/g)));

    pathStack = pathStack.join('/');

    // We go back to the matched string and replace the path
    var outcome = match.replace(b, '/' + pathStack);

    return outcome;
  });

  return res;
};

module.exports = Intern;

// This is how the URLs are currently being written but leaving it off for now
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

