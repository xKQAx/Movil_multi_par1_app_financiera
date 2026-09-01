import { useState, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import MovementForm from '../components/MovementForm';
import VoiceCapture from '../components/VoiceCapture';
import { categoryForType } from '../utils/speechParser';
import { ADD_MOVEMENT_TYPES, ROUTES } from '../utils/constants';
import { getTodayISO } from '../utils/formatCurrency';
import { useToast } from '../hooks/useToast';

const TITLES = {
  ingreso: 'Registrar ingreso',
  gasto: 'Registrar gasto',
  voz: 'Registrar por voz',
};

export default function AddMovement() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [voiceFill, setVoiceFill] = useState(null);

  const isVoice = type === 'voz';
  const routeType = type === 'ingreso' ? 'income' : 'expense';
  const [formType, setFormType] = useState(isVoice ? 'expense' : routeType);

  useEffect(() => {
    setVoiceFill(null);
    setFormType(isVoice ? 'expense' : routeType);
  }, [isVoice, routeType]);

  if (!ADD_MOVEMENT_TYPES.includes(type)) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  const handleSuccess = (movType) => {
    const msg = movType === 'income' ? 'Ingreso registrado ✓' : 'Gasto registrado ✓';
    showToast(msg);
    navigate(ROUTES.dashboard);
  };

  const applyVoiceResult = (result) => {
    if (!result?.data) return;
    const data = result.data;
    setFormType(data.type);
    setVoiceFill({
      type: data.type,
      description: data.description,
      category: categoryForType(data.category, data.type),
      amount: data.amount,
      date: getTodayISO(),
      _stamp: Date.now(),
    });
  };

  return (
    <div className="page add-movement-page page--narrow">
      <Header subtitle={TITLES[type] || 'Registrar movimiento'} />

      {isVoice && (
        <>
          <p className="text-muted voice-help">
            Toca <strong>Grabar</strong> y habla con naturalidad: verás el texto en vivo
            («Grabando — te escucho»). Ejemplo: “gasté ocho mil pesos en transporte”.
            Al <strong>Detener</strong> se transcribe el audio completo y se rellena el formulario.
            La primera vez descarga el reconocedor (~75 MB); las siguientes usa la caché.
          </p>
          <VoiceCapture variant="hero" onParsed={applyVoiceResult} />
        </>
      )}

      <div className="card">
        <MovementForm
          key={type}
          type={formType}
          initialData={voiceFill}
          enableVoice={!isVoice}
          allowTypeChange={isVoice}
          onTypeChange={setFormType}
          onSuccess={handleSuccess}
          onCancel={() => navigate(ROUTES.dashboard)}
        />
      </div>
    </div>
  );
}
