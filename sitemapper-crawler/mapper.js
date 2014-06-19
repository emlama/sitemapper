var Crawler = require('simplecrawler');
var cheerio = require('cheerio');
var _ = require('underscore');
var fs = require('fs');
var logger = require('tracer').colorConsole({
  format : "{{timestamp}} <{{title}}> [Mapper] {{message}}",
  dateformat : "HH:MM:ss.l",
  level:'info'
});

var Mapper = function (postal) {
  var mapper = this;
  mapper.postal = postal;

  mapper.queue = [];
  mapper.crawlers = [];
  // mapper.completedSites = [];
  mapper.CRAWL_LIMIT = 5;
  mapper.interval = 5;

  mapper.postal.subscribe({
    channel: 'Sites',
    topic:   'added',
    callback: mapper.addSite
  }).withContext(mapper);

  mapper.start();
};

Mapper.prototype.start = function () {
  var mapper = this;

  setInterval(function () {
    mapper.checkCrawlers();
    mapper.addCrawlers();
  }, 1000 * mapper.interval);
};

// Adds a site in the queue.
Mapper.prototype.addSite = function (data, envelope) {
  var mapper = this;

  // Should add extra check conditions here.
  if (data.status === 0 && _.findWhere(mapper.queue, { _id: data._id }) === undefined) {
    mapper.queue.push(data);
    logger.info('%s pushed into crawling queue.', data.host);
    // Queue gets sorted by the date it was added. Oldest is first.
    var sorted = _.sortBy(mapper.queue, function (site) {
      return site.created_at;
    });
  } else {
    logger.log('Did not add %s', data.host);
  }
};

// Checks to make sure a crawler can be fired up
Mapper.prototype.addCrawlers = function () {
  var mapper = this;

  if (mapper.queue.length === 0) {
    logger.log('No new sites to crawl');
    return;
  }

  logger.log("Sites to crawl %s.", mapper.queue.length);

  if (mapper.crawlers >= mapper.CRAWL_LIMIT) {
    logger.warn('At crawl limit (%s)', mapper.CRAWL_LIMIT);
    return;
  }

  var nextSite = mapper.queue.shift();

  logger.info('started crawling %s', nextSite.host);
  mapper.newCrawler(nextSite);
};

// Check in to send updates back to meteor
Mapper.prototype.checkCrawlers = function () {
  var mapper = this;

  _.each(mapper.crawlers, function (crawler, index, list) {
    logger.log("Crawler %s has %s items in the queue.", crawler.host, crawler.queue.countWithStatus('queued'));

    crawler.site.pagesScanned = crawler.queue.complete();
    crawler.site.pagesLeft    = crawler.queue.countWithStatus('queued');

    if (crawler.site.status === 2) {
      list.splice(index, 1);
    }

    mapper.postal.publish({
        channel: 'Sites',
        topic: 'updated',
        data: crawler.site
    });
  });
};

// Heavy lifting happens here!
Mapper.prototype.newCrawler = function (site) {
  var mapper = this;
  // logger.info(site);
  // Config conditions

  if (site._id === undefined) {
    throw new Error("Scan ID required");
  }

  if (site.host === undefined) {
    throw new Error("target site undefined");
  }

  // Create the crawler
  var crawler = new Crawler(site.host);

  crawler.site                = site; // Stash this for later
  crawler.stripQuerystring    = true;
  crawler.maxConcurrency      = 5;
  // crawler.interval            = 6000;
  crawler.timeout             = 30000;

  // SAVE TO DISK LIKE A BOSS
  // crawler.cache = new Crawler.cache('foobar');

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

  crawler.on("fetchcomplete",function(queueItem, responseBuffer, response) {
    var $content = cheerio.load(responseBuffer.toString());
    var title = $content('title').html();

    mapper.postal.publish({
      channel: 'Pages',
      topic: 'crawled',
      data: {
        queueItem: queueItem,
        url: queueItem.url,
        page: responseBuffer.toString(),
        title: title,
        sitescan_id: crawler.site._id
      }
    });
  });

  crawler.site.status = 1;
  mapper.postal.publish({
    channel: 'Sites',
    topic: 'started',
    data: crawler.site
  });

  mapper.crawlers.push(crawler);
  crawler.start();

  crawler.on("complete", function() {
    logger.info("Finished crawling %s", crawler.host);
    crawler.site.status = 2; // She's done and we'll notify home next round of updates
  });
};

module.exports = Mapper;