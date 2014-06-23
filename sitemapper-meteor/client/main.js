if (Meteor.isClient) {
  Meteor.subscribe("allSites");
  Meteor.subscribe("allPages");
}

Template.create.events({
  'click .button': function(e, tmp) {
    e.preventDefault();
    var newStatus = tmp.find('input').value;
    var now = new Date().getTime();

    // TODO - Check if a URL or better yet, delegate to a dedicated func
    if (newStatus !== '' || newStatus !== undefined) {
      SiteScans.insert({ host: newStatus, created_at: now, pagesLeft: 0, pagesScanned: 0, status: 0 });
    }
    Router.go('home');
  }
});

Template.home.helpers({
  siteList: function() {
    return SiteScans.find({});
  }
});

add_scanShowController = RouteController.extend({
    template: 'scanShow',
    data: function(){
        console.log('Controller run');
        return {_id: this.params._id};
    }
});