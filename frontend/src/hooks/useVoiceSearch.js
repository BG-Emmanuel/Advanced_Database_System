import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useVoiceSearch Hook
 * 
 * Uses the browser's built-in Web Speech API (no API key needed, 100% free)
 * Works in Chrome, Edge, Samsung Browser (most Android phones)
 * Falls back gracefully in unsupported browsers
 * 
 * Supports: English (en-US) and French (fr-FR) — perfect for Cameroon's bilingual users
 */
const useVoiceSearch = (language = 'en') => {
  const [isListening, setIsListening]     = useState(false);
  const [transcript, setTranscript]       = useState('');
  const [isSupported, setIsSupported]     = useState(false);
  const [error, setError]                 = useState('');
  const [isFinalResult, setIsFinalResult] = useState(false);
  const recognitionRef = useRef(null);

  // Map our app language codes to BCP-47 language tags
  const langMap = { en: 'en-US', fr: 'fr-FR' };
  const speechLang = langMap[language] || 'en-US';

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError(language === 'fr'
        ? 'La recherche vocale n\'est pas disponible sur ce navigateur. Essayez Chrome ou Samsung Browser.'
        : 'Voice search is not available on this browser. Try Chrome or Samsung Browser.'
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang          = speechLang;
    recognition.continuous    = false;        // stop after one sentence
    recognition.interimResults = true;        // show results as user speaks
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setError('');
      setIsFinalResult(false);
    };

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText   = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += text;
        } else {
          interimText += text;
        }
      }

      setTranscript(finalText || interimText);
      if (finalText) {
        setIsFinalResult(true);
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      const msgs = {
        'no-speech':          language === 'fr' ? 'Aucun son détecté. Parlez plus fort.' : 'No sound detected. Speak louder.',
        'not-allowed':        language === 'fr' ? 'Accès au microphone refusé. Autorisez le micro.' : 'Microphone access denied. Please allow mic access.',
        'network':            language === 'fr' ? 'Erreur réseau. Vérifiez votre connexion.' : 'Network error. Check your connection.',
        'audio-capture':      language === 'fr' ? 'Microphone non trouvé.' : 'Microphone not found.',
        'aborted':            '',  // user cancelled — no message needed
      };
      setError(msgs[event.error] || (language === 'fr' ? 'Erreur de reconnaissance vocale.' : 'Voice recognition error.'));
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [speechLang, language]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    stopListening();
    setTranscript('');
    setError('');
    setIsFinalResult(false);
  }, [stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    error,
    isFinalResult,
    startListening,
    stopListening,
    reset,
  };
};

export default useVoiceSearch;
