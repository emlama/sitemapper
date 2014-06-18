Router.map(function() {
  this.route('home', {
    path: '/',
    layoutTemplate: 'layout'
  });
  this.route('scanShow', {
    path: '/crawls/:_id',
    layoutTemplate: 'layout',
    data: function() {
      return {
        site: SiteScans.findOne(this.params._id),
        crawledURLs: PageScans.find({ sitescan_id: this.params._id })
      };
    }
  });
});