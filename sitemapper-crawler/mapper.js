var Crawler = require('simplecrawler');
var cheerio = require('cheerio');
var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('tracer').colorConsole({
  format : "{{timestamp}} <{{title}}> {{message}}",
  dateformat : "HH:MM:ss.l"
});

var Mapper = function (postal) {
  var mapper = this;
  mapper.postal = postal;

  mapper.queue = [];
  mapper.crawlers = [];
  mapper.CRAWL_LIMIT = 1;

  mapper.postal.subscribe({
    channel: 'Sites',
    topic:   'added',
    callback: function (data, envelope) {
      logger.warn('Sites.added');
    }
  });

  EventEmitter.call(mapper);
};

util.inherits(Mapper,EventEmitter);

Mapper.prototype.init = function (uncrawledSites) {
  var mapper = this;

  mapper.uncrawledSites = uncrawledSites;

  _.each(uncrawledSites, function (site, _id) {
    // check for this needing to be crawled;
    if (site.url === undefined || site.url === '') {
      return;
    }

    mapper.push(_id, site.url, site.config);

  }, mapper);

  // mapper.start();
};

Mapper.prototype.start = function () {
  var mapper = this;

  setInterval(function () {
    mapper.checkCrawlers();

    if (mapper.uncrawledSites === undefined) {
      logger.error('[Mapper] uncrawledSites data missing');
      return;
    }

    if (mapper.crawlers >= mapper.CRAWL_LIMIT) {
      logger.warn('[Mapper] At crawl limit');
      return;
    }

    var sites = _.each(mapper.uncrawledSites, function (site, id) {
      site._id = id;
      return site;
    });

    sites = _.filter(sites, function (site) {
      return site.status !== 2;
    });

    _.each(mapper.crawlers, function (crawler) {
      sites = _.reject(sites, function (site) {
        return site._id === crawler._id
      })
    }, mapper);

    logger.info("[Mapper] Sites to crawl %s.", _.size(sites));

    var nextSite = _.find(sites, function (site) {
      return site.status !== 2;
    });

    if (nextSite === undefined) {
      // logger.warn('[Mapper] no sites found to crawl');
      return;
    } else {
      logger.info('[Mapper] started crawling %s', nextSite.url);
      mapper.newCrawler(nextSite);
    }

  }, 1000 * 5); // Every 5 seconds

};

Mapper.prototype.newCrawler = function (site) {
  var mapper = this;
  // logger.info(site);
  // Config conditions
  if (site._id === undefined) {
    throw new Error("Scan ID required");
  }

  if (site.url === undefined) {
    throw new Error("target site undefined");
  }

  // Create the crawler
  var crawler = new Crawler(site.url);

  crawler._id                 = site._id;
  crawler.url                 = site.url;
  crawler.pagesScanned        = 0;
  crawler.pagesLeft           = 0;
  crawler.status              = 1;

  crawler.stripQuerystring    = true;
  crawler.maxConcurrency      = 5;
  // crawler.interval            = 6000;
  crawler.timeout             = 30000;

  // Exclude things that we don't want
  // In the future we will use the config for this
  var noJS = crawler.addFetchCondition(function(parsedURL) {
      return !parsedURL.path.match(/\.js$/i);
  });

  var noCSS = crawler.addFetchCondition(function(parsedURL) {
      return !parsedURL.path.match(/\.css$/i);
  });

  var noPNG = crawler.addFetchCondition(function(parsedURL) {
      return !parsedURL.path.match(/\.png$/i);
  });

  var noJPG = crawler.addFetchCondition(function(parsedURL) {
      return !parsedURL.path.match(/\.jpg$/i);
  });

  var noKML = crawler.addFetchCondition(function(parsedURL) {
      return !parsedURL.path.match(/\.kml$/i);
  });

  var noMovie = crawler.addFetchCondition(function(parsedURL) {
      return !parsedURL.path.match(/\.mp4$/i);
  });

  // Starts automatically
  crawler.on("fetchcomplete",function(queueItem, responseBuffer, response) {
      var $content = cheerio.load(responseBuffer.toString());
      var title = $content('title').html();
      // logger.log('Crawled: %s ',queueItem.path);

      var data = {
        queueItem: queueItem,
        page: responseBuffer.toString(),
        title: title
      };

      mapper.emit("fetchcomplete", crawler._id, data);
  });

  crawler.on("discoverycomplete", function() {
    logger.warn('Discovery complete for %s', site.host);
  });

  crawler.on("complete", function() {
    logger.log("[Mapper] queue complete");
    mapper.emit("crawlFinished", site);
  });

  crawler.start();
  mapper.crawlers.push(crawler);
  mapper.emit("crawlStarted", crawler);
};

Mapper.prototype.checkCrawlers = function () {
  var mapper = this;

  _.each(mapper.crawlers, function (crawler, key, list) {
    console.log(key);
    var site = {
      _id: crawler._id,
      pagesLeft: crawler.queue.countWithStatus('queued'),
      pagesScanned: crawler.queue.complete
    }

    mapper.emit("crawlerStatus", site);
    logger.info("Crawler %s has %s items in the queue.", crawler.host, crawler.queue.countWithStatus('queued'));

    if (crawler.status === 0) {
      list.splice(key, 1);
    }
  });
};

// Item gets pushed into the queue, returns length;
Mapper.prototype.push = function (_id, url, config) {
  this.queue.push({ _id: _id, url: url, config: config });
  return this.queue.length;
};

Mapper.prototype.next = function () {
  return this.queue.shift();
};

module.exports = Mapper;

// // Stop
// Mapper.prototype.stop = function () {
//   var mapper = this;
//   mapper.crawler.stop();
// };

// // Freeze queue
// Mapper.prototype.freeze = function () {
//   var mapper = this;
//   mapper.crawler.queue.freeze("mysavedqueue.json");
// };

// // Defrost queue
// Mapper.prototype.defrost = function () {
//   var mapper = this;
//   mapper.crawler.queue.defrost("mysavedqueue.json");
// };

// Need to figure out a strategy for handling errors
// crawler.on("queueerror", function(errorData, URLData) {
//   // logger.error('Fetch queue error');
//   // logger.trace(errorData);
//   // logger.trace(URLData);
//   logger.log('Error adding %s to the queue.', errorData);
// });

// crawler.on("fetchdataerror", function() {
//   logger.error('Fetch data error');
// });

// crawler.on("fetchredirect", function() {
//   logger.warn('Fetch redirect');
// });

// crawler.on("fetch404", function(queueItem, response) {
//   logger.warn('404: %s', queueItem.path);
// });

// crawler.on("fetcherror", function(queueItem, response) {
//   logger.error('Fetch error');
//   // logger.trace(queueItem);
//   // logger.trace(response);
// });

// crawler.on("fetchtimeout", function(queueItem, crawlerTimeoutValue) {
//   logger.error('Fetch timeout: %s timeout value: %s', queueItem.path, crawlerTimeoutValue);
// });

// crawler.on("fetchclienterror", function(queueItem, errorData) {
//   logger.error('Fetch client error: %s', queueItem.path);
// });