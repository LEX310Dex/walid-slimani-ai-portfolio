// Particle morph — fragment stage: soft round sprite, tinted by height.
uniform vec3 uColorA, uColorB;

varying float vAlpha;
varying float vTone;

void main() {
  float d = length(gl_PointCoord - .5);
  if (d > .5) discard;
  float glow = pow(smoothstep(.5, 0., d), 2.);
  gl_FragColor = vec4(mix(uColorB, uColorA, vTone) * glow, glow * vAlpha);
  #include <colorspace_fragment>
}
