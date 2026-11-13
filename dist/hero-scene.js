import * as THREE from './vendor/three.module.min.js';
import { createCitrusSculpture } from './citrus-sculpture.js';

// The existing oval-aperture scene, now displaying the supplied citrus composition.
// Artwork and geometry are local; there are no remote assets or trackers.
export async function createHeroScene(canvas, { reducedMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 1, .1, 80);
  const compactViewport = matchMedia('(max-width:760px)');
  camera.position.set(0, 0, 9.5);
  const { group: sculpture, dispose: disposeSculpture } = await createCitrusSculpture();
  scene.add(sculpture);
  const frameMaterial=new THREE.MeshBasicMaterial({color:0xf5f2eb,side:THREE.DoubleSide,toneMapped:false});
  const frame=new THREE.Mesh(new THREE.BufferGeometry(),frameMaterial);
  frame.position.z=0;scene.add(frame);
  let width=0,height=0,worldHeight=1,worldWidth=1,progress=0,entrance=1;
  let off=reducedMotion,destroyed=false;
  function resize() {
    const bounds=canvas.getBoundingClientRect();
    if(!bounds.width || !bounds.height)return;
    width=bounds.width;height=bounds.height;
    renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
    worldHeight=2*camera.position.z*Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
    worldWidth=worldHeight*camera.aspect;
    const fw=worldWidth*.925,fh=worldHeight*(compactViewport.matches?.69:.72);
    const shape=new THREE.Shape();
    shape.moveTo(-fw/2,-fh/2);shape.lineTo(fw/2,-fh/2);shape.lineTo(fw/2,fh/2);shape.lineTo(-fw/2,fh/2);shape.closePath();
    const hole=new THREE.Path();
    hole.absellipse(0,0,fw*.455,fh*(compactViewport.matches?.31:.30),0,Math.PI*2,true,.23);
    shape.holes.push(hole);
    frame.geometry.dispose();frame.geometry=new THREE.ShapeGeometry(shape,100);
    render();
  }
  function render() {
    const mobile=compactViewport.matches;
    const depth = .8;
    const artworkAspect = sculpture.userData.aspect || .8;
    const depthCorrection = (camera.position.z - depth) / camera.position.z;
    const rootScale = Math.min(worldHeight * .98 / 6.4, worldWidth * (mobile ? .86 : .56) / (6.4 * artworkAspect)) * depthCorrection;
    const spin=off?.08:.08+Math.sin(progress*Math.PI*2)*.10;
    sculpture.rotation.set(.04,spin,-.04+progress*.18);
    // The complete artwork stands in front of the panel, like the flower reference.
    sculpture.position.set(0,worldHeight*.025-progress*.6-(1-entrance)*.35,depth);
    sculpture.scale.setScalar(rootScale*(1-progress*.12));
    frame.position.y=worldHeight*(.025+Math.min(progress/.46,1)*1.17);
    renderer.render(scene,camera);
  }
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);
  const contextLost=event=>{event.preventDefault();document.documentElement.classList.remove('hero-webgl');};
  canvas.addEventListener('webglcontextlost',contextLost);
  document.documentElement.classList.add('hero-webgl');
  resize();
  canvas.dataset.scene='ready';
  return {
    setScroll(value){if(destroyed)return;progress=THREE.MathUtils.clamp(value,0,1);render();},
    setEntrance(value){if(destroyed)return;entrance=THREE.MathUtils.clamp(value,0,1);render();},
    setMotion(disabled){off=disabled;render();},
    dispose(){destroyed=true;resizeObserver.disconnect();canvas.removeEventListener('webglcontextlost',contextLost);frame.geometry.dispose();disposeSculpture();frameMaterial.dispose();renderer.dispose();}
  };
}
