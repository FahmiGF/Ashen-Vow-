// Ashen Vow — glTF 2.0 / GLB binary parser.
// Pure ES module: no DOM, no WebGL, no Node APIs. It reads the binary container
// produced by tools/export-glb.mjs and exposes typed-array accessors, skins,
// skeletal animations and PBR material parameters to the renderer (and tests).

const MAGIC_GLB = 0x46546c67; // 'glTF'
const CHUNK_JSON = 0x4e4f534a; // 'JSON'
const CHUNK_BIN = 0x004e4942; // 'BIN\0'

const COMPONENT_TYPES = {
  5120: { Ctor: Int8Array, size: 1, read: (dv, o) => dv.getInt8(o) },
  5121: { Ctor: Uint8Array, size: 1, read: (dv, o) => dv.getUint8(o) },
  5122: { Ctor: Int16Array, size: 2, read: (dv, o) => dv.getInt16(o, true) },
  5123: { Ctor: Uint16Array, size: 2, read: (dv, o) => dv.getUint16(o, true) },
  5125: { Ctor: Uint32Array, size: 4, read: (dv, o) => dv.getUint32(o, true) },
  5126: { Ctor: Float32Array, size: 4, read: (dv, o) => dv.getFloat32(o, true) },
};

const TYPE_COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };

export const GLB_TARGETS = { ARRAY_BUFFER: 34962, ELEMENT_ARRAY_BUFFER: 34963 };

export function isGLB(buffer) {
  if (!buffer || buffer.byteLength < 12) return false;
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return dv.getUint32(0, true) === MAGIC_GLB;
}

// Splits the GLB container into its JSON document and binary chunk.
export function readGLBChunks(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (dv.getUint32(0, true) !== MAGIC_GLB) throw new Error('glb: bad magic');
  const version = dv.getUint32(4, true);
  if (version !== 2) throw new Error(`glb: unsupported version ${version}`);
  const declared = dv.getUint32(8, true);
  const limit = Math.min(declared || bytes.byteLength, bytes.byteLength);
  let offset = 12;
  let json = null;
  let bin = null;
  let binOffset = 0;
  while (offset + 8 <= limit) {
    const chunkLength = dv.getUint32(offset, true);
    const chunkType = dv.getUint32(offset + 4, true);
    const start = offset + 8;
    if (chunkType === CHUNK_JSON) {
      json = JSON.parse(new TextDecoder().decode(bytes.subarray(start, start + chunkLength)));
    } else if (chunkType === CHUNK_BIN) {
      bin = bytes.subarray(start, start + chunkLength);
      binOffset = start;
    }
    offset = start + chunkLength + ((4 - (chunkLength % 4)) % 4);
  }
  if (!json) throw new Error('glb: missing JSON chunk');
  return { json, json2: null, bin, binOffset, bytes, version, declared };
}

export class GLTFAsset {
  constructor(input) {
    if (input && input.json) {
      // Already-decoded chunks (used by tests to avoid re-reading the container).
      Object.assign(this, input);
    } else {
      Object.assign(this, readGLBChunks(input));
    }
    this.dataView = new DataView(this.bytes.buffer, this.bytes.byteOffset, this.bytes.byteLength);
    this._accessors = new Map();
  }

  get json2_() {
    return this.json;
  }

  // ── Accessors ───────────────────────────────────────────────────────────
  readAccessor(index) {
    if (this._accessors.has(index)) return this._accessors.get(index);
    const accessor = this.json.accessors?.[index];
    if (!accessor) throw new Error(`glb: accessor ${index} missing`);
    const spec = COMPONENT_TYPES[accessor.componentType];
    if (!spec) throw new Error(`glb: bad componentType ${accessor.componentType}`);
    const components = TYPE_COMPONENTS[accessor.type];
    if (!components) throw new Error(`glb: bad type ${accessor.type}`);
    const count = accessor.count;
    const data = new spec.Ctor(count * components);
    if (accessor.bufferView !== undefined && this.bin) {
      const view = this.json.bufferViews[accessor.bufferView];
      const base = this.binOffset + (view.byteOffset || 0) + (accessor.byteOffset || 0);
      const stride = view.byteStride || components * spec.size;
      for (let i = 0; i < count; i += 1) {
        const row = base + i * stride;
        for (let c = 0; c < components; c += 1) {
          data[i * components + c] = spec.read(this.dataView, row + c * spec.size);
        }
      }
    }
    const result = {
      data,
      count,
      components,
      type: accessor.type,
      componentType: accessor.componentType,
      min: accessor.min || null,
      max: accessor.max || null,
      normalized: Boolean(accessor.normalized),
    };
    this._accessors.set(index, result);
    return result;
  }

  // ── Meshes ──────────────────────────────────────────────────────────────
  meshCount() {
    return this.json.meshes?.length || 0;
  }

  getMesh(index) {
    const mesh = this.json.meshes?.[index];
    if (!mesh) return null;
    return {
      name: mesh.name || `mesh_${index}`,
      primitives: (mesh.primitives || []).map((primitive, i) => {
        const attributes = primitive.attributes || {};
        const read = (key) => (attributes[key] !== undefined ? this.readAccessor(attributes[key]).data : null);
        return {
          index: i,
          positions: read('POSITION'),
          normals: read('NORMAL'),
          uvs: read('TEXCOORD_0'),
          joints: read('JOINTS_0'),
          weights: read('WEIGHTS_0'),
          colors: read('COLOR_0'),
          indices: primitive.indices !== undefined ? this.readAccessor(primitive.indices).data : null,
          material: primitive.material ?? -1,
          mode: primitive.mode ?? 4,
          vertexCount: attributes.POSITION !== undefined ? this.readAccessor(attributes.POSITION).count : 0,
        };
      }),
    };
  }

  // ── Materials ───────────────────────────────────────────────────────────
  getMaterials() {
    return (this.json.materials || []).map((material) => {
      const pbr = material.pbrMetallicRoughness || {};
      const base = pbr.baseColorFactor || [1, 1, 1, 1];
      return {
        name: material.name || 'material',
        baseColor: base.slice(0, 4),
        metallic: pbr.metallicFactor ?? 1,
        roughness: pbr.roughnessFactor ?? 1,
        emissive: (material.emissiveFactor || [0, 0, 0]).slice(0, 3),
        doubleSided: Boolean(material.doubleSided),
        alphaMode: material.alphaMode || 'OPAQUE',
      };
    });
  }

  // ── Nodes / skins ───────────────────────────────────────────────────────
  getNodes() {
    return (this.json.nodes || []).map((node, index) => ({
      index,
      name: node.name || `node_${index}`,
      children: node.children ? node.children.slice() : [],
      mesh: node.mesh ?? -1,
      skin: node.skin ?? -1,
      translation: node.translation ? node.translation.slice() : [0, 0, 0],
      rotation: node.rotation ? node.rotation.slice() : [0, 0, 0, 1],
      scale: node.scale ? node.scale.slice() : [1, 1, 1],
      extras: node.extras || null,
    }));
  }

  getSkin(index = 0) {
    const skin = this.json.skins?.[index];
    if (!skin) return null;
    const ibm = skin.inverseBindMatrices !== undefined ? this.readAccessor(skin.inverseBindMatrices) : null;
    return {
      joints: skin.joints.slice(),
      skeleton: skin.skeleton ?? skin.joints[0],
      inverseBindMatrices: ibm ? ibm.data : null,
      jointCount: skin.joints.length,
    };
  }

  // ── Animations ──────────────────────────────────────────────────────────
  getAnimations() {
    return (this.json.animations || []).map((animation, index) => ({
      index,
      name: animation.name || `clip_${index}`,
      channels: (animation.channels || []).map((channel) => {
        const sampler = animation.samplers[channel.sampler];
        const input = this.readAccessor(sampler.input);
        const output = this.readAccessor(sampler.output);
        return {
          node: channel.target.node,
          path: channel.target.path,
          interpolation: sampler.interpolation || 'LINEAR',
          times: Array.from(input.data),
          values: Array.from(output.data),
          valueComponents: output.components,
          duration: input.data.length ? input.data[input.data.length - 1] : 0,
        };
      }),
      duration: Math.max(
        0,
        ...(animation.channels || []).map((channel) => {
          const input = animation.samplers[channel.sampler].input;
          const acc = this.readAccessor(input);
          return acc.count ? acc.data[acc.count - 1] : 0;
        }),
      ),
    }));
  }

  animationNames() {
    return (this.json.animations || []).map((animation, i) => animation.name || `clip_${i}`);
  }

  // ── LODs & collision ────────────────────────────────────────────────────
  // Node names are authored as `<Character>_LOD<n>` and `<Character>_COL`.
  lodNodes() {
    return this.getNodes()
      .filter((node) => /_LOD\d+$/.test(node.name))
      .map((node) => ({ ...node, lod: Number(node.name.match(/_LOD(\d+)$/)[1]) }))
      .sort((a, b) => a.lod - b.lod);
  }

  collisionNodes() {
    return this.getNodes().filter((node) => /_COL$/.test(node.name));
  }

  stats() {
    let vertices = 0;
    let triangles = 0;
    for (let i = 0; i < this.meshCount(); i += 1) {
      const mesh = this.getMesh(i);
      for (const primitive of mesh.primitives) {
        vertices += primitive.vertexCount;
        triangles += Math.floor((primitive.indices ? primitive.indices.length : primitive.vertexCount) / 3);
      }
    }
    const skins = this.json.skins || [];
    return {
      meshes: this.meshCount(),
      materials: (this.json.materials || []).length,
      nodes: (this.json.nodes || []).length,
      vertices,
      triangles,
      joints: skins.reduce((sum, skin) => sum + skin.joints.length, 0),
      clips: (this.json.animations || []).length,
      lods: this.lodNodes().length,
      collisionMeshes: this.collisionNodes().length,
      hasUVs: this.hasUVs(),
      bytes: this.bytes.byteLength,
    };
  }

  hasUVs() {
    for (let i = 0; i < this.meshCount(); i += 1) {
      for (const primitive of this.getMesh(i).primitives) {
        if (!primitive.uvs) return false;
      }
    }
    return this.meshCount() > 0;
  }
}

export function parseGLB(input) {
  return new GLTFAsset(input);
}

// ── Small mat4 helpers (column-major, glTF convention) ────────────────────
export function mat4Identity() {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

export function mat4FromTRS(t = [0, 0, 0], q = [0, 0, 0, 1], s = [1, 1, 1]) {
  const [x, y, z, w] = q;
  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;
  const xx = x * x2;
  const xy = x * y2;
  const xz = x * z2;
  const yy = y * y2;
  const yz = y * z2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;
  const out = new Float32Array(16);
  out[0] = (1 - (yy + zz)) * s[0];
  out[1] = (xy + wz) * s[0];
  out[2] = (xz - wy) * s[0];
  out[3] = 0;
  out[4] = (xy - wz) * s[1];
  out[5] = (1 - (xx + zz)) * s[1];
  out[6] = (yz + wx) * s[1];
  out[7] = 0;
  out[8] = (xz + wy) * s[2];
  out[9] = (yz - wx) * s[2];
  out[10] = (1 - (xx + yy)) * s[2];
  out[11] = 0;
  out[12] = t[0];
  out[13] = t[1];
  out[14] = t[2];
  out[15] = 1;
  return out;
}

export function mat4Multiply(a, b) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c += 1) {
    for (let r = 0; r < 4; r += 1) {
      out[c * 4 + r] =
        a[0 * 4 + r] * b[c * 4 + 0] +
        a[1 * 4 + r] * b[c * 4 + 1] +
        a[2 * 4 + r] * b[c * 4 + 2] +
        a[3 * 4 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

export function mat4Invert(m) {
  const out = new Float32Array(16);
  const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
  const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
  const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
  const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;
  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) return mat4Identity();
  det = 1 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return out;
}

// Column-major perspective, right-handed, looking down -Z.
export function mat4Perspective(fovY, aspect, near, far) {
  const f = 1 / Math.tan(fovY / 2);
  const out = new Float32Array(16);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[14] = (2 * far * near) / (near - far);
  return out;
}

export function mat4LookAt(eye, target, up = [0, 1, 0]) {
  let zx = eye[0] - target[0];
  let zy = eye[1] - target[1];
  let zz = eye[2] - target[2];
  let len = Math.hypot(zx, zy, zz) || 1;
  zx /= len; zy /= len; zz /= len;
  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  len = Math.hypot(xx, xy, xz) || 1;
  xx /= len; xy /= len; xz /= len;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  const out = new Float32Array(16);
  out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
  out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
  out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
  out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
  out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
  out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
  out[15] = 1;
  return out;
}

export function quatSlerp(a, b, t) {
  let ax = a[0], ay = a[1], az = a[2], aw = a[3];
  let bx = b[0], by = b[1], bz = b[2], bw = b[3];
  let cos = ax * bx + ay * by + az * bz + aw * bw;
  if (cos < 0) {
    cos = -cos;
    bx = -bx; by = -by; bz = -bz; bw = -bw;
  }
  if (cos > 0.9995) {
    return [ax + (bx - ax) * t, ay + (by - ay) * t, az + (bz - az) * t, aw + (bw - aw) * t];
  }
  const theta = Math.acos(Math.min(1, cos));
  const sinTheta = Math.sin(theta);
  const s0 = Math.sin((1 - t) * theta) / sinTheta;
  const s1 = Math.sin(t * theta) / sinTheta;
  return [ax * s0 + bx * s1, ay * s0 + by * s1, az * s0 + bz * s1, aw * s0 + bw * s1];
}

// Samples one animation channel at `time` seconds into a TRS component.
export function sampleChannel(channel, time) {
  const { times, values, path, valueComponents } = channel;
  if (!times.length) return null;
  if (times.length === 1 || time <= times[0]) {
    return path === 'rotation'
      ? Array.from(values.slice(0, 4))
      : Array.from(values.slice(0, valueComponents));
  }
  const last = times.length - 1;
  if (time >= times[last]) {
    const base = last * valueComponents;
    return Array.from(values.slice(base, base + valueComponents));
  }
  let i = 0;
  while (i < last && times[i + 1] < time) i += 1;
  const t0 = times[i];
  const t1 = times[i + 1] || t0 + 1e-4;
  const alpha = (time - t0) / Math.max(1e-6, t1 - t0);
  const a = Array.from(values.slice(i * valueComponents, (i + 1) * valueComponents));
  const b = Array.from(values.slice((i + 1) * valueComponents, (i + 2) * valueComponents));
  if (path === 'rotation') return quatSlerp(a, b, alpha);
  return a.map((value, index) => value + (b[index] - value) * alpha);
}
