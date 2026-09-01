/**
 * Grabación (MediaRecorder) y transcripción local con Whisper.
 * SRP: aquí no se interpreta el comando; eso sigue en parseSpeechCommand.
 *
 * Singleton del pipeline: el modelo se descarga una vez (~75 MB) y queda
 * en la caché del navegador (Cache API de transformers.js).
 *
 * Live: cola de 1 + ventana deslizante. El blob completo solo se transcribe al detener.
 */

const WHISPER_SAMPLE_RATE = 16000;
/** Multilingual base: mucho mejor en español que tiny, sin el peso de small (~244 MB). */
const MODEL_ID = 'Xenova/whisper-base';
const MODEL_SIZE_HINT = '~75 MB';
const MIN_BLOB_BYTES = 800;
const MIN_AUDIO_SECONDS = 0.25;
const MIN_LIVE_AUDIO_SECONDS = 0.6;

/** Timeslice de MediaRecorder: dispara chunks para transcribir en vivo. */
export const RECORDER_TIMESLICE_MS = 1000;
/** Si el acumulado supera esto, el live recorta a los últimos LIVE_WINDOW_SECONDS. */
const LIVE_FULL_UNTIL_SECONDS = 8;
const LIVE_WINDOW_SECONDS = 7;

const RECORDER_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/aac',
];

const WHISPER_GENERATE = {
  language: 'spanish',
  task: 'transcribe',
};

const ERROR_MESSAGES = {
  unsupported:
    'Este navegador no permite grabar audio (prueba Chrome o Edge). Puedes escribir el movimiento a mano.',
  permission:
    'No hay permiso de micrófono. Actívalo en el navegador o escribe el movimiento a mano.',
  'no-mic':
    'No se encontró un micrófono. Conecta uno o escribe el movimiento a mano.',
  empty:
    'No se escuchó nada. Graba de nuevo o escribe los datos a mano.',
  decode:
    'No se pudo leer la grabación. Reintenta o escribe los datos a mano.',
  model:
    'No se pudo cargar el reconocedor de voz. Reintenta o escribe los datos a mano.',
  transcribe:
    'No se pudo transcribir el audio. Reintenta o escribe los datos a mano.',
};

let transcriberPromise = null;

export class TranscriptionError extends Error {
  constructor(code, cause) {
    super(ERROR_MESSAGES[code] || ERROR_MESSAGES.transcribe);
    this.name = 'TranscriptionError';
    this.code = code;
    this.cause = cause;
  }
}

export function getTranscriptionErrorMessage(code) {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.transcribe;
}

export function isRecordingSupported() {
  return (
    typeof window !== 'undefined'
    && typeof navigator !== 'undefined'
    && typeof MediaRecorder !== 'undefined'
    && !!navigator.mediaDevices?.getUserMedia
  );
}

export function pickRecorderMimeType() {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return '';
  }
  return RECORDER_MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

export function blobFromChunks(chunks, mimeType) {
  return new Blob(chunks, { type: mimeType || pickRecorderMimeType() || 'audio/webm' });
}

export function stopMediaStream(stream) {
  stream?.getTracks?.().forEach((track) => {
    try {
      track.stop();
    } catch {
      /* ignore */
    }
  });
}

export function classifyGetUserMediaError(error) {
  const name = error?.name || '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') return 'permission';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'no-mic';
  if (name === 'NotReadableError' || name === 'TrackStartError') return 'no-mic';
  return 'permission';
}

export function isModelDownloadProgress(event) {
  const status = event?.status;
  if (status === 'download' || status === 'progress') return true;
  if (status === 'initiate' && event?.file) return true;
  return false;
}

export function messageFromProgress(event) {
  if (!isModelDownloadProgress(event)) return '';
  const pct = Number(event?.progress);
  const suffix = Number.isFinite(pct) && pct > 0 && pct < 100
    ? ` ${Math.round(pct)}%`
    : '';
  return `Primera vez: descargando el reconocedor (${MODEL_SIZE_HINT})…${suffix}`;
}

function resampleLinear(input, fromRate, toRate) {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outLength);
  const last = input.length - 1;
  for (let i = 0; i < outLength; i += 1) {
    const srcIndex = i * ratio;
    const i0 = Math.floor(srcIndex);
    const i1 = Math.min(i0 + 1, last);
    const t = srcIndex - i0;
    output[i] = input[i0] * (1 - t) + input[i1] * t;
  }
  return output;
}

function mixToMono(audioBuffer) {
  const { numberOfChannels, length } = audioBuffer;
  if (numberOfChannels === 1) return audioBuffer.getChannelData(0);
  const mono = new Float32Array(length);
  for (let channel = 0; channel < numberOfChannels; channel += 1) {
    const data = audioBuffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      mono[i] += data[i] / numberOfChannels;
    }
  }
  return mono;
}

async function blobToMono16k(blob) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) throw new TranscriptionError('decode');

  const ctx = new AudioCtx();
  try {
    if (ctx.state === 'suspended') await ctx.resume();
    const buffer = await blob.arrayBuffer();
    const decoded = await ctx.decodeAudioData(buffer.slice(0));
    const mono = mixToMono(decoded);
    return resampleLinear(mono, decoded.sampleRate, WHISPER_SAMPLE_RATE);
  } catch (error) {
    if (error instanceof TranscriptionError) throw error;
    throw new TranscriptionError('decode', error);
  } finally {
    try {
      await ctx.close();
    } catch {
      /* ignore */
    }
  }
}

/** Recorta el live a los últimos 7 s cuando el acumulado supera ~8 s (Whisper no debe ir a 25 s cada segundo). */
function maybeSliceLiveWindow(audio) {
  const totalSec = audio.length / WHISPER_SAMPLE_RATE;
  if (totalSec <= LIVE_FULL_UNTIL_SECONDS) return audio;
  const keep = Math.round(LIVE_WINDOW_SECONDS * WHISPER_SAMPLE_RATE);
  return audio.slice(-keep);
}

async function resolveDevice() {
  if (typeof navigator === 'undefined' || !navigator.gpu) return 'wasm';
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return adapter ? 'webgpu' : 'wasm';
  } catch {
    return 'wasm';
  }
}

async function createPipeline(device, onProgress) {
  const { pipeline, env } = await import('@huggingface/transformers');
  env.allowLocalModels = false;
  env.allowRemoteModels = true;
  env.useBrowserCache = true;

  return pipeline('automatic-speech-recognition', MODEL_ID, {
    device,
    dtype: device === 'webgpu' ? 'fp32' : 'q8',
    progress_callback: onProgress || undefined,
  });
}

/**
 * Carga perezosa del modelo (dynamic import). Reutiliza la misma instancia.
 */
export async function loadTranscriber(onProgress) {
  if (!transcriberPromise) {
    transcriberPromise = (async () => {
      const preferred = await resolveDevice();
      if (preferred === 'webgpu') {
        try {
          const transcriber = await createPipeline('webgpu', onProgress);
          return { transcriber, device: 'webgpu' };
        } catch {
          /* WASM si WebGPU falla al crear el pipeline */
        }
      }
      const transcriber = await createPipeline('wasm', onProgress);
      return { transcriber, device: 'wasm' };
    })().catch((error) => {
      transcriberPromise = null;
      throw new TranscriptionError('model', error);
    });
  }
  return transcriberPromise;
}

async function runWhisper(audio, { onProgress, windowed } = {}) {
  const { transcriber, device } = await loadTranscriber(onProgress);
  const samples = windowed ? maybeSliceLiveWindow(audio) : audio;
  const output = await transcriber(samples, WHISPER_GENERATE);
  return { text: String(output?.text || '').trim(), device };
}

export async function transcribeAudioBlob(blob, { onProgress, onStatus } = {}) {
  if (!blob || blob.size < MIN_BLOB_BYTES) {
    throw new TranscriptionError('empty');
  }

  onStatus?.('loading-model');
  const loaded = await loadTranscriber(onProgress);

  onStatus?.('decoding');
  const audio = await blobToMono16k(blob);
  if (!audio || audio.length < WHISPER_SAMPLE_RATE * MIN_AUDIO_SECONDS) {
    throw new TranscriptionError('empty');
  }

  onStatus?.('transcribing', loaded.device);
  try {
    const { text, device } = await runWhisper(audio, { onProgress, windowed: false });
    if (!text) throw new TranscriptionError('empty');
    return { text, device };
  } catch (error) {
    if (error instanceof TranscriptionError) throw error;
    throw new TranscriptionError('transcribe', error);
  }
}

/**
 * Transcripción parcial para subtítulos. No lanza si el audio es corto o sale vacío.
 */
export async function transcribeLiveBlob(blob) {
  if (!blob || blob.size < MIN_BLOB_BYTES) {
    return { text: '', device: null };
  }

  const audio = await blobToMono16k(blob);
  if (!audio || audio.length < WHISPER_SAMPLE_RATE * MIN_LIVE_AUDIO_SECONDS) {
    return { text: '', device: null };
  }

  return runWhisper(audio, { windowed: true });
}

/**
 * Cola de 1: si Whisper aún corre, marca pendiente y al terminar usa el blob más reciente.
 */
export function createLiveTranscriptionQueue({ onText, onBusy, isActive }) {
  let busy = false;
  let pending = false;
  let generation = 0;
  let settle = Promise.resolve();

  const run = async (getBlob) => {
    if (!isActive?.()) return;
    if (busy) {
      pending = true;
      return;
    }

    busy = true;
    pending = false;
    const myGen = generation;
    let release;
    settle = new Promise((resolve) => {
      release = resolve;
    });
    onBusy?.(true);

    try {
      const blob = getBlob?.();
      const { text } = await transcribeLiveBlob(blob);
      if (generation !== myGen || !isActive?.()) return;
      if (text) onText?.(text);
    } catch {
      /* decode incompleto u otro fallo transitorio: el siguiente chunk reintenta */
    } finally {
      busy = false;
      onBusy?.(false);
      release?.();
      if (pending && isActive?.() && generation === myGen) {
        void run(getBlob);
      }
    }
  };

  return {
    schedule(getBlob) {
      void run(getBlob);
    },
    async stop() {
      generation += 1;
      pending = false;
      await settle;
    },
  };
}

/**
 * Nivel RMS del micrófono (AnalyserNode) para mostrar que sí captura mientras Whisper arranca.
 */
export function createMicLevelMonitor(stream, onLevel) {
  const AudioCtx = typeof window !== 'undefined'
    ? window.AudioContext || window.webkitAudioContext
    : null;

  if (!AudioCtx || !stream) {
    return { stop() {} };
  }

  const ctx = new AudioCtx();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.45;
  source.connect(analyser);

  const data = new Uint8Array(analyser.fftSize);
  let rafId = 0;
  let stopped = false;
  let lastEmit = 0;

  const tick = () => {
    if (stopped) return;
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const level = Math.min(1, Math.sqrt(sum / data.length) * 4);
    const now = performance.now();
    if (now - lastEmit >= 50) {
      lastEmit = now;
      onLevel?.(level);
    }
    rafId = requestAnimationFrame(tick);
  };

  void (async () => {
    try {
      if (ctx.state === 'suspended') await ctx.resume();
    } catch {
      /* ignore */
    }
    if (!stopped) rafId = requestAnimationFrame(tick);
  })();

  return {
    stop() {
      stopped = true;
      cancelAnimationFrame(rafId);
      try {
        source.disconnect();
      } catch {
        /* ignore */
      }
      try {
        analyser.disconnect();
      } catch {
        /* ignore */
      }
      ctx.close().catch(() => {});
    },
  };
}
