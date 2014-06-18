if (Meteor.isClient) {
  $(document).ready(function () {
    $(document).foundation(function (response) {
      // console.log(response.errors);
    });
  });
}

Template.newScanForm.events({
  'click .button': function(e, tmp) {
    e.preventDefault();
    var newStatus = tmp.find('input').value;
    var now = new Date().getTime();

    // Check if a URL or better yet, delegate to a dedicated func
    if (newStatus !== '' || newStatus !== undefined) {
      SiteScans.insert({ url: newStatus, created_at: now, pagesLeft: 0, pagesScanned: 0, status: 0 });
    }
  }
});

Template.sitesScanning.helpers({
  siteList: function() {
    return SiteScans.find({});
  }
});

// Template.scanShow.helpers({
//   crawledURLs: function () {
//     console.log('///////');
//     console.log(Router._location.get());
//     console.log('///////');
//     // return PageScans.find({ sitescan_id: this.params._id });
//     return 'foo';
//   }
// });

add_scanShowController = RouteController.extend({
    template: 'scanShow',
    data: function(){
        console.log('Controller run');
        return {_id: this.params._id};
    }
});