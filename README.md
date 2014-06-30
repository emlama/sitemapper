Sitemapper aims to be a reverse CMS. It will index and cache an entire site and then let an Information Architect build a sitemap, define what templates are being used throughout the site, and model the content.

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

Alternatively, you can run `npm start` from the root directory.

Since this is in early development, I've included a reset script, `node reset.js`, that will blow away the database and site cache. It clears everything so consider yourself warned.

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
- Add in controls for changing the limits on the fly

## Dashboard

- Implement thumbnails
- So create button if nothing crawled

# various notes

Export from the database

`mongoexport --host localhost:3001 --db meteor --collection pagescans --fields type,url,title,size --csv --query '{"sitescan_id":"ZCTu9C9zCpcEqB4tD"}' --out ~/src/sitemapper/goang-pages-full.csv`