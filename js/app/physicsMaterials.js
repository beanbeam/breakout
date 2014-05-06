define(['cannon'], function(CANNON) {
  var ballMaterial = new CANNON.Material();
  var wallMaterial = new CANNON.Material();
  var paddleMaterial = new CANNON.Material();
  
  return {
    ball: ballMaterial,
    wall: wallMaterial,
    paddle: paddleMaterial,

    addTo: function(world) {
      world.addContactMaterial(new CANNON.ContactMaterial(
          ballMaterial, wallMaterial,
          0.0, 1.0));
      world.addContactMaterial(new CANNON.ContactMaterial(
          ballMaterial, paddleMaterial,
          0.0, 1.01));
    }
  }
});
