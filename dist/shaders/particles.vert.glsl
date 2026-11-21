// Particle morph — vertex stage.
// Each particle carries four target positions (network, blade, antenna, graph)
// and blends between consecutive targets with a per-particle stagger.
attribute vec3 aBlade;
attribute vec3 aAnt;
attribute vec3 aGraph;
attribute float aRand;

uniform float uTime, uMorph, uPixel, uSize, uScatter;
uniform vec3 uMouse;

varying float vAlpha;
varying float vTone;

vec3 shape(float i) {
  i = mod(i, 4.0);
  if (i < .5) return position;
  if (i < 1.5) return aBlade;
  if (i < 2.5) return aAnt;
  return aGraph;
}

void main() {
  float stage = floor(uMorph), f = fract(uMorph);
  float t = clamp((f - aRand * .35) / .65, 0., 1.);
  t = t * t * (3. - 2. * t);
  vec3 p = mix(shape(stage), shape(stage + 1.), t);

  // Arc outwards mid-morph, plus a slow idle drift.
  float arc = sin(t * 3.14159);
  p += arc * vec3(sin(aRand * 41. + uTime * .7), cos(aRand * 23. + uTime * .6), sin(aRand * 17. + uTime * .5)) * .85;
  p += .035 * vec3(sin(uTime * 1.3 + aRand * 30.), cos(uTime * 1.1 + aRand * 20.), sin(uTime * .9 + aRand * 10.));

  // Pointer repulsion and scroll-driven scatter.
  vec3 d = p - uMouse;
  float dist = length(d);
  p += (d / max(dist, .001)) * smoothstep(1.7, 0., dist) * .6;
  p += normalize(p + vec3(aRand - .5, .3, aRand)) * uScatter * (2. + aRand * 5.);

  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPixel * (.45 + aRand * aRand * 1.3) * (1. + arc * .5) / -mv.z;
  vAlpha = (.5 + .5 * aRand) * (1. - uScatter * .9);
  vTone = clamp((p.y + 3.6) / 7.2 + (aRand - .5) * .3, 0., 1.);
}
