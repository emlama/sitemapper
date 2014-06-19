This is a fun side project that aims to make doing information architecture work easier. Currently it will crawl a site and cache all of its resources to disk.

The end goal is to allow IA's to arrange a current website into a comprehensive sitemap, perform content inventories and possibly map a websites data into a structured dataset.

To get up and running follow these instructions:

- Start the crawling engine
  - `cd sitemapper-crawler`
  - `npm install`
  - `node app.js`
- In another shell get meteor running
  - `cd sitemapper-meteor`
  - `curl https://install.meteor.com | /bin/sh` (if meteor isn't installed)
  - `meteor`

# Enhancement Ideas

## Content Inventory Tool

- Show users the page and allow them to mark what template it follows. Also allow them to define a content model and tag content on the page as such.
  - Need to cache the data to the public folder
  - Need to make sure cache information is stored in database
  - Need to develop JS code to be inserted into page to send data back to Meteor
  - Need to develop iFrame view that loads in the cached page
- Create an image gallery that shows all media/images used on the site
- Allow users to sort, order, filter, and nest lists of URLs. Consider paging for long lists.

## Crawling

- Add in admin controls for starting/stopping crawls
- Add in ability to freeze/defrost a crawl
- Add in controls for changing the limits on the fly

## Misc

- Add in users and authentication
- Add in homepage
- Create a ENV variables/switches for localhost/dev/production instances