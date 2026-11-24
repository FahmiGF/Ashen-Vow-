// Ashen Vow — WebGL2 skinned-PBR renderer for real GLB assets.
// Pipeline: shadow map → half-float HDR target (optional MSAA) → tonemap +
// spatial upscale/composite pass. Meshes come from assets/3d/*.glb, so geometry,
// UVs, PBR material values, skeletons and animation clips are authored assets
// rather than runtime primitives.
//
// The renderer is optional by design: if WebGL2 or the assets are unavailable it
// returns false and the Canvas presentation layer keeps rendering the scene, so
// 3D Mode never breaks on constrained hardware.
import { parseGLB, mat4LookAt, mat4Multiply, mat4Perspective } from './glb.js';

export const GFX3D_VERSION = '1.0.0';
const MAX_JOINTS = 32;

function identity() {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function ortho(left, right, bottom, top, near, far) {
  const out = identity();
  out[0] = 2 / (right - left);
  out[5] = 2 / (top - bottom);
  out[10] = -2 / (far - near);
  out[12] = -(right + left) / (right - left);
  out[13] = -(top + bottom) / (top - bottom);
  out[14] = -(far + near) / (far - near);
  return out;
}

function mulInto(out, a, b) {
  for (let c = 0; c < 4; c += 1) {
    for (let r = 0; r < 4; r += 1) {
      out[c * 4 + r] =
        a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

function trs(t, q, s) {
  const [x, y, z, w] = q;
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  const out = new Float32Array(16);
  out[0] = (1 - (yy + zz)) * s[0];
  out[1] = (xy + wz) * s[0];
  out[2] = (xz - wy) * s[0];
  out[4] = (xy - wz) * s[1];
  out[5] = (1 - (xx + zz)) * s[1];
  out[6] = (yz + wx) * s[1];
  out[8] = (xz + wy) * s[2];
  out[9] = (yz - wx) * s[2];
  out[10] = (1 - (xx + yy)) * s[2];
  out[12] = t[0];
  out[13] = t[1];
  out[14] = t[2];
  out[15] = 1;
  return out;
}

function quatY(angle) {
  return [0, Math.sin(angle / 2), 0, Math.cos(angle / 2)];
}

function parseColor(value, fallback = [0.5, 0.5, 0.5, 1]) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return fallback;
  const text = value.trim();
  if (text.startsWith('#')) {
    const hex = text.slice(1);
    const full = hex.length === 3 ? hex.split('').map((ch) => ch + ch).join('') : hex;
    const n = parseInt(full.slice(0, 6), 16);
    if (Number.isNaN(n)) return fallback;
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
  }
  const match = text.match(/rgba?\(([^)]+)\)/);
  if (match) {
    const parts = match[1].split(',').map((part) => parseFloat(part));
    return [parts[0] / 255, parts[1] / 255, parts[2] / 255, parts[3] ?? 1];
  }
  return fallback;
}

// ── shaders ───────────────────────────────────────────────────────────────
const VERT_SKIN = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUV;
layout(location = 3) in uvec4 aJoints;
layout(location = 4) in vec4 aWeights;
uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;
uniform mat4 uJoints[${MAX_JOINTS}];
uniform mat4 uLightVP;
out vec3 vWorld;
out vec3 vNormal;
out vec2 vUV;
out vec4 vLightPos;
void main() {
  mat4 skin = uJoints[aJoints.x] * aWeights.x
            + uJoints[aJoints.y] * aWeights.y
            + uJoints[aJoints.z] * aWeights.z
            + uJoints[aJoints.w] * aWeights.w;
  vec4 local = skin * vec4(aPos, 1.0);
  vec4 world = uModel * local;
  vWorld = world.xyz;
  vNormal = normalize(mat3(uModel) * mat3(skin) * aNormal);
  vUV = aUV;
  vLightPos = uLightVP * world;
  gl_Position = uProj * uView * world;
}`;

const VERT_INSTANCED = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUV;
layout(location = 5) in vec4 iM0;
layout(location = 6) in vec4 iM1;
layout(location = 7) in vec4 iM2;
layout(location = 8) in vec4 iM3;
layout(location = 9) in vec3 iTint;
uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uLightVP;
out vec3 vWorld;
out vec3 vNormal;
out vec2 vUV;
out vec4 vLightPos;
out vec3 vTint;
void main() {
  mat4 model = mat4(iM0, iM1, iM2, iM3);
  vec4 world = model * vec4(aPos, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(model) * aNormal);
  vUV = aUV;
  vTint = iTint;
  vLightPos = uLightVP * world;
  gl_Position = uProj * uView * world;
}`;

function pbrFragment(instanced) {
  return `#version 300 es
precision highp float;
in vec3 vWorld;
in vec3 vNormal;
in vec2 vUV;
in vec4 vLightPos;
${instanced ? 'in vec3 vTint;' : ''}
uniform vec3 uBaseColor;
uniform float uMetallic;
uniform float uRoughness;
uniform vec3 uEmissive;
${instanced ? '' : 'uniform vec3 uTint;'}
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform vec3 uAmbient;
uniform vec3 uCamPos;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
uniform sampler2D uShadow;
uniform float uShadowOn;
uniform sampler2D uDetail;
uniform float uDetailOn;
uniform float uDetailTiling;
out vec4 fragColor;

float shadowAt(vec4 lightPos, float ndl) {
  vec3 proj = lightPos.xyz / lightPos.w;
  proj = proj * 0.5 + 0.5;
  if (proj.x < 0.0 || proj.x > 1.0 || proj.y < 0.0 || proj.y > 1.0 || proj.z > 1.0) return 1.0;
  float bias = max(0.0016 * (1.0 - ndl), 0.0004);
  float sum = 0.0;
  vec2 texel = vec2(1.0 / 1024.0);
  for (int x = -1; x <= 1; x += 1) {
    for (int y = -1; y <= 1; y += 1) {
      float depth = texture(uShadow, proj.xy + vec2(float(x), float(y)) * texel).r;
      sum += proj.z - bias <= depth ? 1.0 : 0.0;
    }
  }
  return sum / 9.0;
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec3 base = uBaseColor;
  ${instanced ? 'base *= vTint;' : 'base *= uTint;'}
  float detail = 1.0;
  if (uDetailOn > 0.5) {
    detail = texture(uDetail, vUV * uDetailTiling).r;
    detail = 0.86 + detail * 0.28;
  }
  vec3 n = normalize(vNormal);
  vec3 l = normalize(-uLightDir);
  vec3 v = normalize(uCamPos - vWorld);
  vec3 h = normalize(l + v);
  float ndl = max(dot(n, l), 0.0);
  float ndv = max(dot(n, v), 0.0001);
  float ndh = max(dot(n, h), 0.0);
  float vdh = max(dot(v, h), 0.0);
  float rough = clamp(uRoughness, 0.04, 1.0) / max(detail, 0.2);
  float a2 = pow(rough, 4.0);
  float dd = ndh * ndh * (a2 - 1.0) + 1.0;
  float D = a2 / (3.14159 * dd * dd + 0.0001);
  float k = (rough + 1.0) * (rough + 1.0) / 8.0;
  float G = (ndl / (ndl * (1.0 - k) + k)) * (ndv / (ndv * (1.0 - k) + k));
  vec3 F0 = mix(vec3(0.04), base, uMetallic);
  vec3 F = F0 + (1.0 - F0) * pow(1.0 - vdh, 5.0);
  vec3 spec = D * G * F / (4.0 * ndv * ndl + 0.001);
  vec3 diffuse = base * (1.0 - uMetallic) / 3.14159;
  float shadow = uShadowOn > 0.5 ? shadowAt(vLightPos, ndl) : 1.0;
  vec3 color = (diffuse + spec) * uLightColor * ndl * shadow * 2.2;
  vec3 ambient = uAmbient * base * (0.5 + 0.5 * n.y) * detail;
  float rim = pow(1.0 - ndv, 3.0);
  color += ambient + uLightColor * rim * 0.12 * base + uEmissive;
  float dist = length(uCamPos - vWorld);
  float fog = clamp((dist - uFogNear) / max(uFogFar - uFogNear, 1.0), 0.0, 1.0);
  color = mix(color, uFogColor, fog * fog);
  fragColor = vec4(color, 1.0);
}`;
}

const FRAG_DEPTH = `#version 300 es
precision highp float;
void main() { }`;

const VERT_DEPTH_SKIN = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 3) in uvec4 aJoints;
layout(location = 4) in vec4 aWeights;
uniform mat4 uLightVP;
uniform mat4 uModel;
uniform mat4 uJoints[${MAX_JOINTS}];
void main() {
  mat4 skin = uJoints[aJoints.x] * aWeights.x
            + uJoints[aJoints.y] * aWeights.y
            + uJoints[aJoints.z] * aWeights.z
            + uJoints[aJoints.w] * aWeights.w;
  gl_Position = uLightVP * uModel * skin * vec4(aPos, 1.0);
}`;

const VERT_DEPTH_INST = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 5) in vec4 iM0;
layout(location = 6) in vec4 iM1;
layout(location = 7) in vec4 iM2;
layout(location = 8) in vec4 iM3;
uniform mat4 uLightVP;
void main() {
  gl_Position = uLightVP * mat4(iM0, iM1, iM2, iM3) * vec4(aPos, 1.0);
}`;

const VERT_FULLSCREEN = `#version 300 es
precision highp float;
out vec2 vUV;
void main() {
  vec2 verts[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  vec2 p = verts[gl_VertexID];
  vUV = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

const FRAG_SKY = `#version 300 es
precision highp float;
in vec2 vUV;
uniform vec3 uTop;
uniform vec3 uBottom;
uniform vec3 uHorizon;
uniform vec2 uSun;
uniform vec3 uSunColor;
uniform float uGlow;
out vec4 fragColor;
void main() {
  float t = clamp(vUV.y, 0.0, 1.0);
  vec3 color = mix(uBottom, uHorizon, smoothstep(0.0, 0.45, t));
  color = mix(color, uTop, smoothstep(0.4, 1.0, t));
  float d = distance(vUV * vec2(1.7, 1.0), uSun * vec2(1.7, 1.0));
  color += uSunColor * uGlow * exp(-d * 3.4) * 0.9;
  color += uSunColor * smoothstep(0.028, 0.0, d) * 1.4;
  fragColor = vec4(color, 1.0);
}`;

const FRAG_POST = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uScene;
uniform float uExposure;
uniform float uBrightness;
uniform float uContrast;
uniform float uGamma;
uniform float uSharpen;
uniform vec2 uTexel;
uniform vec3 uGrade;
uniform float uVignette;
out vec4 fragColor;
vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
void main() {
  vec3 color = texture(uScene, vUV).rgb;
  if (uSharpen > 0.001) {
    vec3 n = texture(uScene, vUV + vec2(0.0, uTexel.y)).rgb;
    vec3 s = texture(uScene, vUV - vec2(0.0, uTexel.y)).rgb;
    vec3 e = texture(uScene, vUV + vec2(uTexel.x, 0.0)).rgb;
    vec3 w = texture(uScene, vUV - vec2(uTexel.x, 0.0)).rgb;
    vec3 blur = (n + s + e + w) * 0.25;
    color += (color - blur) * uSharpen;
  }
  color *= uExposure;
  color = aces(color) * uGrade;
  color = (color - 0.5) * uContrast + 0.5;
  color *= uBrightness;
  color = pow(max(color, vec3(0.0)), vec3(1.0 / max(uGamma, 0.05)));
  float vig = smoothstep(1.15, 0.35, length(vUV - 0.5) * 1.35);
  color *= mix(1.0, vig, uVignette);
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

// ── GL helpers ────────────────────────────────────────────────────────────
function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`gfx3d shader: ${log}`);
  }
  return shader;
}

function createProgram(gl, vertexSource, fragmentSource, uniformNames) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`gfx3d link: ${log}`);
  }
  const uniforms = {};
  for (const name of uniformNames) uniforms[name] = gl.getUniformLocation(program, name);
  return { program, uniforms };
}

function noiseTexture(gl, size = 128) {
  const data = new Uint8Array(size * size * 4);
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const grain = 150 + rand() * 70;
      const speckle = rand() > 0.94 ? 60 : 0;
      const value = Math.max(0, Math.min(255, grain - speckle));
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
    }
  }
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return texture;
}

// ── rig / animation ───────────────────────────────────────────────────────
class Rig {
  constructor(asset) {
    this.asset = asset;
    this.nodes = asset.getNodes();
    this.parent = new Int16Array(this.nodes.length).fill(-1);
    for (const node of this.nodes) {
      for (const child of node.children) this.parent[child] = node.index;
    }
    // Topological order so parents are always resolved before children.
    this.order = [];
    const visit = (index) => {
      if (this.order.includes(index)) return;
      this.order.push(index);
      for (const child of this.nodes[index].children) visit(child);
    };
    this.nodes.forEach((node) => {
      if (this.parent[node.index] === -1) visit(node.index);
    });
    for (let i = 0; i < this.nodes.length; i += 1) {
      if (!this.order.includes(i)) this.order.push(i);
    }
    this.skin = asset.getSkin(0);
    this.jointCount = this.skin ? this.skin.jointCount : 0;
    this.ibm = this.skin ? this.skin.inverseBindMatrices : null;
    this.clips = new Map();
    for (const animation of asset.getAnimations()) {
      const channels = new Map();
      for (const channel of animation.channels) {
        if (!channels.has(channel.node)) channels.set(channel.node, {});
        channels.get(channel.node)[channel.path] = channel;
      }
      this.clips.set(animation.name, { duration: animation.duration, channels });
    }
    this.local = new Float32Array(this.nodes.length * 16);
    this.world = new Float32Array(this.nodes.length * 16);
    this.palette = new Float32Array(Math.max(this.jointCount, 1) * 16);
    this._jointMatrices = new Float32Array(this.jointCount * 16);
  }

  pose(clipName, time) {
    const clip = this.clips.get(clipName) || this.clips.get('Idle');
    const duration = clip?.duration || 1;
    const t = ((time % duration) + duration) % duration;
    for (const node of this.nodes) {
      const target = node.index * 16;
      let translation = node.translation;
      let rotation = node.rotation;
      let scale = node.scale;
      const channel = clip?.channels.get(node.index);
      if (channel) {
        if (channel.rotation) rotation = sample(channel.rotation, t);
        if (channel.translation) translation = sample(channel.translation, t);
        if (channel.scale) scale = sample(channel.scale, t);
      }
      const local = trs(translation, rotation, scale);
      this.local.set(local, target);
    }
    for (const index of this.order) {
      const parent = this.parent[index];
      const localView = this.local.subarray(index * 16, index * 16 + 16);
      const out = this.world.subarray(index * 16, index * 16 + 16);
      if (parent >= 0) {
        const parentView = this.world.subarray(parent * 16, parent * 16 + 16);
        mulInto(out, parentView, localView);
      } else {
        out.set(localView);
      }
    }
    if (this.skin) {
      for (let i = 0; i < this.jointCount; i += 1) {
        const nodeIndex = this.skin.joints[i];
        const world = this.world.subarray(nodeIndex * 16, nodeIndex * 16 + 16);
        const ibm = this.ibm.subarray(i * 16, i * 16 + 16);
        const out = this._jointMatrices.subarray(i * 16, i * 16 + 16);
        mulInto(out, world, ibm);
      }
      return this._jointMatrices;
    }
    return this._jointMatrices;
  }
}

function sample(channel, time) {
  const { times, values, path, valueComponents } = channel;
  if (!times.length) return path === 'rotation' ? [0, 0, 0, 1] : [0, 0, 0];
  const read = (index) => Array.from(values.slice(index * valueComponents, index * valueComponents + valueComponents));
  if (times.length === 1 || time <= times[0]) return read(0);
  const last = times.length - 1;
  if (time >= times[last]) return read(last);
  let i = 0;
  while (i < last && times[i + 1] < time) i += 1;
  const t0 = times[i];
  const t1 = times[i + 1] ?? t0 + 1e-4;
  const alpha = (time - t0) / Math.max(1e-6, t1 - t0);
  const a = read(i);
  const b = read(i + 1);
  if (path !== 'rotation') return a.map((value, index) => value + (b[index] - value) * alpha);
  // Normalized quaternion interpolation.
  let bx = b[0], by = b[1], bz = b[2], bw = b[3];
  let cos = a[0] * bx + a[1] * by + a[2] * bz + a[3] * bw;
  if (cos < 0) {
    cos = -cos;
    bx = -bx; by = -by; bz = -bz; bw = -bw;
  }
  if (cos > 0.9995) return [a[0] + (bx - a[0]) * alpha, a[1] + (by - a[1]) * alpha, a[2] + (bz - a[2]) * alpha, a[3] + (bw - a[3]) * alpha];
  const theta = Math.acos(Math.min(1, cos));
  const sinTheta = Math.sin(theta);
  const s0 = Math.sin((1 - alpha) * theta) / sinTheta;
  const s1 = Math.sin(alpha * theta) / sinTheta;
  return [a[0] * s0 + bx * s1, a[1] * s0 + by * s1, a[2] * s0 + bz * s1, a[3] * s0 + bw * s1];
}

// ── GPU model cache ───────────────────────────────────────────────────────
function uploadPrimitive(gl, primitive, skinned) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const attach = (loc, data, size, type = gl.FLOAT) => {
    if (!data) return;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, type, false, 0, 0);
  };
  attach(0, primitive.positions, 3);
  attach(1, primitive.normals, 3);
  attach(2, primitive.uvs, 2);
  if (skinned) {
    attach(3, primitive.joints, 4, gl.UNSIGNED_SHORT);
    attach(4, primitive.weights, 4);
  }
  let indexBuffer = null;
  let indexCount = 0;
  if (primitive.indices) {
    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, primitive.indices, gl.STATIC_DRAW);
    indexCount = primitive.indices.length;
  } else {
    indexCount = primitive.vertexCount;
  }
  gl.bindVertexArray(null);
  return { vao, indexBuffer, indexCount };
}

class Model {
  constructor(gl, asset, name) {
    this.gl = gl;
    this.asset = asset;
    this.name = name;
    this.materials = asset.getMaterials();
    this.rig = new Rig(asset);
    this.lods = asset.lodNodes().map((node) => ({
      lod: node.lod,
      primitives: asset.getMesh(node.mesh).primitives.map((primitive) => ({
        ...uploadPrimitive(gl, primitive, true),
        material: this.materials[primitive.material] || this.materials[0],
      })),
    }));
    this.collision = asset.collisionNodes().map((node) => asset.getMesh(node.mesh));
    this.triangles = this.lods[0]?.primitives.reduce((sum, primitive) => sum + primitive.indexCount / 3, 0) || 0;
  }

  pickLod(distance) {
    if (this.lods.length <= 1) return this.lods[0];
    if (distance < 190) return this.lods[0];
    if (distance < 420 || this.lods.length === 2) return this.lods[1] || this.lods[0];
    return this.lods[2] || this.lods[1];
  }
}

// Static prop with per-instance transform + tint attributes baked into its VAO.
class PropModel {
  constructor(gl, asset, node) {
    this.gl = gl;
    this.name = node.name;
    const materials = asset.getMaterials();
    const mesh = asset.getMesh(node.mesh);
    this.instanceBuffer = gl.createBuffer();
    this.primitives = mesh.primitives.map((primitive) => {
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      const attach = (loc, data, size) => {
        if (!data) return;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      };
      attach(0, primitive.positions, 3);
      attach(1, primitive.normals, 3);
      attach(2, primitive.uvs, 2);
      // Per-instance matrix (4 vec4) + tint, stride 20 floats.
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
      for (let i = 0; i < 4; i += 1) {
        gl.enableVertexAttribArray(5 + i);
        gl.vertexAttribPointer(5 + i, 4, gl.FLOAT, false, 80, i * 16);
        gl.vertexAttribDivisor(5 + i, 1);
      }
      gl.enableVertexAttribArray(9);
      gl.vertexAttribPointer(9, 3, gl.FLOAT, false, 80, 64);
      gl.vertexAttribDivisor(9, 1);
      let indexBuffer = null;
      let indexCount = primitive.vertexCount;
      if (primitive.indices) {
        indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, primitive.indices, gl.STATIC_DRAW);
        indexCount = primitive.indices.length;
      }
      gl.bindVertexArray(null);
      return { vao, indexBuffer, indexCount, material: materials[primitive.material] || materials[0] };
    });
    this.triangles = this.primitives.reduce((sum, primitive) => sum + primitive.indexCount / 3, 0);
  }
}

export const CHAR_ASSETS = [
  { key: 'sera', file: 'sera.glb' },
  { key: 'villager', file: 'villager.glb' },
  { key: 'prowler', file: 'prowler.glb' },
  { key: 'beetle', file: 'beetle.glb' },
  { key: 'stalker', file: 'stalker.glb' },
  { key: 'alpha', file: 'alpha.glb' },
  { key: 'yggvar', file: 'yggvar.glb' },
  // Update XXV — authored Scary Mode ghosts.
  { key: 'ghost_hollow_wraith', file: 'ghost_hollow_wraith.glb' },
  { key: 'ghost_night_stalker', file: 'ghost_night_stalker.glb' },
  { key: 'ghost_silent_knight', file: 'ghost_silent_knight.glb' },
  { key: 'ghost_forgotten_one', file: 'ghost_forgotten_one.glb' },
  { key: 'ghost_weeping_mother', file: 'ghost_weeping_mother.glb' },
  { key: 'ghost_mirror_double', file: 'ghost_mirror_double.glb' },
  { key: 'ghost_lantern_eater', file: 'ghost_lantern_eater.glb' },
  { key: 'ghost_drowned_bell', file: 'ghost_drowned_bell.glb' },
];

// ── renderer ──────────────────────────────────────────────────────────────
export class WebGL3D {
  constructor(options = {}) {
    this.canvas = options.canvas || (typeof document !== 'undefined' ? document.createElement('canvas') : null);
    this.gl = null;
    this.ready = false;
    this.loading = false;
    this.failedReason = null;
    this.models = {};
    this.props = {};
    this.stats = { drawCalls: 0, triangles: 0, skinned: 0, joints: 0, frameMs: 0, lodSwitches: 0 };
    this.options = {
      renderScale: 100,
      upscaler: 'native',
      hdr: 'auto',
      aa: 'high',
      shadowQuality: 'high',
      anisotropic: '8x',
      brightness: 100,
      contrast: 100,
      gamma: 100,
      dynamicResolution: false,
      viewDistance: 100,
      ...(options.settings || {}),
    };
    this.msaa = 0;
    this.hdrFormat = 'rgba8';
    this.aniso = 1;
    this.width = 0;
    this.height = 0;
    this.frameScale = 1;
  }

  get available() {
    return Boolean(this.gl) && this.ready;
  }

  init() {
    if (this.gl) return true;
    if (!this.canvas) return false;
    const attributes = {
      alpha: false,
      antialias: false,
      depth: true,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    };
    let gl = null;
    try {
      gl = this.canvas.getContext('webgl2', attributes);
    } catch {
      gl = null;
    }
    if (!gl) {
      this.failedReason = 'WebGL2 tidak tersedia';
      return false;
    }
    this.gl = gl;
    try {
      this.programs = {
        skin: createProgram(gl, VERT_SKIN, pbrFragment(false), [
          'uProj', 'uView', 'uModel', 'uJoints', 'uLightVP', 'uBaseColor', 'uMetallic', 'uRoughness',
          'uEmissive', 'uTint', 'uLightDir', 'uLightColor', 'uAmbient', 'uCamPos', 'uFogColor', 'uFogNear',
          'uFogFar', 'uShadow', 'uShadowOn', 'uDetail', 'uDetailOn', 'uDetailTiling',
        ]),
        instanced: createProgram(gl, VERT_INSTANCED, pbrFragment(true), [
          'uProj', 'uView', 'uLightVP', 'uBaseColor', 'uMetallic', 'uRoughness', 'uEmissive',
          'uTint', 'uLightDir', 'uLightColor', 'uAmbient', 'uCamPos', 'uFogColor', 'uFogNear', 'uFogFar',
          'uShadow', 'uShadowOn', 'uDetail', 'uDetailOn', 'uDetailTiling',
        ]),
        depthSkin: createProgram(gl, VERT_DEPTH_SKIN, FRAG_DEPTH, ['uLightVP', 'uModel', 'uJoints']),
        depthInst: createProgram(gl, VERT_DEPTH_INST, FRAG_DEPTH, ['uLightVP']),
        sky: createProgram(gl, VERT_FULLSCREEN, FRAG_SKY, ['uTop', 'uBottom', 'uHorizon', 'uSun', 'uSunColor', 'uGlow']),
        post: createProgram(gl, VERT_FULLSCREEN, FRAG_POST, [
          'uScene', 'uExposure', 'uBrightness', 'uContrast', 'uGamma', 'uSharpen', 'uTexel', 'uGrade', 'uVignette',
        ]),
      };
    } catch (error) {
      this.failedReason = String(error.message || error);
      this.gl = null;
      return false;
    }
    this.emptyVao = gl.createVertexArray();
    this.detailTexture = noiseTexture(gl);
    this.caps = {
      colorBufferFloat: Boolean(gl.getExtension('EXT_color_buffer_float')),
      aniso: gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBGL_EXT_texture_filter_anisotropic'),
      maxSamples: gl.getParameter(gl.MAX_SAMPLES) || 0,
    };
    this.aniso = this.caps.aniso ? gl.getParameter(this.caps.aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1;
    this.canvas.addEventListener?.('webglcontextlost', (event) => {
      event.preventDefault();
      this.ready = false;
    });
    this.canvas.addEventListener?.('webglcontextrestored', () => {
      this.gl = null;
      this.init();
    });
    this.createTargets();
    // Unit ground plane (y = 0) generated on the GPU.
    this.ground = this.createGround();
    return true;
  }

  configure(options = {}) {
    const previousAniso = this.options.anisotropic;
    Object.assign(this.options, options);
    if (this.gl && previousAniso !== this.options.anisotropic) this.applyAnisotropy();
    this.allocateTargets(true);
  }

  applyAnisotropy() {
    if (!this.gl || !this.caps?.aniso) return;
    const requested = parseInt(String(this.options.anisotropic || '8x'), 10) || 1;
    const value = Math.max(1, Math.min(this.aniso, requested));
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.detailTexture);
    gl.texParameterf(gl.TEXTURE_2D, this.caps.aniso.TEXTURE_MAX_ANISOTROPY_EXT, value);
    this.appliedAniso = value;
  }

  createGround() {
    const gl = this.gl;
    const size = 1400;
    const positions = new Float32Array([
      -size, 0, -size, size, 0, -size, size, 0, size,
      -size, 0, -size, size, 0, size, -size, 0, size,
    ]);
    const normals = new Float32Array(18);
    for (let i = 0; i < 6; i += 1) normals[i * 3 + 1] = 1;
    const uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const attach = (loc, data, comps) => {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, comps, gl.FLOAT, false, 0, 0);
    };
    attach(0, positions, 3);
    attach(1, normals, 3);
    attach(2, uvs, 2);
    const instanceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    const identityInstance = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0]);
    gl.bufferData(gl.ARRAY_BUFFER, identityInstance, gl.STATIC_DRAW);
    for (let i = 0; i < 4; i += 1) {
      gl.enableVertexAttribArray(5 + i);
      gl.vertexAttribPointer(5 + i, 4, gl.FLOAT, false, 80, i * 16);
      gl.vertexAttribDivisor(5 + i, 1);
    }
    gl.enableVertexAttribArray(9);
    gl.vertexAttribPointer(9, 3, gl.FLOAT, false, 80, 64);
    gl.vertexAttribDivisor(9, 1);
    gl.bindVertexArray(null);
    return { vao, count: 6, instanceBuffer };
  }

  createTargets() {
    const gl = this.gl;
    this.shadow = { texture: gl.createTexture(), framebuffer: gl.createFramebuffer(), size: 1024 };
    gl.bindTexture(gl.TEXTURE_2D, this.shadow.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, this.shadow.size, this.shadow.size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadow.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.shadow.texture, 0);
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.hdr = { texture: gl.createTexture(), framebuffer: gl.createFramebuffer(), depth: gl.createRenderbuffer() };
    this.msaaTarget = null;
  }

  allocateTargets(force = false) {
    if (!this.gl) return;
    const gl = this.gl;
    const scale = Math.max(0.35, Math.min(2, (Number(this.options.renderScale) || 100) / 100)) * this.frameScale;
    const width = Math.max(160, Math.round((this.canvas.width || 960) * scale));
    const height = Math.max(90, Math.round((this.canvas.height || 540) * scale));
    if (!force && width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;

    const useHdr = this.options.hdr !== 'off' && this.caps.colorBufferFloat;
    this.hdrFormat = useHdr ? 'rgba16f' : 'rgba8';
    const internalFormat = useHdr ? gl.RGBA16F : gl.RGBA8;
    const type = useHdr ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;

    gl.bindTexture(gl.TEXTURE_2D, this.hdr.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, gl.RGBA, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindRenderbuffer(gl.RENDERBUFFER, this.hdr.depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, width, height);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.hdr.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.hdr.texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.hdr.depth);
    this.hdrComplete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Optional 4× MSAA resolve target.
    const wantsMsaa = this.options.aa !== 'off' && this.caps.maxSamples >= 4;
    if (wantsMsaa) {
      this.msaa = Math.min(4, this.caps.maxSamples);
      if (!this.msaaTarget) {
        this.msaaTarget = {
          framebuffer: gl.createFramebuffer(),
          color: gl.createRenderbuffer(),
          depth: gl.createRenderbuffer(),
        };
      }
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.msaaTarget.color);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.msaa, internalFormat, width, height);
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.msaaTarget.depth);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.msaa, gl.DEPTH_COMPONENT24, width, height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.msaaTarget.framebuffer);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, this.msaaTarget.color);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.msaaTarget.depth);
      this.msaaComplete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      if (!this.msaaComplete) this.msaa = 0;
    } else {
      this.msaa = 0;
    }
    this.applyAnisotropy();
  }

  async load(baseUrl = 'assets/3d/', onProgress = null) {
    if (this.ready || this.loading) return this.ready;
    if (!this.init()) return false;
    this.loading = true;
    try {
      const fetchBuffer = async (file) => {
        const response = await fetch(`${baseUrl}${file}`, { cache: 'no-cache' });
        if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
        return response.arrayBuffer();
      };
      let done = 0;
      const total = CHAR_ASSETS.length + 1;
      for (const entry of CHAR_ASSETS) {
        const buffer = await fetchBuffer(entry.file);
        this.models[entry.key] = new Model(this.gl, parseGLB(buffer), entry.key);
        done += 1;
        onProgress?.(done / total, entry.key);
      }
      const propsBuffer = await fetchBuffer('props.glb');
      const propsAsset = parseGLB(propsBuffer);
      for (const node of propsAsset.getNodes()) {
        this.props[node.name] = new PropModel(this.gl, propsAsset, node);
      }
      this.propsAsset = propsAsset;
      done += 1;
      onProgress?.(done / total, 'props');
      this.rigCount = Object.values(this.models).reduce((sum, model) => sum + model.rig.jointCount, 0);
      this.ready = true;
      return true;
    } catch (error) {
      this.failedReason = String(error.message || error);
      return false;
    } finally {
      this.loading = false;
    }
  }

  // ── frame ───────────────────────────────────────────────────────────────
  render(ctx2d, game, frameOptions = {}) {
    if (!this.available || !ctx2d) return false;
    const started = performance.now();
    const gl = this.gl;
    const targetWidth = ctx2d.canvas.width;
    const targetHeight = ctx2d.canvas.height;
    if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;
      this.allocateTargets(true);
    } else if (this.width === 0) {
      this.allocateTargets(true);
    }
    const region = frameOptions.region || {};
    const camera = game.camera;
    const viewW = game.viewW || targetWidth;
    const viewH = game.viewH || targetHeight;
    const fovY = 2 * Math.atan((viewH / 2) / (camera.fov || 460));
    const aspect = targetWidth / Math.max(1, targetHeight);
    const near = 4;
    const far = 1800;
    const proj = mat4Perspective(fovY, aspect, near, far);
    const eye = [camera.x, camera.y, camera.z];
    const target = [camera.targetX, camera.targetY, camera.targetZ];
    const view = mat4LookAt(eye, target, [0, 1, 0]);

    const sunAzimuth = ((region.sun?.[0] ?? 0.5) - 0.5) * 2.4;
    const lightDir = normalizeVec([Math.sin(sunAzimuth) * 0.75, -0.82, -Math.cos(sunAzimuth) * 0.75]);
    const lightColor = parseColor(region.sunColor || '#ffe6b0').slice(0, 3).map((c) => c * 1.15);
    const ambient = parseColor(region.ground || '#4a4a3a').slice(0, 3).map((c) => c * 0.55 + 0.05);
    const fogColor = parseColor(region.fog || 'rgba(180,190,180,0.18)', [0.6, 0.65, 0.6, 1]).slice(0, 3);
    const fogNear = 260 * (Number(this.options.viewDistance) || 100) / 100;
    const fogFar = 1500 * (Number(this.options.viewDistance) || 100) / 100;

    const focus = [game.player.x, 1.4, game.player.z];
    const lightView = mat4LookAt(
      [focus[0] + lightDir[0] * 600, focus[1] + lightDir[1] * 600, focus[2] + lightDir[2] * 600],
      focus,
      [0, 1, 0],
    );
    const lightProj = ortho(-260, 260, -260, 260, 1, 1400);
    const lightVP = mat4Multiply(lightProj, lightView);

    const draws = this.collectDraws(game, camera);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.disable(gl.BLEND);

    // Pass 1 — shadow map.
    const shadowsOn = this.options.shadowQuality !== 'off';
    this.stats.drawCalls = 0;
    this.stats.triangles = 0;
    this.stats.skinned = 0;
    this.stats.joints = 0;
    this.stats.lodSwitches = 0;
    if (shadowsOn) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadow.framebuffer);
      gl.viewport(0, 0, this.shadow.size, this.shadow.size);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.colorMask(false, false, false, false);
      this.drawShadowPass(draws, lightVP);
      gl.colorMask(true, true, true, true);
    }

    // Pass 2 — HDR scene.
    const msaa = this.msaa;
    gl.bindFramebuffer(gl.FRAMEBUFFER, msaa ? this.msaaTarget.framebuffer : this.hdr.framebuffer);
    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(0.05, 0.06, 0.07, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Sky
    const sky = this.programs.sky;
    gl.useProgram(sky.program);
    gl.depthMask(false);
    gl.disable(gl.DEPTH_TEST);
    gl.bindVertexArray(this.emptyVao);
    const stops = region.sky || [[0, '#0a1014'], [0.5, '#22303a'], [1, '#5a6a62']];
    gl.uniform3fv(sky.uniforms.uBottom, parseColor(stops[0][1]).slice(0, 3));
    gl.uniform3fv(sky.uniforms.uHorizon, parseColor(stops[Math.min(1, stops.length - 1)][1]).slice(0, 3));
    gl.uniform3fv(sky.uniforms.uTop, parseColor(stops[stops.length - 1][1]).slice(0, 3));
    gl.uniform2fv(sky.uniforms.uSun, region.sun || [0.7, 0.2]);
    gl.uniform3fv(sky.uniforms.uSunColor, parseColor(region.sunColor || '#ffe6b0').slice(0, 3));
    gl.uniform1f(sky.uniforms.uGlow, 0.55);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.stats.drawCalls += 1;
    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);

    // Ground
    const inst = this.programs.instanced;
    gl.useProgram(inst.program);
    this.setCommon(inst.uniforms, { proj, view, lightVP, lightDir, lightColor, ambient, eye, fogColor, fogNear, fogFar, shadowsOn });
    gl.bindVertexArray(this.ground.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.detailTexture);
    gl.uniform1i(inst.uniforms.uDetail, 0);
    gl.uniform1f(inst.uniforms.uDetailOn, 1);
    gl.uniform1f(inst.uniforms.uDetailTiling, 120);
    gl.uniform3fv(inst.uniforms.uBaseColor, parseColor(region.ground || '#3f4430').slice(0, 3));
    gl.uniform1f(inst.uniforms.uMetallic, 0);
    gl.uniform1f(inst.uniforms.uRoughness, 0.97);
    gl.uniform3fv(inst.uniforms.uEmissive, [0, 0, 0]);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 1);
    this.stats.drawCalls += 1;
    this.stats.triangles += 2;

    // Props (instanced)
    this.drawInstancedProps(draws.props, { proj, view, lightVP, lightDir, lightColor, ambient, eye, fogColor, fogNear, fogFar, shadowsOn });

    // Skinned characters
    const skinProgram = this.programs.skin;
    gl.useProgram(skinProgram.program);
    this.setCommon(skinProgram.uniforms, { proj, view, lightVP, lightDir, lightColor, ambient, eye, fogColor, fogNear, fogFar, shadowsOn });
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.detailTexture);
    gl.uniform1i(skinProgram.uniforms.uDetail, 0);
    gl.uniform1f(skinProgram.uniforms.uDetailOn, 0.0);
    gl.uniform1f(skinProgram.uniforms.uDetailTiling, 8);
    for (const draw of draws.characters) {
      const model = this.models[draw.model];
      if (!model) continue;
      const lod = model.pickLod(draw.distance);
      if (lod !== model.lods[0]) this.stats.lodSwitches += 1;
      const palette = model.rig.pose(draw.clip, draw.time);
      gl.uniformMatrix4fv(skinProgram.uniforms.uJoints, false, palette);
      gl.uniformMatrix4fv(skinProgram.uniforms.uModel, false, draw.matrix);
      this.stats.joints += model.rig.jointCount;
      gl.uniform3fv(skinProgram.uniforms.uTint, draw.tint);
      for (const primitive of lod.primitives) {
        const material = primitive.material;
        gl.uniform1f(skinProgram.uniforms.uShadowOn, shadowsOn ? 1 : 0);
        gl.uniform3fv(skinProgram.uniforms.uBaseColor, material.baseColor.slice(0, 3));
        gl.uniform1f(skinProgram.uniforms.uMetallic, material.metallic);
        gl.uniform1f(skinProgram.uniforms.uRoughness, material.roughness);
        gl.uniform3fv(skinProgram.uniforms.uEmissive, material.emissive);
        gl.bindVertexArray(primitive.vao);
        if (primitive.indexBuffer) {
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, primitive.indexBuffer);
          gl.drawElements(gl.TRIANGLES, primitive.indexCount, gl.UNSIGNED_SHORT, 0);
        } else {
          gl.drawArrays(gl.TRIANGLES, 0, primitive.indexCount);
        }
        this.stats.drawCalls += 1;
        this.stats.triangles += primitive.indexCount / 3;
        this.stats.skinned += 1;
      }
    }
    gl.bindVertexArray(null);

    // Pass 3 — resolve, tonemap, upscale.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, targetWidth, targetHeight);
    gl.disable(gl.DEPTH_TEST);
    if (msaa && this.msaaComplete) {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.msaaTarget.framebuffer);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.hdr.framebuffer);
      gl.blitFramebuffer(0, 0, this.width, this.height, 0, 0, this.width, this.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    }
    const post = this.programs.post;
    gl.useProgram(post.program);
    gl.bindVertexArray(this.emptyVao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.hdr.texture);
    gl.uniform1i(post.uniforms.uScene, 0);
    const brightness = (Number(this.options.brightness) || 100) / 100;
    const contrast = (Number(this.options.contrast) || 100) / 100;
    const gamma = (Number(this.options.gamma) || 100) / 100;
    gl.uniform1f(post.uniforms.uExposure, this.options.hdr === 'off' ? 1.0 : 1.05);
    gl.uniform1f(post.uniforms.uBrightness, brightness);
    gl.uniform1f(post.uniforms.uContrast, contrast);
    gl.uniform1f(post.uniforms.uGamma, Math.max(0.35, gamma));
    const upscaler = this.options.upscaler || 'native';
    gl.uniform1f(post.uniforms.uSharpen, upscaler === 'fsr' ? 0.55 : upscaler === 'nis' ? 0.38 : upscaler === 'bilinear' ? 0 : 0.08);
    gl.uniform2f(post.uniforms.uTexel, 1 / this.width, 1 / this.height);
    gl.uniform3fv(post.uniforms.uGrade, [1, 1, 1]);
    gl.uniform1f(post.uniforms.uVignette, 0.35);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.stats.drawCalls += 1;
    gl.bindVertexArray(null);
    gl.enable(gl.DEPTH_TEST);

    ctx2d.drawImage(this.canvas, 0, 0, targetWidth, targetHeight);
    const frameMs = performance.now() - started;
    this.stats.frameMs = frameMs;
    this.lastHdr = this.hdrFormat;
    this.lastUpscaler = upscaler;
    // Dynamic resolution keeps frame time inside a 16.6 ms budget.
    if (this.options.dynamicResolution) {
      if (frameMs > 20 && this.frameScale > 0.55) {
        this.frameScale = Math.max(0.55, this.frameScale - 0.06);
        this.allocateTargets(true);
      } else if (frameMs < 11 && this.frameScale < 1) {
        this.frameScale = Math.min(1, this.frameScale + 0.03);
        this.allocateTargets(true);
      }
    }
    return true;
  }

  setCommon(uniforms, state) {
    const gl = this.gl;
    gl.uniformMatrix4fv(uniforms.uProj, false, state.proj);
    gl.uniformMatrix4fv(uniforms.uView, false, state.view);
    gl.uniformMatrix4fv(uniforms.uLightVP, false, state.lightVP);
    gl.uniform3fv(uniforms.uLightDir, state.lightDir);
    gl.uniform3fv(uniforms.uLightColor, state.lightColor);
    gl.uniform3fv(uniforms.uAmbient, state.ambient);
    gl.uniform3fv(uniforms.uCamPos, state.eye);
    gl.uniform3fv(uniforms.uFogColor, state.fogColor);
    gl.uniform1f(uniforms.uFogNear, state.fogNear);
    gl.uniform1f(uniforms.uFogFar, state.fogFar);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.shadow.texture);
    gl.uniform1i(uniforms.uShadow, 1);
    gl.uniform1f(uniforms.uShadowOn, state.shadowsOn ? 1 : 0);
  }

  collectDraws(game, camera) {
    const characters = [];
    const props = [];
    const yawTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
    const push = (model, entity, { scale, tint, clip, time, ySpeed }) => {
      const distance = Math.hypot(entity.x - camera.x, entity.y - camera.y, entity.z - camera.z);
      const matrix = mat4Multiply(
        translate(entity.x, entity.y, entity.z),
        mat4Multiply(rotateY(entity.facing ?? 0), scaleMatrix(scale)),
      );
      characters.push({ model, matrix, tint, clip, time, distance, ySpeed });
    };

    const player = game.player;
    const playerSpeed = Math.hypot(player.vx, player.vz);
    const playerClip = player.attackState && player.attackState !== 'idle'
      ? 'Attack'
      : playerSpeed > 8 ? 'Walk' : 'Idle';
    if (!game.firstPerson) {
      push('sera', { ...player, facing: player.yaw }, {
        scale: 28,
        tint: [1, 1, 1],
        clip: playerClip,
        time: game.clock3D || 0,
      });
    }

    for (const npc of game.npcs || []) {
      push('villager', { ...npc, facing: yawTo(npc, player) }, {
        scale: 26,
        tint: npc.id === 'shaman_lyra' ? [0.85, 1.05, 0.85] : npc.id === 'scout_rian' ? [1.05, 0.95, 0.8] : [1, 1, 1],
        clip: 'Idle',
        time: (game.clock3D || 0) * 0.8 + npc.x * 0.01,
      });
    }

    for (const enemy of game.enemies || []) {
      if (enemy.hp <= 0) continue;
      // Horror entities and named 3D enemies declare their own authored model;
      // fall back to the archetype mapping when it is absent or unloaded.
      const requested = enemy.model
        || (enemy.type === 'spore_beetle' ? 'beetle' : enemy.type === 'bramble_stalker' ? 'stalker' : 'prowler');
      const model = this.models[requested] ? requested : 'prowler';
      push(model, { ...enemy, facing: yawTo(enemy, player) }, {
        scale: model === 'beetle' ? 24 : model === 'stalker' ? 26 : 26,
        tint: enemy.tint || [1, 1, 1],
        clip: enemy.state === 'chase' ? 'Walk' : 'Idle',
        time: (game.clock3D || 0) * 1.15 + enemy.x * 0.02,
      });
    }

    if (game.elite && game.elite.hp > 0) {
      push('alpha', { ...game.elite, facing: yawTo(game.elite, player) }, {
        scale: 34,
        tint: [1.12, 0.92, 0.82],
        clip: game.elite.state === 'chase' ? 'Walk' : 'Idle',
        time: (game.clock3D || 0) * 1.05,
      });
    }

    if (game.boss && game.boss.hp > 0) {
      push('yggvar', { ...game.boss, facing: yawTo(game.boss, player) }, {
        scale: 22,
        tint: [1, 1, 1],
        clip: game.boss.state === 'active' ? 'Walk' : 'Idle',
        time: (game.clock3D || 0) * 0.55,
      });
    }

    for (const [index, item] of (game.scenery || []).entries()) {
      if (item.collected) continue;
      const name = propNameFor(item.type);
      if (!name || !this.props[name]) continue;
      const scale = propScaleFor(item.type, item);
      const spin = (index % 7) * 0.9;
      props.push({
        name,
        matrix: mat4Multiply(
          translate(item.x, item.y || 0, item.z),
          mat4Multiply(rotateY(spin), scaleMatrix(scale)),
        ),
        tint: item.type === 'bonfire' ? [1.4, 0.85, 0.5] : [1, 1, 1],
      });
    }

    characters.sort((a, b) => b.distance - a.distance);
    return { characters, props };
  }

  drawShadowPass(draws, lightVP) {
    const gl = this.gl;
    const depthSkin = this.programs.depthSkin;
    gl.useProgram(depthSkin.program);
    gl.uniformMatrix4fv(depthSkin.uniforms.uLightVP, false, lightVP);
    for (const draw of draws.characters) {
      const model = this.models[draw.model];
      if (!model) continue;
      const lod = model.pickLod(draw.distance);
      const palette = model.rig.pose(draw.clip, draw.time);
      gl.uniformMatrix4fv(depthSkin.uniforms.uJoints, false, palette);
      gl.uniformMatrix4fv(depthSkin.uniforms.uModel, false, draw.matrix);
      for (const primitive of lod.primitives) {
        gl.bindVertexArray(primitive.vao);
        if (primitive.indexBuffer) {
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, primitive.indexBuffer);
          gl.drawElements(gl.TRIANGLES, primitive.indexCount, gl.UNSIGNED_SHORT, 0);
        } else {
          gl.drawArrays(gl.TRIANGLES, 0, primitive.indexCount);
        }
        this.stats.drawCalls += 1;
      }
    }
    const depthInst = this.programs.depthInst;
    gl.useProgram(depthInst.program);
    gl.uniformMatrix4fv(depthInst.uniforms.uLightVP, false, lightVP);
    for (const [name, group] of this.groupByProp(draws.props)) {
      const prop = this.props[name];
      if (!prop) continue;
      gl.bindBuffer(gl.ARRAY_BUFFER, prop.instanceBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.packInstances(group), gl.DYNAMIC_DRAW);
      for (const primitive of prop.primitives) {
        gl.bindVertexArray(primitive.vao);
        if (primitive.indexBuffer) {
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, primitive.indexBuffer);
          gl.drawElementsInstanced(gl.TRIANGLES, primitive.indexCount, gl.UNSIGNED_SHORT, 0, group.length);
        } else {
          gl.drawArraysInstanced(gl.TRIANGLES, 0, primitive.indexCount, group.length);
        }
        this.stats.drawCalls += 1;
      }
    }
    gl.bindVertexArray(null);
  }

  groupByProp(instances) {
    const grouped = new Map();
    for (const instance of instances) {
      if (!grouped.has(instance.name)) grouped.set(instance.name, []);
      grouped.get(instance.name).push(instance);
    }
    return grouped;
  }

  packInstances(instances) {
    const data = new Float32Array(instances.length * 20);
    instances.forEach((instance, i) => {
      data.set(instance.matrix, i * 20);
      data.set([instance.tint[0], instance.tint[1], instance.tint[2], 1], i * 20 + 16);
    });
    return data;
  }

  drawInstancedProps(instances, state) {
    if (!instances.length) return;
    const gl = this.gl;
    const program = this.programs.instanced;
    gl.useProgram(program.program);
    this.setCommon(program.uniforms, state);
    gl.uniform1f(program.uniforms.uDetailOn, 1);
    gl.uniform1f(program.uniforms.uDetailTiling, 6);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.detailTexture);
    gl.uniform1i(program.uniforms.uDetail, 0);
    for (const [name, group] of this.groupByProp(instances)) {
      const prop = this.props[name];
      if (!prop) continue;
      gl.bindBuffer(gl.ARRAY_BUFFER, prop.instanceBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.packInstances(group), gl.DYNAMIC_DRAW);
      for (const primitive of prop.primitives) {
        gl.bindVertexArray(primitive.vao);
        const material = primitive.material;
        gl.uniform3fv(program.uniforms.uBaseColor, material.baseColor.slice(0, 3));
        gl.uniform1f(program.uniforms.uMetallic, material.metallic);
        gl.uniform1f(program.uniforms.uRoughness, material.roughness);
        gl.uniform3fv(program.uniforms.uEmissive, material.emissive);
        gl.uniform1f(program.uniforms.uShadowOn, state.shadowsOn ? 1 : 0);
        if (primitive.indexBuffer) {
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, primitive.indexBuffer);
          gl.drawElementsInstanced(gl.TRIANGLES, primitive.indexCount, gl.UNSIGNED_SHORT, 0, group.length);
        } else {
          gl.drawArraysInstanced(gl.TRIANGLES, 0, primitive.indexCount, group.length);
        }
        this.stats.drawCalls += 1;
        this.stats.triangles += (primitive.indexCount / 3) * group.length;
      }
    }
    gl.bindVertexArray(null);
  }
}

function translate(x, y, z) {
  const out = identity();
  out[12] = x;
  out[13] = y;
  out[14] = z;
  return out;
}

function rotateY(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const out = identity();
  out[0] = c;
  out[2] = -s;
  out[8] = s;
  out[10] = c;
  return out;
}

function scaleMatrix(value) {
  const out = identity();
  out[0] = value;
  out[5] = value;
  out[10] = value;
  return out;
}

function normalizeVec(v) {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

export function propNameFor(type) {
  switch (type) {
    case 'worldtree': return 'worldtree';
    case 'hut': return 'hut';
    case 'ruin': return 'ruin';
    case 'totem': return 'totem';
    case 'crystal': return 'crystal';
    case 'rock': return 'rock';
    case 'platform': return 'bridge';
    case 'bonfire': return 'totem';
    case 'manor': return 'horror_manor';
    case 'asylum': return 'horror_asylum';
    case 'chapel': return 'horror_chapel';
    case 'mill': return 'horror_mill';
    case 'lighthouse': return 'horror_lighthouse';
    case 'echo_rune': return 'crystal';
    case 'exitgate': return 'ruin';
    // Update XXV — architecture and landmarks for the other modes.
    case 'cistern_arch': return 'cistern_arch';
    case 'cistern_pillar': return 'cistern_pillar';
    case 'lantern_pyre': return 'lantern_pyre';
    case 'lantern_brazier': return 'lantern_brazier';
    case 'pirate_wreck': return 'pirate_wreck';
    case 'pirate_dock': return 'pirate_dock';
    case 'veil_shrine': return 'veil_shrine';
    case 'dread_altar': return 'dread_altar';
    case 'wd_bastion': return 'wd_bastion';
    default: return null;
  }
}

export function propScaleFor(type, item) {
  switch (type) {
    case 'worldtree': return Math.max(6, (item.height || 240) / 9);
    case 'hut': return Math.max(8, (item.radius || 34) / 2);
    case 'ruin': return Math.max(3, (item.scale || 1) * 5);
    case 'totem': return Math.max(6, (item.height || 70) / 3.6);
    case 'crystal': return Math.max(4, (item.scale || 1) * 12);
    case 'platform': return Math.max(3, (item.w || 80) / 2.6);
    case 'rock': return Math.max(3, (item.scale || 1) * 6);
    case 'manor':
    case 'asylum':
    case 'chapel':
    case 'mill':
    case 'lighthouse': return Math.max(8, item.scale || 24);
    case 'echo_rune': return Math.max(1.4, item.scale || 2.2);
    case 'exitgate': return Math.max(8, (item.scale || 1.6) * 9);
    case 'cistern_arch': return Math.max(6, item.scale || 9);
    case 'cistern_pillar': return Math.max(4, item.scale || 7);
    case 'lantern_pyre': return Math.max(4, item.scale || 6);
    case 'lantern_brazier': return Math.max(3, item.scale || 4.5);
    case 'pirate_wreck': return Math.max(4, item.scale || 6);
    case 'pirate_dock': return Math.max(4, item.scale || 7);
    case 'veil_shrine': return Math.max(3, item.scale || 5);
    case 'dread_altar': return Math.max(3, item.scale || 4.5);
    case 'wd_bastion': return Math.max(5, item.scale || 7);
    default: return 6;
  }
}
