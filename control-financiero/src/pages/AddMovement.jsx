import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import MovementForm from '../components/MovementForm';
import { parseSpeechCommand, isSpeechRecognitionSupported } from '../utils/speechParser';

export default function AddMovement() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [toast, setToast] = useState('');
  const [listening, setListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const recognitionRef = useRef(null);

  const isVoice = type === 'voz';
  const movementType = type === 'ingreso' ? 'income' : 'expense';
  const titles = {
    ingreso: 'Registrar ingreso',
    gasto: 'Registrar gasto',
    voz: 'Registrar por voz',
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSuccess = (movType) => {
    const msg = movType === 'income' ? 'Ingreso registrado correctamente ✓' : 'Gasto registrado ✓';
    showToast(msg);
    setTimeout(() => navigate('/'), 800);
  };

  const startListening = () => {
    setVoiceError('');
    setRecognizedText('');

    if (!isSpeechRecognitionSupported()) {
      setVoiceError('El reconocimiento de voz no está disponible en este navegador.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CO';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('');
      setRecognizedText(transcript);

      if (event.results[0].isFinal) {
        const result = parseSpeechCommand(transcript);
        if (result.success) {
          setParsedData(result.data);
        } else {
          setVoiceError(
            result.error || 'No pudimos entender el comando. Intenta nuevamente o ingresa los datos manualmente.'
          );
          if (result.partial) setParsedData(result.partial);
        }
      }
    };

    recognition.onerror = () => {
      setVoiceError('No pudimos entender el comando. Intenta nuevamente o ingresa los datos manualmente.');
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const voiceInitialData = useMemo(() => {
    if (!parsedData) return null;
    return {
      description: parsedData.description,
      category: parsedData.category,
      amount: parsedData.amount,
    };
  }, [parsedData]);

  return (
    <div className="page add-movement-page">
      <Header subtitle={titles[type] || 'Registrar movimiento'} />

      {toast && <div className="toast toast--success" role="status">{toast}</div>}

      {isVoice && (
        <section className="voice-section card">
          <button
            type="button"
            className={`voice-btn${listening ? ' voice-btn--listening' : ''}`}
            onClick={listening ? stopListening : startListening}
            aria-label={listening ? 'Detener escucha' : 'Iniciar reconocimiento de voz'}
          >
            {listening ? (
              <>
                <Loader2 size={32} className="spin" aria-hidden="true" />
                Escuchando...
              </>
            ) : (
              <>
                <Mic size={32} aria-hidden="true" />
                Toca para hablar
              </>
            )}
          </button>

          {listening && (
            <div className="voice-indicator" aria-live="polite">
              <MicOff size={16} aria-hidden="true" />
              <span>La aplicación está escuchando...</span>
            </div>
          )}

          {recognizedText && (
            <p className="voice-text">
              <strong>Texto reconocido:</strong> "{recognizedText}"
            </p>
          )}

          {voiceError && (
            <div className="form-alert form-alert--error" role="alert">{voiceError}</div>
          )}
        </section>
      )}

      <div className="card">
        <MovementForm
          type={parsedData?.type || (isVoice ? 'expense' : movementType)}
          initialData={voiceInitialData}
          onSuccess={handleSuccess}
          onCancel={() => navigate('/')}
        />
      </div>
    </div>
  );
}
