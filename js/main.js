require.config({
  baseUrl: 'js/app',
  paths: {
    'domReady': '../lib/domReady',
    'three': '../lib/three',
  },
  shim: {
    'three': {exports: 'THREE'},
  }
});

require(['breakout', 'domReady!'], function(breakout) {
  var game = new breakout.Game();
  game.start();
});
