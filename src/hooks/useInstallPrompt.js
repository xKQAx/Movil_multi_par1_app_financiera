import { useCallback, useEffect, useState } from 'react';

function readStandalone() {
  if (typeof window === 'undefined') return false;
  const displayStandalone = window.matchMedia('(display-mode: standalone)').matches;
  return displayStandalone || Boolean(window.navigator.standalone);
}

function readPlatform() {
  if (typeof navigator === 'undefined') {
    return { isIos: false, isAndroid: false, isDesktop: true };
  }
  const ua = navigator.userAgent || '';
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  const iPadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isIos = iOSDevice || iPadOs;
  const isAndroid = /Android/i.test(ua);
  return { isIos, isAndroid, isDesktop: !isIos && !isAndroid };
}

/**
 * Instalación PWA: captura beforeinstallprompt si existe, pero la UI
 * no espera ese evento (Chrome a menudo no lo dispara hasta tener SW activo).
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(readStandalone);
  const [platform] = useState(readPlatform);

  useEffect(() => {
    const onPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    const media = window.matchMedia('(display-mode: standalone)');
    const onDisplayMode = () => setInstalled(readStandalone());

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    media.addEventListener?.('change', onDisplayMode);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      media.removeEventListener?.('change', onDisplayMode);
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
    isIos: platform.isIos,
    isAndroid: platform.isAndroid,
    isDesktop: platform.isDesktop,
    isStandalone: installed,
  };
}
