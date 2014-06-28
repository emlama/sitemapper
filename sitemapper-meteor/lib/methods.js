Meteor.methods({
  pushPage: function (page) {
    var data = _.omit(page, ['sitescan_id', 'created_at']);

    PageScans.upsert({
        sitescan_id: page.sitescan_id,
        url: page.url
      },
      { $set: data },
      function (err, result) {
        if (err) {
          console.log(err);
          return;
        }
      });

    return page.url + " " + page.sitescan_id;
  },

  updateSiteStatus: function (site) {
    var data = _.omit(site, ['host', '_id', 'created_at']);

    SiteScans.update({ _id: site._id }, { $set: data }, function (err, result) {
      if (err) {
        console.log(err);
        return;
      }
    });

    return site.host + ' ' + site._id + ' with status ' + site.status;
  },

  findUnlinkedPages: function (sitescan_id) {
    console.log('findUnlinkedPages called ' + sitescan_id);
    var pages = PageScans.find({ status: 'unlinked', 'cacheObject.dataFile': { $exists: true }, sitescan_id: sitescan_id },
      { fields: {
          "status": 1,
          "cacheObject.dataFile": 1,
          "queueItem.path": 1,
          "queueItem.host": 1,
          "queueItem.port": 1,
          "queueItem.protocol": 1,
          "url": 1,
          "sitescan_id": 1,
          "type": 1
        }
      }).fetch();

    var data = {
      sitescan_id: sitescan_id,
      pages: pages
    };

    return data;
  }
});