Meteor.methods({
  pushPage: function (_id, data) {
    PageScans.upsert({
        sitescan_id: _id,
        page: data.page
      },
      {
        $set: {
                title: data.title,
                crawl: data.queueItem
              }
      },
      function (err, result) {
        if (err) {
          console.log(err);
          return;
        }

        console.log("Res from line 19 methods.js");
        console.log(res);
        return res;
      });

    return data.queueItem.path + " " + _id;
  },

  updateSiteStatus: function (site) {
    site = _.omit(site, ['url', '_id', 'created_at']);
    SiteScans.update({ _id: site._id }, { $set: site });
    // SiteScans.update({ _id: site._id }, { $set: { status: site.status, pagesLeft: site.pagesLeft, pagesScanned: site.pagesScanned } });
    return site.url + ' ' + site._id + ' with status ' + site.status;
  }
});