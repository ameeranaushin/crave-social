import * as THREE from './vendor/three.module.min.js';

// Transparent artwork prepared from the supplied orange-and-glass reference.
// The depth-tested image plane preserves its photographic surface and portal motion.
export async function createCitrusSculpture() {
  const texture = await new THREE.TextureLoader().loadAsync('assets/citrus-glass.png');
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const geometry = new THREE.PlaneGeometry(6.4 * texture.image.width / texture.image.height, 6.4);
  const material = new THREE.MeshBasicMaterial({
    map: texture, transparent: true, alphaTest: .025, depthWrite: true,
    side: THREE.DoubleSide, toneMapped: false
  });
  const group = new THREE.Group();
  group.userData.aspect = texture.image.width / texture.image.height;
  group.add(new THREE.Mesh(geometry, material));
  return { group, dispose() { geometry.dispose(); material.dispose(); texture.dispose(); } };
}
