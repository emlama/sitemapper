if (Meteor.isClient) {

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

  Meteor.publish('unscannedSites', function() {
    return SiteScans.find({ status: { $lt: 2 } });
  });

  Meteor.publish('allSites', function() {
    return SiteScans.find();
  });

  Meteor.publish('allPages', function() {
    return PageScans.find();
  });
}
