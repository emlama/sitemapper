var DDPClient = require('ddp');
var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('tracer').colorConsole({
  format : "{{timestamp}} <{{title}}> {{message}}",
  dateformat : "HH:MM:ss.l"
});

var Watcher = function (postal) {
  var watcher = this;
  watcher.postal = postal;

  watcher.queue = [];
  watcher.pushLimit = 10;
  watcher.publishPageInterval = 5;

  watcher.ddpclient = new DDPClient({
    host: "localhost",
    port: 3000,
    /* optional: */
    auto_reconnect: true,
    auto_reconnect_timer: 500,
    use_ejson: true,           // Use Meteor's EJSON to preserve certain data types.
    use_ssl: false,
    maintain_collections: true // Set to false to maintain your own collections.
  });

  watcher.ddpclient.connect(function(error) {
    // If auto_reconnect is true, this callback will be invoked each time
    // a server connection is re-established
    if (error) {
      logger.error('DDP connection error!');
      return;
    }

    logger.info('[Watcher] connected');

    // ddpclient.loginWithEmail("matthew.forr@gmail.com", "password", function (err, result) {
      // result contains your auth token

      /*
       * Subscribe to a Meteor Collection
       */
      watcher.ddpclient.subscribe(
        'sitescans',              // name of Meteor Publish function to subscribe to
        [],                       // any parameters used by the Publish function
        function () {             // callback when the subscription is complete
          logger.info('[Watcher] Initial siteScan count: %s', _.size(watcher.ddpclient.collections.sitescans));
          // watcher.sitescans = watcher.ddpclient.collections.sitescans;
          watcher.emit('init', watcher.ddpclient.collections.sitescans);
        }
      );

      watcher.ddpclient.on('message', function (msg) {
        var message = JSON.parse(msg);
        // logger.info(message);

        if (message.msg === 'added' && message.collection === 'sitescans') {
          logger.info('[Watcher] %s added with status of %s', message.fields.url, message.fields.status);
          // watcher.emit('siteAdded', message.id, message.fields.url);

          watcher.postal.publish({
              channel: 'Sites',
              topic: 'added',
              data: {
                  allSites: watcher.ddpclient.collections.sitescans
              }
          });
          watcher.emit('siteAdded', watcher.ddpclient.collections.sitescans);
        }
      });

      // Queue watcher
      watcher.interval = setInterval(watcher.processPageQueue(), 1000 * watcher.publishPageInterval); // Every 30 seconds

    // });
  });

  EventEmitter.call(watcher);
};

util.inherits(Watcher,EventEmitter);

Watcher.prototype.push = function (_id, pageData) {
  this.queue.push({ _id: _id, pageData: pageData });
  return this.queue.length;
};

Watcher.prototype.next = function () {
  return this.queue.shift();
};

Watcher.prototype.processPageQueue = function () {
  var watcher = this;
  logger.info('[Watcher] Pages scanned to publish %s.', watcher.queue.length);

  // Work through the list
  for (var i = watcher.pushLimit; i >= 0; i--) {
    // Bail if there's nothing here.
    if (watcher.queue.length === 0) return;
    var next = watcher.next();
    watcher.publishPage(next._id, next.pageData);
  }
};

Watcher.prototype.publishPage = function (_id, pageData) {
  var watcher = this;
  var ddpclient = watcher.ddpclient;

  ddpclient.call('pushPage', [_id, pageData],
    function (err, result) {
      if (err) {
        logger.error(err);
        return;
      }
      logger.info('[Watcher] Successfully inserted: ' + result);
    },
    function () {              // callback which fires when server has finished
      // console.log('updated');  // sending any updated documents as a result of
      // console.log(ddpclient. collections.sitescans);  // calling this method
      // logger.info('[Watcher] updated');
    }
  );
};

Watcher.prototype.updateStatus = function (site) {
  var watcher = this;
  var ddpclient = watcher.ddpclient;

  ddpclient.call('updateSiteStatus', [site],
    function (err, result) {
      if (err) {
        logger.error(err);
        return;
      }
      logger.info('[Watcher] Successfully updated status of ' + result);
    },
    function () { // CB that fires when server is finished
      // do nothing for now
    }
  );
};

module.exports = Watcher;