/* =============================================================
   speech.js - Reconnaissance vocale pour ajout d'articles
============================================================= */

let recognition = null;
let isListening = false;

function initSpeech() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.warn('Speech recognition not supported');
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = (cfg && cfg.lang) ? cfg.lang + '-' + cfg.lang.toUpperCase() : 'fr-FR';

  recognition.onstart = function() {
    isListening = true;
    showSnack('🎤 Listening...');
  };

  recognition.onresult = function(event) {
    let transcript = event.results[0][0].transcript;
    // Remplacer " et " par ", " pour permettre l'ajout multiple
    transcript = transcript.replace(/\s+et\s+/g, ', ');
    const input = document.getElementById('iName');
    if (input) {
      input.value = transcript;
      input.dispatchEvent(new Event('input'));
    }
    stopListening();
  };

  recognition.onerror = function(event) {
    console.error('Speech recognition error:', event.error);
    showSnack('Speech recognition error');
    stopListening();
  };

  recognition.onend = function() {
    stopListening();
  };
}

function startListening() {
  if (!recognition) initSpeech();
  if (recognition && !isListening) {
    try {
      recognition.start();
    } catch (e) {
      console.error('Could not start speech recognition:', e);
    }
  }
}

function stopListening() {
  if (recognition && isListening) {
    recognition.stop();
    isListening = false;
  }
}

window.startListening = startListening;
window.stopListening = stopListening;