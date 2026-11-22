// Ashen Vow — real GPU / display capability probe.
// Everything here is measured from the running browser. Nothing is invented:
// when a capability cannot be confirmed, it is reported as false/null and the
// settings UI marks the corresponding option unsupported.
import { GLB_TARGETS } from './glb.js';

const EXTENSIONS = {
  hdrRenderTarget: ['EXT_color_buffer_float', 'EXT_color_buffer_half_float'],
  floatLinear: ['OES_texture_float_linear'],
  anisotropic: ['EXT_texture_filter_anisotropic', 'WEBGL_EXT_texture_filter_anisotropic'],
  timerQuery: ['EXT_disjoint_timer_query_webgl2'],
  debugRenderer: ['WEBGL_debug_renderer_info'],
  multisampled: ['WEBGL_multisampled_render_to_texture'],
  textureCompression: ['WEBGL_compressed_texture_s3tc', 'WEBGL_compressed_texture_astc'],
  parallelCompile: ['KHR_parallel_shader_compile'],
};

// Guess only from an explicit vendored string table. Unknown adapters stay null
// instead of receiving a fabricated number.
const ADAPTER_HINTS = [
  { test: /swiftshader|llvmpipe|software|basic render/i, tier: 'software', vram: null, note: 'Software rasterizer' },
  { test: /rtx\s?(4090|4080|3090|3080)/i, tier: 'enthusiast', vram: 24 },
  { test: /rtx\s?[2-4]0\d0/i, tier: 'high', vram: 8 },
  { test: /rx\s?6[89]00|rx\s?7[89]00/i, tier: 'high', vram: 12 },
  { test: /apple\s?m[1-4]/i, tier: 'high', vram: 8 },
  { test: /intel.*(iris|arc)/i, tier: 'medium', vram: 4 },
  { test: /adreno|mali/i, tier: 'mobile', vram: null },
  { test: /intel/i, tier: 'low', vram: null },
];

let cached = null;

function glExtensionReport(gl) {
  const present = {};
  const maxAniso = 1;
  for (const [key, names] of Object.entries(EXTENSIONS)) {
    present[key] = names.some((name) => {
      try {
        return Boolean(gl.getExtension(name));
      } catch {
        return false;
      }
    });
  }
  const anisoExt = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBGL_EXT_texture_filter_anisotropic');
  return {
    present,
    maxAnisotropy: anisoExt ? gl.getParameter(anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : maxAniso,
    anisoExt,
  };
}

// Measures the real display refresh rate from animation frames. Returns null if
// the sample is too short or the page is throttled, never a guessed 60.
export async function measureRefreshRate(frames = 40, timeoutMs = 1200) {
  if (typeof requestAnimationFrame !== 'function') return null;
  const samples = [];
  const start = performance.now();
  await new Promise((resolve) => {
    const tick = () => {
      samples.push(performance.now());
      if (samples.length >= frames || performance.now() - start > timeoutMs) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  if (samples.length < 8) return null;
  const deltas = [];
  for (let i = 1; i < samples.length; i += 1) {
    const delta = samples[i] - samples[i - 1];
    if (delta > 0.5 && delta < 100) deltas.push(delta);
  }
  if (deltas.length < 6) return null;
  deltas.sort((a, b) => a - b);
  const median = deltas[Math.floor(deltas.length / 2)];
  if (!median) return null;
  return Math.round(1000 / median);
}

export function probeCapabilities(canvas = null) {
  if (cached && !canvas) return cached;
  const report = {
    webgl: false,
    webgl2: false,
    vendor: null,
    renderer: null,
    adapterTier: null,
    estimatedVRAMGb: null,
    maxTextureSize: 0,
    maxSamples: 0,
    maxAnisotropy: 1,
    hdrRenderTarget: false,
    hdrDisplay: false,
    floatLinear: false,
    anisotropic: false,
    timerQuery: false,
    msaa: false,
    compressedTextures: false,
    parallelCompile: false,
    rayTracing: false,
    vramTelemetry: false,
    gpuTelemetry: false,
    deviceMemoryGb: null,
    hardwareConcurrency: null,
    screenPixels: null,
    extendedDisplay: false,
    monitorSelection: false,
    spatialAudio: false,
    refreshRate: null,
    notes: [],
  };

  if (typeof navigator !== 'undefined') {
    report.hardwareConcurrency = navigator.hardwareConcurrency || null;
    report.deviceMemoryGb = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : null;
  }
  if (typeof window !== 'undefined' && window.screen) {
    report.screenPixels = `${window.screen.width}×${window.screen.height}`;
    report.extendedDisplay = Boolean(window.screen.isExtended);
    report.monitorSelection = typeof window.getScreenDetails === 'function';
  }
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    try {
      report.hdrDisplay = window.matchMedia('(dynamic-range: high)').matches;
    } catch {
      report.hdrDisplay = false;
    }
  }
  if (typeof window !== 'undefined' && window.AudioContext) {
    const proto = window.AudioContext.prototype;
    report.spatialAudio = typeof window.PannerNode === 'function' && 'panningModel' in (window.PannerNode?.prototype || {});
    report.spatialAudio = report.spatialAudio || Boolean(proto.createPanner);
  }

  let target = canvas;
  let created = false;
  if (!target && typeof document !== 'undefined') {
    target = document.createElement('canvas');
    created = true;
  }
  if (!target) {
    if (!canvas) cached = report;
    return report;
  }

  let gl = null;
  try {
    gl = target.getContext('webgl2', { antialias: true, depth: true, powerPreference: 'high-performance' });
  } catch {
    gl = null;
  }
  if (!gl) {
    report.notes.push('WebGL2 unavailable: 3D Mode falls back to the Canvas renderer.');
    if (!canvas) cached = report;
    return report;
  }

  report.webgl = true;
  report.webgl2 = true;
  const ext = glExtensionReport(gl);
  report.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0;
  report.maxSamples = gl.getParameter(gl.MAX_SAMPLES) || 0;
  report.maxAnisotropy = ext.maxAnisotropy;
  report.hdrRenderTarget = ext.present.hdrRenderTarget;
  report.floatLinear = ext.present.floatLinear;
  report.anisotropic = ext.present.anisotropic;
  report.timerQuery = ext.present.timerQuery;
  report.compressedTextures = ext.present.textureCompression;
  report.parallelCompile = ext.present.parallelCompile;
  report.msaa = report.maxSamples > 1;

  const debugInfo = ext.present.debugRenderer ? gl.getExtension('WEBGL_debug_renderer_info') : null;
  if (debugInfo) {
    report.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || null;
    report.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || null;
    report.gpuTelemetry = Boolean(report.renderer);
  } else {
    report.vendor = gl.getParameter(gl.VENDOR) || null;
    report.renderer = gl.getParameter(gl.RENDERER) || null;
    report.notes.push('GPU identity is masked by the browser.');
  }
  const hint = ADAPTER_HINTS.find((entry) => entry.test.test(report.renderer || ''));
  if (hint) {
    report.adapterTier = hint.tier;
    report.estimatedVRAMGb = hint.vram;
    if (hint.note) report.notes.push(hint.note);
  }
  // WebGL has no VRAM query. Only the adapter hint above can supply a figure.
  report.vramTelemetry = false;

  // WebGL 2 has no hardware ray-tracing pipeline; keep the capability false so
  // the settings page never claims it is running.
  report.rayTracing = false;
  report.notes.push('Hardware ray tracing is unavailable to WebGL2.');

  if (created) {
    try {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      /* ignore */
    }
  }
  if (!canvas) cached = report;
  return report;
}

export function refreshCapabilities() {
  cached = null;
  return probeCapabilities();
}

export function capabilitySummary(report = probeCapabilities()) {
  return [
    report.renderer ? `GPU: ${report.renderer}` : 'GPU: tidak terdeteksi',
    report.adapterTier ? `Tier: ${report.adapterTier}` : 'Tier: tidak diketahui',
    report.webgl2 ? 'WebGL2: ya' : 'WebGL2: tidak',
    report.hdrRenderTarget ? 'HDR target: ya' : 'HDR target: tidak',
    report.anisotropic ? `Aniso: hingga ${report.maxAnisotropy}×` : 'Aniso: tidak',
    report.msaa ? `MSAA: hingga ${report.maxSamples}×` : 'MSAA: tidak',
    report.timerQuery ? 'GPU timer: ya' : 'GPU timer: tidak',
    report.hdrDisplay ? 'Display HDR: ya' : 'Display HDR: tidak',
    report.refreshRate ? `Refresh: ${report.refreshRate} Hz` : 'Refresh: terukur saat berjalan',
  ].join(' · ');
}

export { GLB_TARGETS };
