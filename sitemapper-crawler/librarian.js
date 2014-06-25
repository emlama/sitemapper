/**
Recieve an index from Cache
Filter down to ones that matter
Built a list of URLs that includes the headers
Two strategies
  1. Crawl through the cache files and load that in
     - Consider making a new cache system puts data into Mongo
  2. Collect it while crawling
  3. Build it into the cache object

**/

var fs = require('fs');
var cheerio = require('cheerio');
var _ = require('underscore');
var logger = require('tracer').colorConsole({
  format : "{{timestamp}} <{{title}}> [Mapper] {{message}}",
  dateformat : "HH:MM:ss.l",
  level:'info'
});

var Librarian = function (postal) {
  var librarian = this;

  librarian.queue = [];
  librarian.interval = 5;
  librarian.INTERN_LIMIT = 1;

  librarian.postal = postal;

  librarian.postal.subscribe({
    channel: 'Sites',
    topic:   'completed',
    callback: librarian.addDirectory
  });

  // librarian.start();
};

// Use this to throttle the amount of work being done
Librarian.prototype.start = function () {
  setInterval(function () {
    this.checkInterns();
    this.addInternWorker();
  }, 1000 * this.interval);
};

Librarian.prototype.addDirectory = function (site) {
  var librarian = this;

  if (_.findWhere(librarian.queue, { _id: site._id }) === undefined) {
    librarian.queue.push(site);
    logger.info('%s pushed into crawling queue.', site.host);
  } else {
    logger.log('Did not add %s', site.host);
  }
};

Librarian.prototype.addInternWorker = function () {
 var librarian = this;

  if (librarian.queue.length === 0) {
    logger.log('No new directories to organize');
    return;
  }

  logger.log("Directories to organize %s.", librarian.queue.length);

  if (librarian.interns >= librarian.INTERN_LIMIT) {
    logger.warn('At intern limit (%s)', librarian.INTERN_LIMIT);
    return;
  }

  var nextIntern = librarian.queue.shift();

  logger.info('started crawling %s', nextIntern.host);
  librarian.newIntern(nextIntern);
};

Librarian.prototype.newIntern = function (site) {
  logger.info('Site: %s was completed and is now being sorted', site._id);
};

// Make magic happen here
Librarian.prototype.rewriteURLs = function (queueObject,data) {
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

    // This is the same format that cache-backend-fs uses to build it's directory structure
    var pathStack = [queueObject.cacheLoadParameter, queueObject.protocol, queueObject.domain, queueObject.port, b];
    // pathStack = _.compact(pathStack.concat(sanitisePath(b,queueObject).split(/\/+/g)));

    pathStack = pathStack.join('/');

    // We go back to the matched string and replace the path
    var outcome = match.replace(b, '/' + pathStack);

    return outcome;
  });

  return res;
};

function mattyBeThinking (args) {
  // Need a collection of urls found on the site and their sanitized paths
  // db.pagescans.find({ type: "text/html" }, { "cache_object.dataFile": 1, "queueItem.path": 1 } ).limit(10)
}

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
