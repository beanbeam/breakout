define(['three'], function() {return{
  whitePlasma: new THREE.MeshBasicMaterial(0xffffff),
  wallMaterial: new THREE.MeshPhongMaterial({
    color: 0xffffff,
    shininess: 10,
    specular: 0x333333,
    side: THREE.BackSide}),
  glowGlass: new THREE.MeshPhongMaterial({
    color: 0xffffff,
    emissive: 0x333333,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide}),   
  whiteLines: new THREE.LineBasicMaterial({color: 0xffffff})
}});
