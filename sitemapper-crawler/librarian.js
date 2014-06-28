fvar _ = require('underscore');
var Intern = require('./intern.js');
var logger = require('tracer').colorConsole({
  format : "{{timestamp}} <{{title}}> [Librarian] {{message}}",
  dateformat : "HH:MM:ss.l"
});

var Librarian = function (postal) {
  var librarian = this;

  librarian.postal        = postal;
  librarian.siteQueue     = [];
  librarian.interns       = [];
  librarian.interval      = 5;
  librarian.INTERN_LIMIT  = 1;

  librarian.postal.subscribe({
    channel: 'Sites',
    topic:   'completed',
    callback: librarian.addDirectory
  }).withContext(librarian);

  librarian.postal.subscribe({
    channel: 'Sites',
    topic:   'completedlinking',
    callback: librarian.removeIntern
  }).withContext(librarian);

  librarian.start();
};

// Use this to throttle the amount of work being done
Librarian.prototype.start = function () {
  var lib = this;

  logger.info('Started');
  setInterval(function () {
    // this.checkInterns();
    lib.addIntern();
  }, 1000 * lib.interval);
};

Librarian.prototype.addDirectory = function (site) {
  var librarian = this;

  if (_.findWhere(librarian.siteQueue, { _id: site._id }) === undefined) {
    librarian.siteQueue.push(site);
    logger.info('%s pushed into crawling queue.', site.host);
  } else {
    logger.log('Did not add %s', site.host);
  }
};

Librarian.prototype.addIntern = function () {
 var librarian = this;

  if (librarian.siteQueue.length === 0) {
    logger.log('No new directories to organize');
    return;
  }

  logger.log("Directories to organize %s.", librarian.siteQueue.length);

  if (librarian.interns >= librarian.INTERN_LIMIT) {
    logger.warn('At intern limit (%s)', librarian.INTERN_LIMIT);
    return;
  }

  var nextIntern = librarian.siteQueue.shift();

  logger.info('started crawling %s', nextIntern.host);
  librarian.newIntern(nextIntern);
};

Librarian.prototype.removeIntern = function (data) {
  var librarian = this;

  _.each(librarian.interns, function (elem, index, list) {
    if (elem._id === data._id) {
      list.splice(index, 1);
    }
  }, this);
};

Librarian.prototype.newIntern = function (site) {
  var librarian = this;
  logger.info('Site %s kicked off', site.host);

  var intern = new Intern(site, librarian.postal);

  librarian.interns.push(intern);
  logger.info('Site: %s was completed and is now being sorted', site._id);
};

module.exports = Librarian;
