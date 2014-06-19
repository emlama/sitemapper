var Stasher = function() {
  var crawler = this;

  crawler.allowedProtocols = [
    /^http(s)?$/i,          // HTTP & HTTPS
    /^(rss|atom|feed)(\+xml)?$/i  // RSS / XML
  ];

  crawler.discoverRegex = [
    /(\shref\s?=\s?|\ssrc\s?=\s?|url\()([^\"\'\s>\)]+)/ig,
    /(\shref\s?=\s?|\ssrc\s?=\s?|url\()['"]([^"']+)/ig,
    /http(s)?\:\/\/[^?\s><\'\"]+/ig,
    /url\([^\)]+/ig,

    // This might be a bit of a gamble... but get hard-coded
    // strings out of javacript: URLs. They're often popup-image
    // or preview windows, which would otherwise be unavailable to us.
    // Worst case scenario is we make some junky requests.
    /^javascript\:[a-z0-9\$\_\.]+\(['"][^'"\s]+/ig
  ];
}

Stasher.prototype.protocolSupported = function(URL) {
  var protocol, crawler = this;

  try {
    protocol = URI(URL).protocol();

    // Unspecified protocol. Assume http
    if (!protocol)
      protocol = "http";

  } catch(e) {
    // If URIjs died, we definitely /do not/ support the protocol.
    return false;
  }

  return crawler.allowedProtocols.reduce(function(prev,protocolCheck) {
    return prev || !!protocolCheck.exec(protocol);
  },false);
};

Stasher.prototype.discoverResources = function(resourceData,queueItem) {
  // Convert to UTF-8
  // TODO: account for text-encoding.
  var resources = [],
    resourceText = resourceData.toString("utf8"),
    crawler = this;

  if (!queueItem)
    queueItem = {};

  if (!queueItem.protocol)
    queueItem.protocol = "http";

  function cleanURL(URL) {
    return URL
        .replace(/^(\s?href|\s?src)=['"]?/i,"")
        .replace(/^\s*/,"")
        .replace(/^url\(['"]*/i,"")
        .replace(/^javascript\:[a-z0-9]+\(['"]/i,"")
        .replace(/["'\)]$/i,"")
        .replace(/^\/\//, queueItem.protocol + "://")
        .replace(/\&amp;/i,"&")
        .split("#")
        .shift();
  }

  // Clean links
  function cleanAndQueue(urlMatch) {
    if (!urlMatch) return [];

    return urlMatch
      .map(cleanURL)
      .reduce(function(list,URL) {

        // Ensure URL is whole and complete
        try {
          URL = URI(URL)
              .absoluteTo(queueItem.url)
              .normalize()
              .toString();
        } catch(e) {

          // But if URI.js couldn't parse it - nobody can!
          return list;
        }

        // If we hit an empty item, don't add return it
        if (!URL.length) return list;

        // If we don't support the protocol in question
        if (!crawler.protocolSupported(URL)) return list;

        // Does the item already exist in the list?
        if (resources.reduce(function(prev,current) {
            return prev || current === URL;
          },false))
            return list;

        return list.concat(URL);
      },[]);
  }

  // Rough scan for URLs
  return crawler.discoverRegex
    .reduce(function(list,regex) {
      return list.concat(
        cleanAndQueue(
          resourceText.match(regex)));
    },[])
    .reduce(function(list,check) {
      if (list.indexOf(check) < 0)
        return list.concat([check]);

      return list;
    },[]);
};