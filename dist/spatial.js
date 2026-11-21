import * as THREE from './vendor/three.module.min.js';

// Illustrative parametric objects, not supplied CAD or computed flow fields.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const compact = matchMedia('(max-width: 900px)');
const clamp = THREE.MathUtils.clamp, lerp = THREE.MathUtils.lerp;
const views = [];
let paused = document.body.classList.contains('paused'), frame = 0, last = 0, elapsed = 0;
const scroll = { blade: 0, layers: .2 }, pointer = { x: 0, y: 0 };
let manualLayers = false, manualStudy = false;
const study = document.querySelector('.design-study');
const layerInput = document.querySelector('#layer-separation');
const phaseButtons = [...document.querySelectorAll('[data-study-step]')];
let activePhase = -1;

function createView(host, light = false) {
  const canvas = document.createElement('canvas');
  canvas.className = 'spatial-canvas'; canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch { return null; }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = light ? 1.15 : 1.25;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 60);
  camera.position.set(0, 0, 12);
  scene.add(new THREE.HemisphereLight(0xf0f4de, 0x203021, 2.2));
  const key = new THREE.DirectionalLight(0xfff4d9, 3.5); key.position.set(-4, 6, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0xc2ed8e, 2.4); rim.position.set(5, 2, -3); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 1.5); fill.position.set(3, -2, 6); scene.add(fill);
  host.append(canvas);
  const view = { host, canvas, renderer, scene, camera, visible: false, lost: false, update: () => {} };
  function resize() {
    const box = host.getBoundingClientRect();
    const height = host.id === 'blade-study' ? Math.max(1, box.height - 84) : box.height;
    if (!box.width || !box.height) return;
    const ratio = Math.min(devicePixelRatio || 1, compact.matches ? 1.25 : 1.5, Math.sqrt(1800000 / (box.width * height)));
    renderer.setPixelRatio(ratio); renderer.setSize(box.width, height, false);
    camera.aspect = box.width / height; camera.updateProjectionMatrix();
    view.update(0); renderer.render(scene, camera); schedule();
  }
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(entries => { view.visible = entries[0].isIntersecting; if (view.visible) schedule(); }, { rootMargin: '100px' }).observe(host);
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); view.lost = true; host.classList.remove('has-3d'); if(host.classList.contains('field'))document.dispatchEvent(new Event('portfolio:3d-unavailable')); });
  canvas.addEventListener('webglcontextrestored', () => { view.lost = false; host.classList.add('has-3d'); if(host.classList.contains('field'))document.dispatchEvent(new Event('portfolio:3d-ready')); resize(); });
  host.classList.add('has-3d'); views.push(view); return view;
}

function bladeGeometry() {
  const rows = 64, cols = 48, positions = [], indices = [], lines = [];
  for (let i = 0; i <= rows; i++) {
    const s = i / rows;
    const chord = s < .13 ? lerp(.35, 1.36, s / .13) : 1.36 * Math.pow((1 - s) / .87, .72) + .018;
    const twist = lerp(.42, -.10, s);
    for (let j = 0; j < cols; j++) {
      const v = j / cols, x = (1 - Math.cos(v * Math.PI * 2)) / 2;
      const thickness = 5 * lerp(.22, .11, s) * (.2969 * Math.sqrt(x) - .126 * x - .3516 * x*x + .2843 * x*x*x - .1036 * x*x*x*x);
      const z = (Math.sin(v * Math.PI * 2) >= 0 ? thickness : -thickness) + .025 * Math.sin(x * Math.PI);
      const px = (x - .38) * chord, pz = z * chord;
      positions.push(px * Math.cos(twist) + pz * Math.sin(twist) + .26*s*s, (s - .5) * 6.6, -px * Math.sin(twist) + pz * Math.cos(twist));
      if (i < rows) { const a = i * cols + j, b = i * cols + (j+1)%cols, c = a + cols, d = b + cols; indices.push(a,c,b,b,c,d); }
    }
  }
  function segment(a,b) { lines.push(...positions.slice(a*3,a*3+3),...positions.slice(b*3,b*3+3)); }
  for (let i=0;i<=rows;i+=3) for(let j=0;j<cols;j++) segment(i*cols+j,i*cols+(j+1)%cols);
  for (let j=0;j<cols;j+=4) for(let i=0;i<rows;i++) segment(i*cols+j,(i+1)*cols+j);
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3)); geometry.setIndex(indices); geometry.computeVertexNormals();
  const wire = new THREE.BufferGeometry(); wire.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));
  return { geometry, wire };
}
const bladeGeo = bladeGeometry();
function makeBlade() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0xc5d1aa, metalness: .36, roughness: .36, transparent: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const mesh = new THREE.Mesh(bladeGeo.geometry, material); group.add(mesh);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xdcf99b, transparent: true, opacity: .08, depthWrite: false });
  const wire = new THREE.LineSegments(bladeGeo.wire, lineMaterial); group.add(wire);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.16,32),new THREE.MeshStandardMaterial({color:0x52664a,roughness:.4,metalness:.5}));
  collar.position.y = -3.35; group.add(collar);
  return { group, material, lineMaterial, collar };
}
/* ------------------------------------------------------------------
   Hero: one learning system, many problems.
   A GPU particle field morphs between four illustrative point clouds —
   a neural network, a turbine blade, a patch antenna with a radiation
   lobe, and a graph. Morphing runs in the vertex shader; JS only moves
   a few uniforms per frame. Illustrative geometry, not research data.
------------------------------------------------------------------- */
const shaderFiles = Promise.all(['particles.vert.glsl', 'particles.frag.glsl'].map(name =>
  fetch(new URL(`./shaders/${name}`, import.meta.url)).then(r => { if (!r.ok) throw new Error(`Shader ${name}: ${r.status}`); return r.text(); })));
function seeded(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function morphTargets(count) {
  const rand = seeded(7), R = () => rand() * 2 - 1;
  const net = new Float32Array(count * 3), blade = new Float32Array(count * 3), ant = new Float32Array(count * 3), graph = new Float32Array(count * 3), seed = new Float32Array(count);
  const put = (arr, i, x, y, z) => { arr[i*3] = x; arr[i*3+1] = y; arr[i*3+2] = z; };
  // 1 · Neural network: layered nodes plus particles streaming along every weight.
  const layers = [5, 8, 11, 11, 8, 5], nodes = layers.map((k, l) => Array.from({ length: k }, (_, i) => {
    const x = -4.1 + l * (8.2 / (layers.length - 1)), y = (i - (k - 1) / 2) * .62, a = (i / k) * Math.PI * 2 + l;
    return [x, y, Math.cos(a) * .55];
  }));
  // 3 · Graph: nodes in an ellipsoid, each linked to its three nearest neighbours.
  const gNodes = Array.from({ length: 46 }, () => { let v; do v = [R(), R(), R()]; while (Math.hypot(...v) > 1); return [v[0] * 3.9, v[1] * 2.9, v[2] * 2.2]; });
  const gEdges = [];
  gNodes.forEach((a, i) => gNodes.map((b, j) => [j, Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2])]).filter(([j]) => j !== i).sort((p, q) => p[1] - q[1]).slice(0, 3).forEach(([j]) => gEdges.push([i, j])));
  const bladeEuler = new THREE.Euler(.22, -.32, -.64), v3 = new THREE.Vector3(), antEuler = new THREE.Euler(.55, -.5, 0);
  for (let i = 0; i < count; i++) {
    seed[i] = rand();
    // network
    if (rand() < .3) { const l = Math.floor(rand() * layers.length), n = nodes[l][Math.floor(rand() * layers[l])]; put(net, i, n[0] + R() * .07, n[1] + R() * .07, n[2] + R() * .07); }
    else { const l = Math.floor(rand() * (layers.length - 1)), a = nodes[l][Math.floor(rand() * layers[l])], b = nodes[l+1][Math.floor(rand() * layers[l+1])], t = rand(); put(net, i, lerp(a[0], b[0], t), lerp(a[1], b[1], t) + R() * .012, lerp(a[2], b[2], t)); }
    // blade surface (same parametric section law as the study blade)
    { const s = rand(), v = rand(), chord = s < .13 ? lerp(.35, 1.36, s / .13) : 1.36 * Math.pow((1 - s) / .87, .72) + .018, twist = lerp(.42, -.10, s), x = (1 - Math.cos(v * Math.PI * 2)) / 2;
      const th = 5 * lerp(.22, .11, s) * (.2969 * Math.sqrt(x) - .126 * x - .3516 * x*x + .2843 * x*x*x - .1036 * x*x*x*x), z = (Math.sin(v * Math.PI * 2) >= 0 ? th : -th);
      const px = (x - .38) * chord * 1.15, pz = z * chord * 1.15;
      v3.set(px * Math.cos(twist) + pz * Math.sin(twist) + .3 * s * s, (s - .5) * 7.4, -px * Math.sin(twist) + pz * Math.cos(twist)).applyEuler(bladeEuler);
      put(blade, i, v3.x, v3.y, v3.z); }
    // antenna: substrate grid, inset-fed patch, and a radiation lobe above it
    { const r = rand();
      if (r < .32) v3.set(Math.round(R() * 22) / 10 * 1.15, -.55, Math.round(R() * 17) / 10 * 1.15);
      else if (r < .58) { let x, z; do { x = R() * 1.45; z = rand() * 2.1 - 1.2; } while (z > .2 && Math.abs(x) < .2 && Math.abs(x) > .07); v3.set(x * 1.15, -.42, z * 1.15); }
      else if (r < .63) v3.set(R() * .08, -.42, lerp(.2, 2.0, rand()) * 1.15);
      else { const th = Math.acos(Math.pow(rand(), .55)) * .98, ph = rand() * Math.PI * 2, rr = 3.1 * Math.pow(Math.cos(th), 1.4) * (.96 + rand() * .04); v3.set(rr * Math.sin(th) * Math.cos(ph), -.4 + rr * Math.cos(th), rr * Math.sin(th) * Math.sin(ph)); }
      v3.y -= .4; v3.applyEuler(antEuler); put(ant, i, v3.x, v3.y, v3.z); }
    // graph
    if (rand() < .3) { const n = gNodes[Math.floor(rand() * gNodes.length)]; put(graph, i, n[0] + R() * .09, n[1] + R() * .09, n[2] + R() * .09); }
    else { const [a, b] = gEdges[Math.floor(rand() * gEdges.length)].map(k => gNodes[k]), t = rand(); put(graph, i, lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)); }
  }
  return { net, blade, ant, graph, seed };
}
function makeMorphField(count, [vertexShader, fragmentShader]) {
  const t = morphTargets(count), geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(t.net, 3));
  geometry.setAttribute('aBlade', new THREE.BufferAttribute(t.blade, 3));
  geometry.setAttribute('aAnt', new THREE.BufferAttribute(t.ant, 3));
  geometry.setAttribute('aGraph', new THREE.BufferAttribute(t.graph, 3));
  geometry.setAttribute('aRand', new THREE.BufferAttribute(t.seed, 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);
  const uniforms = { uTime: { value: 0 }, uMorph: { value: 0 }, uPixel: { value: 1 }, uSize: { value: 58 }, uScatter: { value: 0 }, uMouse: { value: new THREE.Vector3(99, 99, 99) }, uColorA: { value: new THREE.Color(0xdcf99b) }, uColorB: { value: new THREE.Color(0x6fb6a2) } };
  // GLSL lives in dist/shaders/*.glsl.
  const material = new THREE.ShaderMaterial({ uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader, fragmentShader });
  const points = new THREE.Points(geometry, material);
  // Faint depth dust behind the morph.
  const dustRand = seeded(11), dust = new Float32Array(900 * 3);
  for (let i = 0; i < dust.length; i += 3) { dust[i] = (dustRand() - .5) * 22; dust[i+1] = (dustRand() - .5) * 14; dust[i+2] = -3 - dustRand() * 8; }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dust, 3));
  const dustPoints = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x8fa873, size: .035, transparent: true, opacity: .45, depthWrite: false }));
  return { points, uniforms, dustPoints };
}

const heroView = createView(document.querySelector('.field'));
if (heroView) shaderFiles.then(shaders => {
  const field = makeMorphField(compact.matches ? 7000 : 14000, shaders), group = new THREE.Group();
  group.add(field.points); heroView.scene.add(group, field.dustPoints);
  const legend = [...document.querySelectorAll('.morph-legend li')];
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3(), mouseTarget = new THREE.Vector3(99, 99, 99), ndc = new THREE.Vector2();
  let mouseActive = false, activeShape = -1;
  const hero = document.querySelector('.hero');
  hero.addEventListener('pointermove', e => { const r = heroView.canvas.getBoundingClientRect(); if (!r.width) return; ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); mouseActive = true; }, { passive: true });
  hero.addEventListener('pointerleave', () => { mouseActive = false; });
  addEventListener('scroll', () => { if (heroView.visible) schedule(); }, { passive: true });
  const HOLD = 3.4, MORPH = 2.1;
  heroView.update = () => {
    const aspect = heroView.camera.aspect;
    heroView.camera.position.z = aspect < 1 ? 16 : 12.2;
    group.position.set(aspect < 1 ? 0 : .45, aspect < 1 ? .6 : 0, 0);
    // Morph timeline (frozen while paused or under reduced motion).
    const cycle = elapsed / (HOLD + MORPH), stage = Math.floor(cycle), local = (cycle - stage) * (HOLD + MORPH);
    const f = clamp((local - HOLD) / MORPH, 0, 1);
    field.uniforms.uMorph.value = stage + f; field.uniforms.uTime.value = elapsed;
    const shapeNow = (stage + (f > .5 ? 1 : 0)) % 4;
    if (shapeNow !== activeShape) { activeShape = shapeNow; legend.forEach((li, i) => li.classList.toggle('is-active', i === shapeNow)); }
    group.rotation.set(.08 + pointer.y * .22, -.18 + pointer.x * .35 + Math.sin(elapsed * .16) * .32, 0);
    field.dustPoints.rotation.y = elapsed * .012;
    // Pointer parts the field; scrolling away scatters it.
    if (mouseActive && !paused && !reduced.matches) { ray.setFromCamera(ndc, heroView.camera); if (ray.ray.intersectPlane(plane, hit)) mouseTarget.copy(group.worldToLocal(hit)); }
    else mouseTarget.set(99, 99, 99);
    const m = field.uniforms.uMouse.value;
    if (mouseTarget.x > 50 || m.x > 50) m.copy(mouseTarget); else m.lerp(mouseTarget, .12);
    const heroBox = hero.getBoundingClientRect();
    field.uniforms.uScatter.value = reduced.matches ? 0 : Math.pow(clamp(-heroBox.top / (heroBox.height * .85), 0, 1), 1.6) * .7;
    field.uniforms.uPixel.value = heroView.renderer.getPixelRatio();
  };
  document.dispatchEvent(new Event('portfolio:3d-ready'));
  renderOnce(); schedule();
}).catch(error => {
  // Shaders unavailable: hand the hero back to the 2D canvas field.
  console.warn('[spatial] hero shaders failed, using 2D fallback', error);
  heroView.lost = true; heroView.canvas.remove(); heroView.host.classList.remove('has-3d');
  document.dispatchEvent(new Event('portfolio:3d-unavailable'));
});

const studyView = createView(document.querySelector('#blade-study'));
if (studyView) {
  const blade=makeBlade();studyView.scene.add(blade.group);
  const halo=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:100},(_,i)=>new THREE.Vector3(Math.cos(i/100*Math.PI*2)*3.4,Math.sin(i/100*Math.PI*2)*3.4,-1))),new THREE.LineBasicMaterial({color:0x667e50,transparent:true,opacity:.18}));studyView.scene.add(halo);
  studyView.update=()=>{
    const p=scroll.blade, fade=clamp((p-.16)/.36,0,1);
    blade.material.opacity=lerp(1,.06,fade);blade.material.depthWrite=fade<.7;
    blade.lineMaterial.opacity=lerp(.06,.82,fade);
    blade.group.rotation.set(lerp(.16,.05,p),lerp(-.6,.6,p),lerp(-.55,-.12,p));
    blade.group.position.y=compact.matches?.7:.3;
    studyView.camera.position.z=compact.matches?12.8:studyView.camera.aspect<1.2?13.9:11.9;
    halo.rotation.y=p*.4;halo.rotation.x=.3;
  };
}

const antennaView=createView(document.querySelector('#antenna-stage'),true);
if(antennaView) {
  const assembly=new THREE.Group();antennaView.scene.add(assembly);
  const substrate=new THREE.Mesh(new THREE.BoxGeometry(4.4,.14,3.5),new THREE.MeshStandardMaterial({color:0x75895d,roughness:.78,metalness:.02}));assembly.add(substrate);
  const ground=new THREE.Mesh(new THREE.BoxGeometry(4.4,.025,3.5),new THREE.MeshStandardMaterial({color:0xa7864e,roughness:.43,metalness:.65}));assembly.add(ground);
  // A single continuous top-copper outline: equal inset gaps either side of the straight feed.
  const outline=[[-1.4,-1.15],[1.4,-1.15],[1.4,.85],[.18,.85],[.18,.2],[.08,.2],[.08,1.75],[-.08,1.75],[-.08,.2],[-.18,.2],[-.18,.85],[-1.4,.85]];
  const shape=new THREE.Shape();outline.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
  const copper=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:false}),new THREE.MeshStandardMaterial({color:0xd1ae6a,roughness:.3,metalness:.65}));copper.rotation.x=-Math.PI/2;assembly.add(copper);
  const edgeMaterial=new THREE.LineBasicMaterial({color:0x435735,transparent:true,opacity:.4});
  const edges=new THREE.LineSegments(new THREE.EdgesGeometry(substrate.geometry),edgeMaterial);substrate.add(edges);
  const guidePositions=[];for(const x of [-2.2,2.2])for(const z of [-1.75,1.75])guidePositions.push(x,-1.15,z,x,1.4,z);
  const guides=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(guidePositions,3)),new THREE.LineDashedMaterial({color:0x73865e,dashSize:.06,gapSize:.07,transparent:true,opacity:.0}));guides.computeLineDistances();assembly.add(guides);
  antennaView.camera.position.set(6.6,6.8,8.1);antennaView.camera.lookAt(0,0,0);
  antennaView.update=()=>{
    const p=scroll.layers; copper.position.y=.072+p*1.12;ground.position.y=-.088-p*.85;
    assembly.rotation.y=-.22; guides.material.opacity=p*.35;
    if(antennaView.camera.aspect<1.1)antennaView.camera.zoom=.9;else antennaView.camera.zoom=1.04;
    antennaView.camera.updateProjectionMatrix();
  };
}

function phase(index) {
  document.querySelector('.study-progress span').style.transform=`scaleX(${Math.max(.02,scroll.blade)})`;
  if(index===activePhase)return;activePhase=index;study.dataset.phase=String(index);
  phaseButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
  document.querySelectorAll('[data-study-panel]').forEach((el,i)=>{el.classList.toggle('is-current',i===index);el.setAttribute('aria-hidden',String(i!==index));});
}
function renderOnce() { views.forEach(v=>{if(!v.lost){v.update(0);if(v.visible)v.renderer.render(v.scene,v.camera);}}); }
function loop(now) {
  frame=0;if(document.hidden)return;
  const dt=Math.min((now-last)/1000,.04)||.016;last=now;
  if(!paused&&!reduced.matches)elapsed+=dt;
  views.forEach(v=>{if(v.visible&&!v.lost){v.update(dt);v.renderer.render(v.scene,v.camera);}});
  if(!paused&&!reduced.matches&&heroView?.visible&&!heroView.lost)frame=requestAnimationFrame(loop);
}
function schedule(){if(!frame&&!document.hidden){last=performance.now();frame=requestAnimationFrame(loop);}}

let studyTrigger, layerTrigger;
function setupScroll() {
  studyTrigger?.kill();layerTrigger?.kill();
  studyTrigger=null;layerTrigger=null;manualStudy=false;
  study.classList.toggle('is-enhanced',Boolean(studyView));
  study.classList.remove('is-scrollable');
  if(window.gsap&&window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if(studyView&&!compact.matches&&!reduced.matches) {
      study.classList.add('is-scrollable');
      studyTrigger=ScrollTrigger.create({trigger:study,start:'top top',end:'bottom bottom',onUpdate:self=>{
        if(paused||manualStudy)return;
        gsap.to(scroll,{blade:self.progress,duration:.38,ease:'power2.out',overwrite:'auto',onUpdate:()=>{phase(Math.min(2,Math.floor(scroll.blade*3)));schedule();}});
      }});
    }
    if(antennaView&&!reduced.matches)layerTrigger=ScrollTrigger.create({trigger:'#antenna-stage',start:'top 40%',end:'bottom 35%',onUpdate:self=>{
      if(paused||manualLayers)return;scroll.layers=.2+.8*self.progress;layerInput.value=Math.round(scroll.layers*100);document.querySelector('#layer-value').textContent=layerInput.value+'%';schedule();
    }});
    ScrollTrigger.refresh();
  }
  document.querySelector('.study-instruction').textContent=studyTrigger?'SCROLL TO EXAMINE · OR SELECT A STAGE':'SELECT A STAGE TO EXAMINE';
  document.querySelector('#layer-follow').hidden=!layerTrigger;
  if(studyView)phase(activePhase<0?0:activePhase);renderOnce();schedule();
}
phaseButtons.forEach((button,i)=>button.addEventListener('click',()=>{
  document.dispatchEvent(new CustomEvent('portfolio:transition',{detail:{kind:'step'}}));
  if(studyTrigger&&!paused){manualStudy=false;window.scrollTo({top:studyTrigger.start+(studyTrigger.end-studyTrigger.start)*(i/3+.12),behavior:reduced.matches?'instant':'smooth'});}
  else {manualStudy=true;scroll.blade=i*.45;phase(i);renderOnce();schedule();}
}));
layerInput.addEventListener('input',()=>{manualLayers=true;scroll.layers=Number(layerInput.value)/100;document.querySelector('#layer-value').textContent=layerInput.value+'%';renderOnce();schedule();});
layerInput.addEventListener('change',()=>document.dispatchEvent(new CustomEvent('portfolio:transition',{detail:{kind:'step'}})));
document.querySelector('#layer-follow').addEventListener('click',()=>{manualLayers=false;scroll.layers=.2+.8*(layerTrigger?.progress||0);layerInput.value=Math.round(scroll.layers*100);document.querySelector('#layer-value').textContent=layerInput.value+'%';renderOnce();schedule();});
document.querySelector('.hero').addEventListener('pointermove',e=>{if(paused||reduced.matches||compact.matches)return;const box=e.currentTarget.getBoundingClientRect();pointer.x=(e.clientX-box.left)/box.width-.5;pointer.y=(e.clientY-box.top)/box.height-.5;schedule();},{passive:true});
document.querySelector('.hero').addEventListener('pointerleave',()=>{pointer.x=0;pointer.y=0;schedule();});
document.addEventListener('portfolio:motion',e=>{paused=e.detail.paused;if(paused&&window.gsap)gsap.killTweensOf(scroll);if(!paused){manualStudy=false;studyTrigger?.update();}renderOnce();schedule();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else schedule();});
reduced.addEventListener('change',()=>{paused=reduced.matches;setupScroll();});compact.addEventListener('change',setupScroll);
window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;});
window.addEventListener('pageshow',()=>schedule());
setupScroll();schedule();
