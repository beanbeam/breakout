require.config({
  baseUrl: 'js/app',
  paths: {
    'domReady': '../lib/domReady',
    'three': '../lib/three',
    'cannon': '../lib/cannon'
  },
  shim: {
    'three': {exports: 'THREE'},
    'cannon': {exports: 'CANNON'}
  }
});

require(['breakout', 'domReady!'], function(breakout) {
  var game = new breakout.Game();
  game.start();
});
