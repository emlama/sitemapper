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