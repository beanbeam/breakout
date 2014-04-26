define(['config', 'materials', 'three'], function(config, materials) {return{
  Game: function() {
    var canvas;
    var scene;
    var camera;
    var renderer;

    var paddle;
    var pulseRing;
    var ball;

    var gameOver = false;

    !function() {
      scene = new THREE.Scene();
      camera = initCamera(config.cameraDistance);
      canvas = document.getElementById('game-canvas');

      renderer = new THREE.WebGLRenderer({canvas: canvas});
      
      initObjects();

      updateScale();
      window.addEventListener('resize', updateScale);
      canvas.addEventListener('mousemove', mouseMoved);
    }()

    this.start = function() {requestAnimationFrame(render)}
    
    function initCamera(distance) {
      var fov = 360 * Math.atan2(10, distance) / Math.PI;
      var camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 1000);
      camera.position.z = distance;
      return camera;
    }

    function initObjects() {
      scene.add(new THREE.AmbientLight(0x222222));
      
      var walls = new THREE.Mesh(new THREE.CubeGeometry(20, 20, 40),
          materials.wallMaterial);
      walls.position.set(0, 0, -20);
      scene.add(walls);
    
      paddle = new THREE.Mesh(new THREE.CubeGeometry(
            config.paddle.width,
            config.paddle.height,
            0.2),
          materials.glowGlass);
      paddle.position.z = 0.1;
      scene.add(paddle);

      pulseRing = wireBox(25, 25, materials.whiteLines);
      scene.add(pulseRing);

      ball = newBall();
      ball.position.fromArray(config.ball.initialPosition);
      ball.velocity = (new THREE.Vector3()).fromArray(config.ball.initialVelocity);
      scene.add(ball);
    }

    function wireBox(width, height, material) {
      var geometry = new THREE.Geometry();
      geometry.vertices.push(
        new THREE.Vector3(-width/2, -height/2, 0),
        new THREE.Vector3(width/2, -height/2, 0),
        new THREE.Vector3(width/2, height/2, 0),
        new THREE.Vector3(-width/2, height/2, 0),
        new THREE.Vector3(-width/2, -height/2, 0));
      return new THREE.Line(geometry, material);
    }

    function newBall() {
      var ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 15, 20),
          materials.whitePlasma);
      
      ball.light = new THREE.PointLight(0xdddddd, 1, 15);
      ball.add(ball.light);

      ball.glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: THREE.ImageUtils.loadTexture('img/glow.png'),
        useScreenCoordinates: false,
        color: 0xffffff, trasparent: false,
        blending: THREE.AdditiveBlending}));
      ball.glow.scale.set(1.8, 1.8, 1.8);
      ball.glow.position.z = 0;
      ball.add(ball.glow);
      
      return ball;
    }

    function updateScale() {
      var size = Math.min(window.innerWidth, window.innerHeight);
      renderer.setSize(size, size);
    }

    mouseMoved.lastTime = null;
    mouseMoved.lastLocation = null;
    function mouseMoved(evt) {
      if (gameOver) {return}
      var bounds = canvas.getBoundingClientRect();
      var x = (evt.clientX - bounds.left) * 20 / bounds.width - 10;
      var y = (evt.clientY - bounds.top) * -20 / bounds.height + 10;

      var maxX = 10 - paddle.geometry.width / 2;
      var maxY = 10 - paddle.geometry.height / 2;

      lastLocation = [
        Math.max(-maxX, Math.min(x, maxX)),
        Math.max(-maxY, Math.min(y, maxY))];
      paddle.position.set(lastLocation[0], lastLocation[1], 0.1);
    }

    function currentTimeMillis() {
      return (new Date).getTime();
    }

    render.startTime = null;
    render.lastTime = null;
    
    function render(timestamp) {
      requestAnimationFrame(render);
      
      if (render.startTime === null) {render.startTime = timestamp}
      var runTime = timestamp - render.startTime;
      
      var delta = 0;
      if (render.lastTime !== null) {delta = timestamp - render.lastTime}
      render.lastTime = timestamp;

      if (!gameOver) {
        animate(delta, runTime);
      }

      renderer.render(scene, camera);
    }

    function animate(delta, runTime) {
      handleCollisions();
      ball.position.add(ball.velocity);
      
      updatePulseRing();

    }

    function handleCollisions() {
      if (ball.position.x <= -9.5) {
        ball.velocity.x = Math.abs(ball.velocity.x);
        ball.position.x = -9.5}
      if (ball.position.x >= 9.5) {
        ball.velocity.x = -Math.abs(ball.velocity.x);
        ball.position.x = 9.5}
      if (ball.position.y <= -9.5) {
        ball.velocity.y = Math.abs(ball.velocity.y);
        ball.position.y = -9.5}
      if (ball.position.y >= 9.5) {
        ball.velocity.y = -Math.abs(ball.velocity.y);
        ball.position.y = 9.5}
      if (ball.position.z <= -39.5) {
        ball.velocity.z = Math.abs(ball.velocity.z);
        ball.position.z = -39.5}
      if (ball.position.z >= -0.5) {
        var xDiff = ball.position.x - paddle.position.x;
        var yDiff = ball.position.y - paddle.position.y;

        var xColl = (paddle.geometry.width + 1) / 2;
        var yColl = (paddle.geometry.width + 1) / 2;

        ball.position.z = -0.5;

        if (Math.abs(xDiff) < xColl && Math.abs(yDiff) < yColl) {
          ball.velocity.z = -Math.abs(ball.velocity.z);
          ball.velocity.x += xDiff / 10;
          ball.velocity.y += yDiff / 10;
          ball.velocity.z -= 0.03;
        } else {
          gameOver = true;
          ball.velocity.set(0,0,0);
          ball.material.color.setHex(0x990000);
          ball.glow.material.color.setHex(0x350000);
          ball.glow.scale.set(2.5,2.5,2.5);
          ball.light.color.setHex(0x880000);
        }
      }
    }
    function updatePulseRing() {
      var pulseSize = Math.min(1, ((-0.5-ball.position.z) / 40.0) * 4);
      if (ball.velocity.z < 0) {pulseSize = 1}

      var rLeft = (paddle.position.x - paddle.geometry.width/2)*(1-pulseSize) - 10.01*pulseSize;
      var rRight = (paddle.position.x + paddle.geometry.width/2)*(1-pulseSize) + 10.01*pulseSize;
      var rTop = (paddle.position.y + paddle.geometry.height/2)*(1-pulseSize) + 10.01*pulseSize;
      var rBottom = (paddle.position.y - paddle.geometry.height/2)*(1-pulseSize) - 10.01*pulseSize;

      scene.remove(pulseRing);
      pulseRing = wireBox(
          rRight - rLeft,
          rTop - rBottom,
          materials.whiteLines);
      pulseRing.position.set((rLeft + rRight)/2, (rTop + rBottom)/2, 0);
      scene.add(pulseRing);
    }
  }
}});