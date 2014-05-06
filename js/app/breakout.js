define(['three', 'cannon', 'config', 'renderMaterials', 'physicsMaterials'], function(THREE, CANNON, config, materials, physicsMaterials) {return{
  Game: function() {
    var canvas;
    var scene;
    var camera;
    var renderer;

    var world;

    var paddle;
    var pulseRing;
    var ball;

    var gameOver = false;

    !function() {
      scene = new THREE.Scene();
      camera = initCamera(config.cameraDistance);
      canvas = document.getElementById('game-canvas');
      renderer = new THREE.WebGLRenderer({canvas: canvas});

      world = new CANNON.World();
      world.broadphase = new CANNON.NaiveBroadphase();

      initObjects();
      physicsMaterials.addTo(world);

      updateScale();
      window.addEventListener('resize', updateScale);
      canvas.addEventListener('mousemove', mouseMoved);
    }()

    this.start = function() {requestAnimationFrame(render)}

    function initCamera(distance) {
      var fov = 360 * Math.atan2(10, distance) / Math.PI;
      var camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 1000);
      camera.position.z = distance+config.paddle.thickness;
      return camera;
    }

    function initObjects() {
      scene.add(new THREE.AmbientLight(0x222222));

      var walls = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 40),
          materials.wallMaterial);
      walls.position.set(0, 0, -20);
      scene.add(walls);

      initWallPhysics();

      paddle = new THREE.Mesh(new THREE.BoxGeometry(
            config.paddle.width,
            config.paddle.height,
            config.paddle.thickness),
          materials.glowGlass);
      paddle.position.z = config.paddle.thickness/2;
      scene.add(paddle);

      pulseRing = wireBox(25, 25, materials.whiteLines);
      pulseRing.position.z = config.paddle.thickness;
      scene.add(pulseRing);

      ball = newBall();
      ball.position.fromArray(config.ball.initialPosition);
      ball.rigidBody.velocity = new CANNON.Vec3(
          config.ball.initialVelocity[0],
          config.ball.initialVelocity[1],
          config.ball.initialVelocity[2]);
      scene.add(ball);
    }

    function initWallPhysics() {
      var leftWall = wallFacing(new CANNON.Vec3(1, 0, 0));
      leftWall.position.x = -10;

      var rightWall = wallFacing(new CANNON.Vec3(-1, 0, 0));
      rightWall.position.x = 10;

      var bottomWall = wallFacing(new CANNON.Vec3(0, 1, 0));
      bottomWall.position.y = -10;

      var topWall = wallFacing(new CANNON.Vec3(0, -1, 0));
      topWall.position.y = 10;

      var backWall = wallFacing(new CANNON.Vec3(0, 0, 1));
      backWall.position.z = -40;

      world.add(leftWall);
      world.add(rightWall);
      world.add(bottomWall);
      world.add(topWall);
      world.add(backWall);
    }

    function wallFacing(direction) {
      var plane = new CANNON.RigidBody(0, new CANNON.Plane(), physicsMaterials.wall);
      plane.quaternion.setFromVectors(new CANNON.Vec3(0, 0, 1), direction);
      return plane;
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
      var ball = new THREE.Mesh(new THREE.SphereGeometry(
            config.ball.radius,
            config.ball.detailLevel[0],
            config.ball.detailLevel[1]),
          materials.whitePlasma);

      ball.rigidBody = new CANNON.RigidBody(
          config.ball.mass,
          new CANNON.Sphere(config.ball.radius),
          physicsMaterials.ball);
      world.add(ball.rigidBody);

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

    function mouseMoved(evt) {
      if (gameOver) {return}
      var bounds = canvas.getBoundingClientRect();
      var x = (evt.clientX - bounds.left) * 20 / bounds.width - 10;
      var y = (evt.clientY - bounds.top) * -20 / bounds.height + 10;

      var maxX = 10 - config.paddle.width / 2;
      var maxY = 10 - config.paddle.height / 2;

      var newPosition = new THREE.Vector3(
        Math.max(-maxX, Math.min(x, maxX)),
        Math.max(-maxY, Math.min(y, maxY)),
        paddle.position.z);
      paddle.position = newPosition;
    }

    function currentTimeMillis() {
      return (new Date).getTime();
    }

    render.startTime = null;
    render.lastTime = null;
    render.lastVLoc = null;
    render.vTotalDelta = 0;
    render.vCheckCount = 0;
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

      render.vTotalDelta += delta;
      if (render.vCheckCount == 0) {
        var deltaX = 0;
        var deltaY = 0;

        if (render.lastVLoc !== null) {
          deltaX = paddle.position.x - render.lastVLoc.x;
          deltaY = paddle.position.y - render.lastVLoc.y;
        }

        paddle.velocity = new THREE.Vector3(
            Math.max(-0.2, Math.min(0.2, 8 * deltaX / render.vTotalDelta)),
            Math.max(-0.2, Math.min(0.2, 8 * deltaY / render.vTotalDelta)),
            0);

        render.lastVLoc = paddle.position;
        render.vTotalDelta = 0;
      }
      render.vCheckCount = (render.vCheckCount + 1) % 3;

      renderer.render(scene, camera);
    }

    function animate(delta, runTime) {
      if (!gameOver) {world.step(delta/1000.0)}
      ball.rigidBody.position.copy(ball.position);

      updatePulseRing();
    }

    function doPhysics(nextPosition) {
      var nextPosition = new THREE.Vector3();
      nextPosition.addVectors(ball.position, ball.velocity);

      if (ball.position.x <= -10 + config.ball.radius) {
        ball.velocity.x = Math.abs(ball.velocity.x);
        ball.position.x = -10 + config.ball.radius}
      if (ball.position.x >= 10 - config.ball.radius) {
        ball.velocity.x = -Math.abs(ball.velocity.x);
        ball.position.x = 10 - config.ball.radius}
      if (ball.position.y <= -10 + config.ball.radius) {
        ball.velocity.y = Math.abs(ball.velocity.y);
        ball.position.y = -10 + config.ball.radius}
      if (ball.position.y >= 10 - config.ball.radius) {
        ball.velocity.y = -Math.abs(ball.velocity.y);
        ball.position.y = 10 - config.ball.radius}
      if (ball.position.z <= -40 + config.ball.radius) {
        ball.velocity.z = Math.abs(ball.velocity.z);
        ball.position.z = -40 + config.ball.radius}
      if (ball.position.z >= -config.ball.radius) {
        var xDiff = ball.position.x - paddle.position.x;
        var yDiff = ball.position.y - paddle.position.y;

        var xColl = config.paddle.width / 2 + config.ball.radius;
        var yColl = config.paddle.width / 2 + config.ball.radius;

        ball.position.z = -config.ball.radius;

        if (Math.abs(xDiff) < xColl && Math.abs(yDiff) < yColl) {
          ball.velocity.z = -Math.abs(ball.velocity.z);
          ball.velocity.add(paddle.velocity);
          ball.velocity.z -= 0.03;
        } else {
          gameOver = true;
          nextPosition = ball.position;
          ball.material.color.setHex(0x990000);
          ball.glow.material.color.setHex(0x350000);
          ball.glow.scale.set(2.5,2.5,2.5);
          ball.light.color.setHex(0x880000);
        }
      }
      ball.position = nextPosition;
    }

    function updatePulseRing() {
      var pulseSize = Math.max(Math.min(1, ((-config.ball.radius-ball.position.z) / 40.0) * 4), 0);
      if (ball.rigidBody.velocity.z < 0) {pulseSize = 1}

      var rLeft = (paddle.position.x - config.paddle.width/2)*(1-pulseSize) - 10.01*pulseSize;
      var rRight = (paddle.position.x + config.paddle.width/2)*(1-pulseSize) + 10.01*pulseSize;
      var rTop = (paddle.position.y + config.paddle.height/2)*(1-pulseSize) + 10.01*pulseSize;
      var rBottom = (paddle.position.y - config.paddle.height/2)*(1-pulseSize) - 10.01*pulseSize;

      scene.remove(pulseRing);
      pulseRing = wireBox(
          rRight - rLeft,
          rTop - rBottom,
          materials.whiteLines);
      pulseRing.position.set(
          (rLeft + rRight)/2,
          (rTop + rBottom)/2,
          config.paddle.thickness);
      scene.add(pulseRing);
    }
  }
}});
