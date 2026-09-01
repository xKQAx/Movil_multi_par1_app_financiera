import { useEffect, useId, useRef, useState } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { parseSpeechCommand, categoryForType } from '../utils/speechParser';
import {
  blobFromChunks,
  classifyGetUserMediaError,
  createLiveTranscriptionQueue,
  createMicLevelMonitor,
  getTranscriptionErrorMessage,
  isRecordingSupported,
  loadTranscriber,
  messageFromProgress,
  pickRecorderMimeType,
  RECORDER_TIMESLICE_MS,
  stopMediaStream,
  transcribeAudioBlob,
} from '../utils/transcribeAudio';

const MAX_RECORD_SECONDS = 25;
const METER_BAR_WEIGHTS = [0.22, 0.38, 0.58, 0.82, 1, 0.82, 0.58, 0.38, 0.22];

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function VolumeMeter({ level }) {
  const speaking = level > 0.07;
  return (
    <div className="voice-meter" role="status" aria-label="Nivel del micrófono">
      <div className="voice-meter__bars" aria-hidden="true">
        {METER_BAR_WEIGHTS.map((weight, index) => (
          <span
            key={index}
            className="voice-meter__bar"
            style={{ height: `${Math.max(6, 8 + level * 32 * weight)}px` }}
          />
        ))}
      </div>
      <p className="voice-meter__caption">{speaking ? 'Hablando…' : 'El micrófono está activo. Habla ahora.'}</p>
    </div>
  );
}

/**
 * Captura de voz reutilizable (hero en /agregar/voz o compacto en el form).
 * Flujo: Grabar (subtítulos en vivo) → Detener → Whisper del blob completo → parseSpeechCommand → onParsed.
 */
export default function VoiceCapture({
  variant = 'hero',
  lockedType = null,
  onParsed,
}) {
  const [phase, setPhase] = useState('idle');
  const [elapsed, setElapsed] = useState(0);
  const [recognizedText, setRecognizedText] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [wasmHint, setWasmHint] = useState(false);
  const [liveBusy, setLiveBusy] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const errorId = useId();

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const aliveRef = useRef(true);
  const recordingRef = useRef(false);
  const stopRecordingRef = useRef(null);
  const liveQueueRef = useRef(null);
  const micMonitorRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopMicMonitor = () => {
    micMonitorRef.current?.stop();
    micMonitorRef.current = null;
  };

  const releaseMic = () => {
    stopMicMonitor();
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    recorderRef.current = null;
  };

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      recordingRef.current = false;
      clearTimer();
      try {
        if (recorderRef.current?.state === 'recording') {
          recorderRef.current.stop();
        }
      } catch {
        /* ignore */
      }
      void liveQueueRef.current?.stop();
      releaseMic();
    };
  }, []);

  const emitParsed = (transcript) => {
    const result = parseSpeechCommand(transcript);
    let data = result.success ? result.data : result.partial || null;
    const detectedType = data?.type || null;
    if (data && lockedType) {
      data = {
        ...data,
        type: lockedType,
        category: categoryForType(data.category, lockedType),
      };
    }

    if (result.success) {
      setVoiceError('');
    } else {
      setVoiceError(
        result.error || 'No pudimos entender el comando. Intenta de nuevo o escribe los datos a mano.'
      );
    }

    onParsed?.({
      success: result.success,
      data,
      detectedType,
      error: result.error,
      transcript,
    });
  };

  const handleProgress = (event) => {
    if (!aliveRef.current) return;
    const message = messageFromProgress(event);
    if (message) setStatusMessage(message);
  };

  const startRecording = async () => {
    setVoiceError('');
    setRecognizedText('');
    setStatusMessage('Abriendo el micrófono…');
    setElapsed(0);
    setLiveBusy(false);
    setMicLevel(0);

    if (!isRecordingSupported()) {
      setVoiceError(getTranscriptionErrorMessage('unsupported'));
      setStatusMessage('');
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      setVoiceError(getTranscriptionErrorMessage(classifyGetUserMediaError(error)));
      setStatusMessage('');
      return;
    }

    if (!aliveRef.current) {
      stopMediaStream(stream);
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];
    recordingRef.current = true;

    const liveQueue = createLiveTranscriptionQueue({
      isActive: () => aliveRef.current && recordingRef.current,
      onText: (text) => {
        if (!aliveRef.current || !recordingRef.current) return;
        setRecognizedText(text);
      },
      onBusy: (busy) => {
        if (!aliveRef.current || !recordingRef.current) return;
        setLiveBusy(busy);
      },
    });
    liveQueueRef.current = liveQueue;

    void loadTranscriber(handleProgress)
      .then(({ device }) => {
        if (!aliveRef.current) return;
        if (device === 'wasm') setWasmHint(true);
        setStatusMessage((prev) => (
          prev.startsWith('Primera vez') || prev.startsWith('Descargando') ? prev : ''
        ));
      })
      .catch(() => {
        /* el error se muestra al transcribir */
      });

    const mimeType = pickRecorderMimeType();
    let recorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch {
      recordingRef.current = false;
      stopMediaStream(stream);
      streamRef.current = null;
      setVoiceError('No se pudo iniciar la grabación. Reintenta o escribe los datos a mano.');
      setStatusMessage('');
      return;
    }

    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data?.size) chunksRef.current.push(event.data);
      if (!recordingRef.current || !event.data?.size) return;
      const type = recorder.mimeType || mimeType;
      liveQueue.schedule(() => blobFromChunks(chunksRef.current, type));
    };

    try {
      recorder.start(RECORDER_TIMESLICE_MS);
    } catch {
      recordingRef.current = false;
      releaseMic();
      setVoiceError('No se pudo iniciar la grabación. Reintenta o escribe los datos a mano.');
      setStatusMessage('');
      return;
    }

    micMonitorRef.current = createMicLevelMonitor(stream, (level) => {
      if (!aliveRef.current || !recordingRef.current) return;
      setMicLevel(level);
    });

    setPhase('recording');
    setStatusMessage((prev) => (prev.startsWith('Primera vez') || prev.startsWith('Descargando') ? prev : ''));
    let seconds = 0;
    timerRef.current = setInterval(() => {
      seconds += 1;
      if (!aliveRef.current) return;
      setElapsed(seconds);
      if (seconds >= MAX_RECORD_SECONDS) {
        void stopRecordingRef.current?.();
      }
    }, 1000);
  };

  const stopRecording = async () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;

    recordingRef.current = false;
    recorderRef.current = null;
    clearTimer();
    setLiveBusy(false);
    setPhase('processing');
    setStatusMessage('Procesando el audio completo…');

    const blob = await new Promise((resolve) => {
      recorder.onstop = () => {
        resolve(blobFromChunks(chunksRef.current, recorder.mimeType));
      };
      try {
        recorder.requestData?.();
        recorder.stop();
      } catch {
        resolve(blobFromChunks(chunksRef.current, recorder.mimeType));
      }
    });

    await liveQueueRef.current?.stop();
    liveQueueRef.current = null;
    releaseMic();

    if (!aliveRef.current) return;

    try {
      const { text, device } = await transcribeAudioBlob(blob, {
        onProgress: handleProgress,
        onStatus: (status, usedDevice) => {
          if (!aliveRef.current) return;
          if (status === 'loading-model') {
            setStatusMessage((prev) => (
              prev.startsWith('Primera vez') || prev.startsWith('Descargando')
                ? prev
                : 'Preparando el reconocedor…'
            ));
          } else if (status === 'transcribing') {
            setStatusMessage(
              usedDevice === 'wasm'
                ? 'Transcribiendo el audio completo (puede tardar unos segundos)…'
                : 'Transcribiendo el audio completo…'
            );
          }
        },
      });
      if (!aliveRef.current) return;
      if (device === 'wasm') setWasmHint(true);
      setRecognizedText(text);
      setStatusMessage('');
      emitParsed(text);
    } catch (error) {
      if (!aliveRef.current) return;
      setVoiceError(error?.message || getTranscriptionErrorMessage(error?.code));
      setStatusMessage('');
    } finally {
      if (aliveRef.current) setPhase('idle');
    }
  };

  stopRecordingRef.current = stopRecording;

  const isHero = variant === 'hero';
  const isRecording = phase === 'recording';
  const isBusy = phase === 'processing';
  const label = isRecording
    ? 'Detener grabación'
    : isBusy
      ? 'Procesando audio'
      : voiceError
        ? 'Reintentar grabación'
        : 'Grabar audio';

  const phaseCaption = isBusy
    ? 'Procesando el audio completo…'
    : isRecording && liveBusy
      ? 'Te escucho (transcribiendo en vivo…)'
      : isRecording
        ? 'Grabando — te escucho'
        : '';

  const handleClick = () => {
    if (isBusy) return;
    if (isRecording) {
      void stopRecording();
      return;
    }
    void startRecording();
  };

  const showLiveRegion = isRecording || isBusy || recognizedText || statusMessage || wasmHint;

  return (
    <section className={`voice-capture voice-capture--${variant}${isHero ? ' card' : ''}`}>
      <button
        type="button"
        className={`voice-btn voice-btn--${variant}${isRecording ? ' voice-btn--recording' : ''}${isBusy ? ' voice-btn--busy' : ''}`}
        onClick={handleClick}
        disabled={isBusy}
        aria-label={label}
        aria-pressed={isRecording}
        aria-busy={isBusy}
        aria-describedby={voiceError ? errorId : undefined}
      >
        {isBusy ? (
          <>
            <Loader2 size={isHero ? 32 : 20} className="spin" aria-hidden="true" />
            {isHero ? 'Procesando...' : 'Procesando'}
          </>
        ) : isRecording ? (
          <>
            <Square size={isHero ? 28 : 18} aria-hidden="true" />
            {isHero ? `Detener · ${formatTimer(elapsed)}` : `Detener ${formatTimer(elapsed)}`}
          </>
        ) : (
          <>
            <Mic size={isHero ? 32 : 20} aria-hidden="true" />
            {voiceError ? 'Reintentar' : 'Grabar'}
          </>
        )}
      </button>

      {showLiveRegion && (
        <div className="voice-live" aria-live="polite" aria-atomic="true">
          {phaseCaption && (
            <p className="voice-indicator">
              <span className="voice-indicator__dot" aria-hidden="true" />
              {phaseCaption}
            </p>
          )}
          {statusMessage && (
            <p className="voice-status">{statusMessage}</p>
          )}
          {wasmHint && !isBusy && (
            <p className="voice-status">
              {isRecording
                ? 'En este dispositivo la transcripción en vivo puede tardar (modo lento).'
                : 'El reconocedor corre en modo lento (sin WebGPU). Puede tardar unos segundos.'}
            </p>
          )}
          {(isRecording || recognizedText) && (
            <div className="voice-listen">
              <p className="voice-listen__label">
                {isRecording || isBusy ? 'Te escucho' : 'Texto reconocido'}
              </p>
              {recognizedText ? (
                <p className="voice-live-text">“{recognizedText}”</p>
              ) : isRecording ? (
                <VolumeMeter level={micLevel} />
              ) : null}
            </div>
          )}
        </div>
      )}

      {phase === 'idle' && !recognizedText && !voiceError && (
        <p className="voice-idle-hint">
          {isHero
            ? 'La primera vez en este navegador descarga el reconocedor (~75 MB). Después queda en caché.'
            : 'Opcional: graba el monto y la categoría. Al detener se rellena el formulario.'}
        </p>
      )}

      {voiceError && (
        <div id={errorId} className="form-alert form-alert--error" role="alert">
          {voiceError}
        </div>
      )}
    </section>
  );
}
