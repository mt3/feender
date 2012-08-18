
var http = require('http');
var $ = require('jquery');
var urlparser = require('url');
var htmlparser = require("htmlparser");
var select = require('soupselect').select;

module.exports = function(url, done) {
  http.get(urlparser.parse(url), function (response) {
    var feeds = [];
    var body = '';
    response.on('data', function (chunk) {
      body += chunk;
    });

    response.on('end', function() {
      var handler = new htmlparser.DefaultHandler(function (error, dom) {
        if (error) {
          console.log("FUUU")
        }
        else {

          select(dom, "head link").forEach(function(link) {
            if (link.attribs.type === "application/atom+xml" || link.attribs.type === "application/rss+xml") {
              var feedUrl = urlparser.parse(link.attribs.href);
              var feed = {rel: "alternate", type: link.attribs.type};
              if(feedUrl.hostname) {
                feed.href = link.attribs.href;
              }
              else {
                feed.href = urlparser.format(urlparser.resolve(url, link.attribs.href));
              }
              if(link.attribs.title) {
                feed.title = link.attribs.title;
              }
              else {
                feed.title = select(dom, "title")[0].children[0].raw;
              }
              feeds.push(feed)
            }
          });

          if(feeds.length === 0) {
            var atom = select(dom, "feed");
            if(atom.length > 0 && atom[0].attribs.xmlns.toLowerCase() === 'http://www.w3.org/2005/Atom'.toLowerCase()) {
              feeds.push({
                rel: "self",
                type: "application/atom+xml",
                href: url,
                title: select(dom, "title")[0].children[0].raw
              });
            }
          }
          if(feeds.length === 0) {
            var rss = select(dom, "rss")[0];
            feeds.push({
              rel: "self",
              type: "application/rss+xml",
              href: url,
              title: select(dom, "title")[0].children[0].raw
            });
          }
          done(null, feeds);
        }
      });
var parser = new htmlparser.Parser(handler);
parser.parseComplete(body);
});
}).on('error', function(error) {
  done(error, feeds);
});
};

