import { useCallback, useEffect, useState } from 'react';

function readStandalone() {
  if (typeof window === 'undefined') return false;
  const displayStandalone = window.matchMedia('(display-mode: standalone)').matches;
  return displayStandalone || Boolean(window.navigator.standalone);
}

function readIosSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  const iPadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return (iOSDevice || iPadOs) && isSafari;
}

/**
 * Captura beforeinstallprompt (Android/Chrome) e iOS Safari.
 * El SW no interviene aquí; solo UI de instalación.
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(readStandalone);
  const [isIos] = useState(readIosSafari);

  useEffect(() => {
    const onPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === 'accepted';
  }, [deferredPrompt]);

  return {
    canInstall: Boolean(deferredPrompt) && !installed,
    promptInstall,
    isIos,
    isStandalone: installed,
  };
}
