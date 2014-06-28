// THIS WIPES IT ALL AWAY!

var spawn = require('child_process').spawn,
    fs = require('fs-extra');

console.log('Resetting project state');

// Clear the cache
fs.removeSync('./sitemapper-crawler/cached_sites/', function (err) {
  if (err) return console.error(err);

  console.log('Removed cached_sites directory');
});

// And add the folder back in
fs.mkdirs('./sitemapper-crawler/cached_sites');

// Dump the database
var childMeteor = spawn('meteor', ['reset'], {
  stdio: 'inherit',
  cwd: './sitemapper-meteor'
});