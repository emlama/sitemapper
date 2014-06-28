var spawn = require('child_process').spawn;

var childCrawler = spawn('node', ['app.js'], {
  stdio: 'inherit',
  cwd: './sitemapper-crawler'
});

var childMeteor = spawn('meteor', [], {
  stdio: 'inherit',
  cwd: './sitemapper-meteor'
});