# connector.js
This file watches the `sitescans` collection in Meteor.

`sitescans`
- owner
- status
-- complete
-- in progress
- created_at
- url
- config
-- filters
-- strip query strings
-- TBD

`pagecrawls`
- url
- owner
- sitescan_id
- meta_title
- meta_description
- content
- created_at
- content
- consider pulling embed.ly content