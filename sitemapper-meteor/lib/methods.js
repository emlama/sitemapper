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
    // SiteScans.update({ _id: site._id }, { $set: { status: site.status, pagesLeft: site.pagesLeft, pagesScanned: site.pagesScanned } });
    return site.host + ' ' + site._id + ' with status ' + site.status;
  }
});