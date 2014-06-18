if (Meteor.isClient) {

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

  // Meteor.publish('foobar', function() {
  //   return SiteScans.find({ message: 'Foobar' });
  // });
}
