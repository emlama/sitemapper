var DDPClient = require('ddp');
var _ = require('underscore');
var logger = require('tracer').colorConsole({
  format : "{{timestamp}} <{{title}}> [Watcher] {{message}}",
  dateformat : "HH:MM:ss.l",
  level:'info'
});

var Watcher = function (postal) {
  var watcher = this;
  watcher.postal = postal;

  watcher.queue = [];
  watcher.pushLimit = 10;
  watcher.publishPageInterval = 20;
  watcher.ddpclient = new DDPClient({
    host: "localhost",
    port: 3000,
    auto_reconnect: true,
    auto_reconnect_timer: 500,
    use_ejson: true,
    use_ssl: false,
    maintain_collections: true
  });

  watcher.subscribe();
  watcher.start();
};

Watcher.prototype.start = function () {
  var watcher = this;

  watcher.ddpclient.connect(function(error) {
    if (error) {
      logger.error('DDP connection error!');
      return;
    }

    // Subscribe does set up a data object for maintence but since mapper is the one that
    // cares most about that object. I maintain it by pushing data into mapper using the message
    // function below.
    watcher.ddpclient.subscribe('unscannedSites', [], function () {});
    logger.log('connected');
  });

  // Queue watcher
  watcher.interval = setInterval(watcher.processPageQueue, 1000 * watcher.publishPageInterval, watcher); // Every 30 seconds
};

Watcher.prototype.subscribe = function () {
  var watcher = this;

  watcher.postal.subscribe({
    channel: 'Sites',
    topic:   'updated',
    callback: watcher.updateSiteStatus
  }).withContext(watcher);

  watcher.postal.subscribe({
    channel: 'Pages',
    topic:   'crawled',
    callback: watcher.push
  }).withContext(watcher);

  watcher.ddpclient.on('message', function (msg) {
    var message = JSON.parse(msg);
    // logger.info(msg);

    if (message.msg === 'added' && message.collection === 'sitescans') {
      // Munging to get in right format
      var site = {};
      site._id = message.id;
      _.extend(site, message.fields);

      // Put onto the stack
      watcher.postal.publish({
          channel: 'Sites',
          topic: 'added',
          data: site
      });
    }
  });
};

Watcher.prototype.processPageQueue = function (self) {
  var watcher = self;
  logger.log('Pages scanned to publish %s.', watcher.queue.length);

  // Work through the list
  for (var i = watcher.pushLimit; i >= 0; i--) {
    // Bail if there's nothing here.
    if (watcher.queue.length === 0) return;
    var next = watcher.next();
    watcher.publishPage(next);
  }
};

Watcher.prototype.publishPage = function (page) {
  var watcher = this;
  var ddpclient = watcher.ddpclient;

  ddpclient.call('pushPage', [page],
    function (err, result) {
      if (err) {
        logger.error(err);
        return;
      }
      logger.info('Successfully inserted: ' + result);
    },
    function () { // callback which fires when server has finished
      // console.log('updated');
    }
  );
};

// Queues a page to be published
Watcher.prototype.push = function (data) {
  this.queue.push(data);
  return this.queue.length;
};

// Returns next in the queue line
Watcher.prototype.next = function () {
  return this.queue.shift();
};

/**
 * This pushes data into meteor with a simple site variable
 * meteor will upsert any data contained in the site object
 * except the _id, URL, and created_at params.
 * @param  {[type]} site Simple site object
 * @return {[type]}      [description]
 */
Watcher.prototype.updateSiteStatus = function (site) {
  var watcher = this;
  var ddpclient = watcher.ddpclient;

  ddpclient.call('updateSiteStatus', [site],
    function (err, result) {
      if (err) {
        logger.error(err);
        return;
      }
      logger.log('Successfully updated status of ' + result);
    },
    function () { // CB that fires when server is finished
      // do nothing for now
    }
  );
};

module.exports = Watcher;