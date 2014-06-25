var Crawler = require('simplecrawler');
// var URI = require("URIjs");

// var Stasher = function(responseBuffer, queueItem) {
//   var stasher = this;

//   stasher.allowedProtocols = [
//     /^http(s)?$/i,          // HTTP & HTTPS
//     /^(rss|atom|feed)(\+xml)?$/i  // RSS / XML
//   ];

//   // Regular expressions for finding URL items in HTML and text
//   stasher.DISC_regex = [
//     // Matches links without quotes marks (href, url, src)
//     /(\shref\s?=\s?|\ssrc\s?=\s?|url\()([^\"\'\s>\)]+)/ig,
//     // Matches links with quotes marks (href, url, src)
//     /(\shref\s?=\s?|\ssrc\s?=\s?|url\()['"]([^"']+)/ig,
//     // Matches straight http://www.website.com
//     /http(s)?\:\/\/[^?\s><\'\"]+/ig,
//     // Find all urls links
//     /url\([^\)]+/ig,

//     // This might be a bit of a gamble... but get hard-coded
//     // strings out of javacript: URLs. They're often popup-image
//     // or preview windows, which would otherwise be unavailable to us.
//     // Worst case scenario is we make some junky requests.
//     /^javascript\:[a-z0-9\$\_\.]+\(['"][^'"\s]+/ig
//   ];
//   stasher.discoverRegex = [
//     /(\shref\s?=\s?|\ssrc\s?=\s?|url\()['"]([^"']+)/ig
//   ]
// }

// Stasher.prototype.protocolSupported = function(URL) {
//   var protocol, stasher = this;

//   try {
//     protocol = URI(URL).protocol();

//     // Unspecified protocol. Assume http
//     if (!protocol)
//       protocol = "http";

//   } catch(e) {
//     // If URIjs died, we definitely /do not/ support the protocol.
//     return false;
//   }

//   return stasher.allowedProtocols.reduce(function(prev,protocolCheck) {
//     return prev || !!protocolCheck.exec(protocol);
//   },false);
// };

// Stasher.prototype.discoverResources = function(resourceData,queueItem) {
//   // Convert to UTF-8
//   // TODO: account for text-encoding.
//   var resources = [],
//     resourceText = resourceData.toString("utf8"),
//     stasher = this;

//   if (!queueItem)
//     queueItem = {};

//   if (!queueItem.protocol)
//     queueItem.protocol = "http";

//   function cleanURL(URL) {
//     return URL
//         .replace(/^(\s?href|\s?src)=['"]?/i,"")
//         .replace(/^\s*/,"")
//         .replace(/^url\(['"]*/i,"")
//         .replace(/^javascript\:[a-z0-9]+\(['"]/i,"")
//         .replace(/["'\)]$/i,"")
//         .replace(/^\/\//, queueItem.protocol + "://")
//         .replace(/\&amp;/i,"&")
//         .split("#")
//         .shift();
//   }

//   // Clean links
//   function cleanAndQueue(urlMatch) {
//     if (!urlMatch) return [];

//     return urlMatch
//       .map(cleanURL)
//       .reduce(function(list,URL) {

//         // Ensure URL is whole and complete
//         try {
//           URL = URI(URL)
//               .absoluteTo(queueItem.url)
//               .normalize()
//               .toString();
//         } catch(e) {

//           // But if URI.js couldn't parse it - nobody can!
//           return list;
//         }

//         // If we hit an empty item, don't add return it
//         if (!URL.length) return list;

//         // If we don't support the protocol in question
//         if (!stasher.protocolSupported(URL)) return list;

//         // Does the item already exist in the list?
//         if (resources.reduce(function(prev,current) {
//             return prev || current === URL;
//           },false))
//             return list;

//         return list.concat(URL);
//       },[]);
//   }

//   // Rough scan for URLs
//   var smt = stasher.discoverRegex.reduce(function(list,regex) {
//       console.log('Regex: ' + regex);
//       // console.log(resourceText);
//       // /(\shref\s?=\s?|\ssrc\s?=\s?|url\()['"]([^"']+)/ig,
//       resourceText.replace(regex, function (match, a, b, c, offset, string) {
//         if (match.match(/http(s)?\:\/\/[^?\s><\'\"]+/ig)) return;
//         if (match.match('//')) return;

//         if (b.charAt(0) == '/') {
//           // console.log(b.charAt(0));
//           b = b.slice(1);
//         }

//         console.log(match.replace(b, '/cache/http/80/' + b));
//         return match.replace(b, '/cache/http/80/' + b);
//       });

//       // console.log(resourceText);
//       // Gets us a URL
//       var foo = list.concat(cleanAndQueue(resourceText.match(regex)));
//       return foo;
//     },[]).reduce(function(list,check) {
//       if (list.indexOf(check) < 0)
//         return list.concat([check]);

//       return list;
//     },[]);
//   return smt;
// };

// var stsh = new Stasher();
var cwl = new Crawler('www.matthewforr.com');
cwl.cache = new Crawler.cache('testCache');
// cwl.discoverResources = false;
// cwl.on('fetchcomplete', function (queueItem, responseBuffer, response) {
//   console.log('Fetch Complete');
//   // console.log(queueItem.path);
//   var resourceText = responseBuffer.toString("utf8");
//   var res = resourceText.replace(/(\shref\s?=\s?|\ssrc\s?=\s?|url\()['"]([^"']+)/ig, function (match, a, b, c, offset, string) {
//     if (match.match(/http(s)?\:\/\/[^?\s><\'\"]+/ig)) return match;
//     if (match.match('//')) return match;

//     var mung = b;

//     if (mung.charAt(0) == '/') {
//       console.log(mung.charAt(0));
//       mung = mung.slice(1);
//     }

//     var outcome = match.replace(b, '/cache/http/80/' + mung);

//     return outcome;
//   });
//   console.log(res);
// });
// cwl.on('discoverycomplete', function (queItm, res) {
//   console.log(queItm);
//   console.log(res);
//   // body...
// });

cwl.start();