require.config({
  baseUrl: 'js/app',
  paths: {
    'three': '../lib/three.min',
    'domReady': '../lib/domReady'
  }
});

require(['breakout', 'domReady!'], function(breakout) {
  var game = new breakout.Game();
  game.start();
});
