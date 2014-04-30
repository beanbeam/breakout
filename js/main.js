require.config({
  baseUrl: 'js/app',
  paths: {
    'domReady': '../lib/domReady',

    // Threejs with all extensions
    'three': '../lib/threeShim',

    'threeCore': '../lib/three.min',
    'deferredRenderer': '../renderers/WebGLDeferredRenderer'
  },
  shim: {
    'threeCore': {exports: 'THREE'},
    'deferredRenderer': {
      deps: ['threeCore'],
    }
  }
});

require(['breakout', 'domReady!'], function(breakout) {
  var game = new breakout.Game();
  game.start();
});
