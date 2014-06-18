// require crawler
// require watcher
var logger = require('tracer').colorConsole({
  format : "{{timestamp}} <{{title}}> {{message}}",
  dateformat : "HH:MM:ss.l"
});
var _ = require('underscore');
var postal = require('postal');
var Mapper = require('./mapper.js');
var Watcher = require('./watcher.js');

var watcher = new Watcher(postal);
var crawl = new Mapper(postal);

watcher.on('message', function (data) {
  // console.log(watcher.ddpclient.collections);
  // If new crawl.push({ id, targetSite, config });
});

watcher.on('init', function (uncrawledSites) {
  crawl.init(uncrawledSites);
});

watcher.on('siteAdded', function (sites) {
  // crawl.push(_id, url, {});
  crawl.uncrawledSites = sites;
});

crawl.on("fetchcomplete", _.bind(function (_id, data) {
  logger.info('[App] Crawled %s for scan id %s', data.queueItem.path, _id);
  watcher.push(_id, data);
  // watcher.publishPage(_id, data);
}, watcher));

crawl.on("crawlStarted", function (site) {
  site.status = 1;
  logger.warn('Crawl started for %s', site.url);
  watcher.updateStatus(site);
});

crawl.on("crawlFinished", function (site) {
  site.status = 2;
  logger.warn('Crawl finished for %s', site.url);
  watcher.updateStatus(site);
});

crawl.on("crawlerStatus", function (site) {
  logger.warn('Crawl updated for %s', site.url);
  watcher.updateStatus(site);
});

// crawl.complete(function () {
//   kick off next item in queue if not empty
//   push data back to meteor
// });

// crawl.pageComplete(function () {
//   here's a page scan
// });