Router.map(function() {
  this.route('home', {path: '/'});
  this.route('scanShow', {
    path: '/crawls/:_id',
    data: function() {
      return {
        site: SiteScans.findOne(this.params._id),
        crawledURLs: PageScans.find({ sitescan_id: this.params._id })
      };
    }
  });
});