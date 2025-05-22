
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ipaPracticeWords = [
    // Vowels - Monophthongs
    { ipa: "/iː/", word: "see", sentence: "Can you see the sea?" },
    { ipa: "/ɪ/", word: "sit", sentence: "Please sit down." },
    { ipa: "/e/", word: "bed", sentence: "Time for bed." },
    { ipa: "/æ/", word: "cat", sentence: "A black cat sat." },
    { ipa: "/ɑː/", word: "hot", sentence: "The pot is hot." },
    { ipa: "/ɔː/", word: "law", sentence: "Obey the law." },
    { ipa: "/ʊ/", word: "book", sentence: "Read a good book." },
    { ipa: "/uː/", word: "blue", sentence: "The sky is blue." },
    { ipa: "/ʌ/", word: "cup", sentence: "A cup of coffee." },
    { ipa: "/ə/", word: "sofa", sentence: "Relax on the sofa." },
    { ipa: "/ɝ/", word: "bird", sentence: "The bird sings early." },
    { ipa: "/ɚ/", word: "father", sentence: "Her father is tall." },

    // Vowels - Diphthongs
    { ipa: "/eɪ/", word: "say", sentence: "Say it again." },
    { ipa: "/aɪ/", word: "my", sentence: "This is my bike." },
    { ipa: "/ɔɪ/", word: "boy", sentence: "The boy has a toy." },
    { ipa: "/oʊ/", word: "go", sentence: "Let's go home." },
    { ipa: "/aʊ/", word: "now", sentence: "Do it right now." },

    // Consonants - Plosives
    { ipa: "/p/", word: "pen", sentence: "Use a blue pen." },
    { ipa: "/b/", word: "big", sentence: "A big brown bear." },
    { ipa: "/t/", word: "top", sentence: "At the top of the hill." },
    { ipa: "/d/", word: "dog", sentence: "The dog barks." },
    { ipa: "/k/", word: "key", sentence: "Find the lost key." },
    { ipa: "/ɡ/", word: "get", sentence: "Get a good grade." },

    // Consonants - Fricatives
    { ipa: "/f/", word: "fish", sentence: "A big red fish." },
    { ipa: "/v/", word: "van", sentence: "Drive the blue van." },
    { ipa: "/θ/", word: "thin", sentence: "A thin piece of paper." },
    { ipa: "/ð/", word: "this", sentence: "This is the one." },
    { ipa: "/s/", word: "sun", sentence: "The sun is shining." },
    { ipa: "/z/", word: "zoo", sentence: "Let's go to the zoo." },
    { ipa: "/ʃ/", word: "she", sentence: "She sells seashells." },
    { ipa: "/ʒ/", word: "vision", sentence: "Good vision is important." },
    { ipa: "/h/", word: "hat", sentence: "Wear a warm hat." },

    // Consonants - Affricates
    { ipa: "/tʃ/", word: "chin", sentence: "Touch your chin." },
    { ipa: "/dʒ/", word: "jam", sentence: "Strawberry jam is sweet." },

    // Consonants - Nasals
    { ipa: "/m/", word: "man", sentence: "A tall young man." },
    { ipa: "/n/", word: "net", sentence: "Catch fish with a net." },
    { ipa: "/ŋ/", word: "sing", sentence: "Sing a happy song." },

    // Consonants - Approximants
    { ipa: "/l/", word: "leg", sentence: "My left leg hurts." },
    { ipa: "/ɹ/", word: "red", sentence: "A bright red car." },
    { ipa: "/w/", word: "wet", sentence: "The grass is wet." },
    { ipa: "/j/", word: "yes", sentence: "Say yes to the dress." }
];

let currentWordIndex = 0;
let isRecording = false;
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let recordedAudioURL: string | null = null;
let recorderMimeType: string = '';
let currentParagraphText: string = "";
let currentParagraphSpeed: number = 1.0;
let currentLanguage = 'en';
let translations: any = {};

const supportedLanguages: { code: string; nameKey: string; bcp47: string, nativeName?: string, geminiName: string }[] = [
    { code: 'en', nameKey: 'lang_en', bcp47: 'en-US', nativeName: 'English', geminiName: 'English' },
    { code: 'vi', nameKey: 'lang_vi', bcp47: 'vi-VN', nativeName: 'Tiếng Việt', geminiName: 'Vietnamese' },
    { code: 'ko', nameKey: 'lang_ko', bcp47: 'ko-KR', nativeName: '한국어', geminiName: 'Korean' },
    { code: 'ja', nameKey: 'lang_ja', bcp47: 'ja-JP', nativeName: '日本語', geminiName: 'Japanese' },
    { code: 'lo', nameKey: 'lang_lo', bcp47: 'lo-LA', nativeName: 'ພາສາລາວ', geminiName: 'Lao' },
    { code: 'th', nameKey: 'lang_th', bcp47: 'th-TH', nativeName: 'ภาษาไทย', geminiName: 'Thai' },
    { code: 'zh', nameKey: 'lang_zh', bcp47: 'zh-CN', nativeName: '中文', geminiName: 'Chinese' }
];


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// DOM Elements
const appTitleEl = document.getElementById("app-title") as HTMLElement;
const ipaSymbolEl = document.querySelector("#ipa-display .ipa-symbol") as HTMLElement;
const wordExampleEl = document.querySelector("#ipa-display .word-example") as HTMLElement;
const sentenceExampleEl = document.querySelector("#ipa-display .sentence-example") as HTMLElement;
const ipaHintDisplayEl = document.getElementById("ipa-hint-display") as HTMLElement;
const matchResultEl = document.getElementById("match-result") as HTMLElement;
const paragraphDisplayEl = document.getElementById("paragraph-display") as HTMLElement;
const paragraphIpaDisplayEl = document.getElementById("paragraph-ipa-display") as HTMLElement;

const listenButton = document.getElementById("listen-button") as HTMLButtonElement;
const recordButton = document.getElementById("record-button") as HTMLButtonElement;
const recordButtonTextEl = recordButton.querySelector("span:not(.material-symbols-outlined)") as HTMLSpanElement;
const recordButtonIcon = recordButton.querySelector(".material-symbols-outlined") as HTMLElement;
const listenToRecordingButton = document.getElementById("listen-to-recording-button") as HTMLButtonElement;
const nextButton = document.getElementById("next-button") as HTMLButtonElement;
const newParagraphButton = document.getElementById("new-paragraph-button") as HTMLButtonElement;
const listenParagraphButton = document.getElementById("listen-paragraph-button") as HTMLButtonElement;
const paragraphSpeedSlider = document.getElementById("paragraph-speed-slider") as HTMLInputElement;
const paragraphSpeedValueEl = document.getElementById("paragraph-speed-value") as HTMLSpanElement;
const languageButtonGroup = document.getElementById("language-button-group") as HTMLDivElement;

// State for paragraph word highlighting
let currentParagraphWordElements: HTMLSpanElement[] = [];
let currentlyHighlightedWordSpan: HTMLSpanElement | null = null;
let activeSpeechUtterance: SpeechSynthesisUtterance | null = null;


async function loadTranslations(langCode: string): Promise<void> {
    try {
        const response = await fetch(`locales/${langCode}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load ${langCode}.json`);
        }
        translations = await response.json();
        applyTranslations();
        document.documentElement.lang = langCode; // Set overall page language
    } catch (error) {
        console.error("Error loading translations:", error);
        // Fallback to English if loading fails for another language
        if (langCode !== 'en') {
            await setLanguage('en'); // This will re-load and re-apply 'en'
        }
    }
}

function getTranslation(key: string, fallback?: string): string {
    return translations[key] || fallback || key;
}

function applyTranslations() {
    document.querySelectorAll<HTMLElement>('[data-translate-key]').forEach(el => {
        const key = el.dataset.translateKey;
        if (key) {
            const translation = getTranslation(key);
            if (el.tagName === 'INPUT' && (el.getAttribute('type') === 'submit' || el.getAttribute('type') === 'button')) {
                (el as HTMLInputElement).value = translation;
            } else if (el.hasAttribute('aria-label') && el.dataset.translateAriaKey) {
                 el.setAttribute('aria-label', getTranslation(el.dataset.translateAriaKey));
            } else if (el.dataset.translateHtml) {
                el.innerHTML = translation; // For elements where HTML content is needed
            }
            else {
                el.textContent = translation;
            }
        }
    });

     // Update ARIA labels for language buttons
    if (languageButtonGroup) {
        languageButtonGroup.querySelectorAll<HTMLButtonElement>('.language-button').forEach(button => {
            const langCode = button.dataset.langCode;
            const langObj = supportedLanguages.find(l => l.code === langCode);
            if (langObj) {
                const ariaLabel = getTranslation(`ariaSetLanguageTo_${langCode}`, `Set language to ${langObj.nativeName || langObj.geminiName}`);
                button.setAttribute('aria-label', ariaLabel);
            }
        });
    }

    if (appTitleEl) appTitleEl.textContent = getTranslation('appTitle', 'IPA Pronunciation Practice');
    document.title = getTranslation('appTitle', 'IPA Pronunciation Practice'); 

    if (recordButtonTextEl) recordButtonTextEl.textContent = getTranslation(isRecording ? 'stopRecordingButton' : 'recordButton');
    recordButton?.setAttribute('aria-label', getTranslation(isRecording ? 'ariaStopRecording' : 'ariaStartRecording'));
    listenButton?.setAttribute('aria-label', getTranslation('ariaListenExample'));
    listenToRecordingButton?.setAttribute('aria-label', getTranslation('ariaListenToRecording'));
    nextButton?.setAttribute('aria-label', getTranslation('ariaNextWord'));
    newParagraphButton?.setAttribute('aria-label', getTranslation('ariaNewParagraph'));
    listenParagraphButton?.setAttribute('aria-label', getTranslation('ariaListenParagraph'));

    if (!process.env.API_KEY) {
        const errorMsg = getTranslation('apiKeyError');
        if (paragraphDisplayEl) paragraphDisplayEl.innerHTML = `<p style="color: red; font-weight: bold;">${errorMsg}</p>`;
        if (paragraphIpaDisplayEl) paragraphIpaDisplayEl.innerHTML = `<p style="color: red; font-weight: bold;">${getTranslation('apiKeyErrorIPA')}</p>`;
    }
}

async function setLanguage(newLangCode: string) {
    if (currentLanguage === newLangCode && Object.keys(translations).length > 0) {
        return; // Already on this language and translations loaded
    }
    currentLanguage = newLangCode;
    localStorage.setItem('selectedLanguage', newLangCode);

    // Update active button state
    if (languageButtonGroup) {
        languageButtonGroup.querySelectorAll<HTMLButtonElement>('.language-button').forEach(btn => {
            if (btn.dataset.langCode === newLangCode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    await loadTranslations(newLangCode);

    // Stop any ongoing speech from paragraph or IPA word
    window.speechSynthesis.cancel();
    clearParagraphHighlight();
    activeSpeechUtterance = null;

    updatePracticeWordDisplay(); 
}


function updatePracticeWordDisplay() {
    const currentData = ipaPracticeWords[currentWordIndex];
    if (ipaSymbolEl) ipaSymbolEl.textContent = currentData.ipa;
    if (wordExampleEl) wordExampleEl.textContent = currentData.word;
    if (sentenceExampleEl) sentenceExampleEl.textContent = `"${currentData.sentence}"`;
    if (matchResultEl) matchResultEl.textContent = "";
    
    if (ipaHintDisplayEl) {
        ipaHintDisplayEl.innerHTML = `<p>${getTranslation('loadingHint', "Loading hint...")}</p>`;
        ipaHintDisplayEl.classList.remove('hint-loaded'); 
        handleShowIpaHint(); 
    }

    listenToRecordingButton.disabled = true;
    applyTranslations(); 
}

function clearParagraphHighlight() {
    if (currentlyHighlightedWordSpan) {
        currentlyHighlightedWordSpan.classList.remove('highlighted-word');
        currentlyHighlightedWordSpan = null;
    }
}

// Function to remove common introductory phrases from the generated paragraph
function cleanParagraphResponse(text: string): string {
    const commonPrefixes = [
        /^Here is a short paragraph for pronunciation practice:\s*/i,
        /^Here's a short paragraph for pronunciation practice:\s*/i,
        /^Okay, here is a short paragraph for pronunciation practice:\s*/i,
        /^Sure, here is a short paragraph for pronunciation practice:\s*/i,
        /^Alright, here is a short paragraph for pronunciation practice:\s*/i,
        /^Here is a paragraph for you:\s*/i,
        /^Here's a paragraph for you:\s*/i,
        /^Okay, here's a paragraph for you:\s*/i,
        /^Here is your paragraph:\s*/i,
        /^Here's your paragraph:\s*/i,
        /^Please find your paragraph below:\s*/i,
        /^The paragraph is as follows:\s*/i,
        /^Here is a paragraph:\s*/i,
        /^Here's a paragraph:\s*/i,
        /^Okay, here's a paragraph:\s*/i,
        /^Sure, here is a paragraph:\s*/i,
        /^Alright, here is a paragraph:\s*/i,
        /^Certainly, here is a paragraph for you to practice:\s*/i,
        /^Certainly, here's a paragraph for you to practice:\s*/i,
    ];

    let cleanedText = text.trim();
    for (const prefixRegex of commonPrefixes) {
        if (prefixRegex.test(cleanedText)) {
            cleanedText = cleanedText.replace(prefixRegex, "");
            break; // Assume only one such prefix needs removal
        }
    }
    return cleanedText.trim(); // Trim again in case replacement left leading/trailing whitespace
}


async function fetchNewParagraph() {
    if (!paragraphDisplayEl || !paragraphIpaDisplayEl || !listenParagraphButton) return;

    // Stop any ongoing speech and clear highlights
    window.speechSynthesis.cancel();
    clearParagraphHighlight();
    activeSpeechUtterance = null;

    const loadingParaMsg = getTranslation('loadingParagraph', 'Loading new paragraph...');
    const loadingIPAMsg = getTranslation('loadingIPATranscription', 'Loading IPA transcription...');
    paragraphDisplayEl.innerHTML = `<p>${loadingParaMsg}</p>`; // Show loading message
    paragraphIpaDisplayEl.innerHTML = `<p>${loadingIPAMsg}</p>`;
    currentParagraphText = "";
    currentParagraphWordElements = []; // Clear previous word elements
    newParagraphButton.disabled = true;
    listenParagraphButton.disabled = true;

    const targetLanguageName = "English"; 

    try {
        const paragraphResponse: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: `Generate a short ${targetLanguageName} paragraph for pronunciation practice, between 50 and 70 words. Ensure the paragraph is simple and clear. Avoid any introductory phrases like 'Here is a paragraph'.`,
        });
        const rawParagraphText = paragraphResponse.text;
        if (!rawParagraphText) {
            paragraphDisplayEl.innerHTML = `<p>${getTranslation('noParagraphToListen', "No paragraph loaded to listen to.")}</p>`;
            newParagraphButton.disabled = false;
            listenParagraphButton.disabled = false;
            return;
        }
        currentParagraphText = cleanParagraphResponse(rawParagraphText);


        // Render paragraph with spans for highlighting
        paragraphDisplayEl.innerHTML = ''; // Clear loading message
        const wordRegex = /([a-zA-Z0-9'-]+)|([^a-zA-Z0-9'-]+)/g; // Match words or non-words (punctuation, spaces)
        let matchResult;
        while ((matchResult = wordRegex.exec(currentParagraphText)) !== null) {
            const segment = matchResult[0];
            if (matchResult[1]) { // It's a word (group 1)
                const span = document.createElement('span');
                span.textContent = segment;
                span.classList.add('paragraph-word');
                span.dataset.charStart = matchResult.index.toString();
                span.dataset.charEnd = (matchResult.index + segment.length).toString();
                paragraphDisplayEl.appendChild(span);
                currentParagraphWordElements.push(span);
            } else { // It's a non-word (group 2) - punctuation, space
                paragraphDisplayEl.appendChild(document.createTextNode(segment));
            }
        }
        listenParagraphButton.disabled = false;

        try {
            const ipaResponse: GenerateContentResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-04-17",
                contents: `Please convert the following ${targetLanguageName} text to International Phonetic Alphabet (IPA) symbols. Provide only the IPA transcription without any additional explanations, introductory phrases, or markdown formatting.\n\nText: "${currentParagraphText}"`,
            });
            if (!ipaResponse.text) {
                paragraphIpaDisplayEl.innerHTML = `<p>${getTranslation('noIPAToDisplay', "No IPA transcription to display.")}</p>`;
                return;
            }

            let ipaText = ipaResponse.text.trim();
            const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
            const match = ipaText.match(fenceRegex);
            if (match && match[2]) {
                ipaText = match[2].trim();
            }
            paragraphIpaDisplayEl.innerHTML = `<p>${ipaText || getTranslation('ipaTranscriptionNotAvailable', "IPA transcription not available.")}</p>`;

        } catch (ipaError) {
            console.error("Error fetching IPA transcription:", ipaError);
            paragraphIpaDisplayEl.innerHTML = `<p>${getTranslation('couldNotLoadIPA', "Sorry, couldn't load IPA transcription. Please try again.")}</p>`;
        }

    } catch (error) {
        console.error("Error fetching paragraph:", error);
        paragraphDisplayEl.innerHTML = `<p>${getTranslation('couldNotLoadParagraph', "Sorry, couldn't load a paragraph. Please try again.")}</p>`;
        paragraphIpaDisplayEl.innerHTML = `<p>${getTranslation('ipaDependsOnParagraph', "IPA transcription depends on paragraph loading.")}</p>`;
        currentParagraphText = "";
        listenParagraphButton.disabled = true;
    } finally {
        newParagraphButton.disabled = false;
    }
}

async function handleShowIpaHint() {
    if (!ipaHintDisplayEl) return;

    if (!process.env.API_KEY) {
        ipaHintDisplayEl.innerHTML = `<p style="color: red; font-weight: bold;">${getTranslation('apiKeyErrorHint', "IPA hints require API Key.")}</p>`;
        ipaHintDisplayEl.classList.add('hint-loaded');
        return;
    }

    const currentData = ipaPracticeWords[currentWordIndex]; 
    const currentIpa = currentData.ipa;
    const selectedLanguageObj = supportedLanguages.find(lang => lang.code === currentLanguage);
    const targetHintLanguageName = selectedLanguageObj ? selectedLanguageObj.geminiName : 'English';


    try {
        const hintResponse: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: `Describe the mouth, tongue, and lip position for producing the IPA sound ${currentIpa} in General American English. Be concise (1-2 short sentences) and focus on articulation for a language learner. Provide this description in ${targetHintLanguageName}.`,
        });
        if (!hintResponse.text) {
            ipaHintDisplayEl.innerHTML = `<p>${getTranslation('noHintToDisplay', "No hint to display.")}</p>`;
            return;
        }
        
        let hintText = hintResponse.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = hintText.match(fenceRegex);
        if (match && match[2]) {
            hintText = match[2].trim();
        }
        ipaHintDisplayEl.innerHTML = `<p>${hintText || getTranslation('hintNotAvailable', "Hint not available at this moment.")}</p>`;
    } catch (error) {
        console.error("Error fetching IPA hint:", error);
        ipaHintDisplayEl.innerHTML = `<p>${getTranslation('couldNotLoadHint', "Sorry, couldn't load the hint. Please try again.")}</p>`;
    } finally {
        ipaHintDisplayEl.classList.add('hint-loaded');
    }
}


function handleListen() {
    const currentData = ipaPracticeWords[currentWordIndex];
    const textToSpeak = `${currentData.word}`; 

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Cancel any other speech
        clearParagraphHighlight(); // Clear paragraph highlight if any
        activeSpeechUtterance = null;

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        const voices = window.speechSynthesis.getVoices();
        let englishVoice = voices.find(voice => voice.lang.startsWith('en-US'));
        if (!englishVoice) {
           englishVoice = voices.find(voice => voice.lang.startsWith('en'));
        }
        if (englishVoice) {
            utterance.voice = englishVoice;
        } else {
            utterance.lang = 'en-US'; 
        }
        utterance.pitch = 1;
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    } else {
        const errorMsg = getTranslation('ttsNotSupported', "Sorry, your browser doesn't support text-to-speech.");
        if (matchResultEl) matchResultEl.textContent = errorMsg;
        else alert(errorMsg);
    }
}

function handleListenParagraph() {
    if (!currentParagraphText || currentParagraphWordElements.length === 0) {
        if (paragraphDisplayEl) paragraphDisplayEl.innerHTML = `<p>${getTranslation('noParagraphToListen', "No paragraph loaded to listen to.")}</p>`;
        return;
    }

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Cancel any ongoing speech, including itself if re-clicked
        clearParagraphHighlight();     // Clear previous highlight

        activeSpeechUtterance = new SpeechSynthesisUtterance(currentParagraphText);
        
        activeSpeechUtterance.lang = 'en-US'; 
        const voices = window.speechSynthesis.getVoices();
        let targetVoice = voices.find(voice => voice.lang.startsWith('en-US'));
        if (!targetVoice) { 
            targetVoice = voices.find(voice => voice.lang.startsWith('en'));
        }
        if(targetVoice) {
            activeSpeechUtterance.voice = targetVoice;
        }

        activeSpeechUtterance.pitch = 1;
        activeSpeechUtterance.rate = currentParagraphSpeed;

        activeSpeechUtterance.onboundary = (event: SpeechSynthesisEvent) => {
            if (event.name !== 'word') return;
            clearParagraphHighlight(); // Clear previous word's highlight

            const charIndex = event.charIndex;
            for (const span of currentParagraphWordElements) {
                const start = parseInt(span.dataset.charStart || '0');
                const end = parseInt(span.dataset.charEnd || '0');
                if (charIndex >= start && charIndex < end) {
                    span.classList.add('highlighted-word');
                    currentlyHighlightedWordSpan = span;
                    // Optional: scroll into view
                    // span.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                    break;
                }
            }
        };

        activeSpeechUtterance.onend = () => {
            clearParagraphHighlight();
            activeSpeechUtterance = null;
        };

        activeSpeechUtterance.onerror = (event: SpeechSynthesisErrorEvent) => {
            console.error("Speech synthesis error:", event.error);
            clearParagraphHighlight();
            activeSpeechUtterance = null;
            // Optionally display a message to the user
            if (paragraphDisplayEl) { // Show error in paragraph area if it's still relevant
                 const errorMsg = getTranslation('ttsNotSupportedParagraph', "Sorry, your browser encountered an error during text-to-speech for the paragraph.");
                 // Avoid overwriting paragraph text, maybe add a small message below or above
            }
        };
        
        window.speechSynthesis.speak(activeSpeechUtterance);

    } else {
         const errorMsg = getTranslation('ttsNotSupportedParagraph', "Sorry, your browser doesn't support text-to-speech for the paragraph.");
         if (paragraphDisplayEl) paragraphDisplayEl.innerHTML = `<p>${errorMsg}</p>`; // This will overwrite paragraph words
         else alert(errorMsg);
    }
}

function cleanupRecordedAudio() {
    if (recordedAudioURL) {
        URL.revokeObjectURL(recordedAudioURL);
        recordedAudioURL = null;
    }
    audioChunks = [];
    listenToRecordingButton.disabled = true;
}

async function handleRecord() {
    if (isRecording) {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
        }
        isRecording = false;
        recordButtonIcon.textContent = "mic";
        if (recordButtonTextEl) recordButtonTextEl.textContent = getTranslation('recordButton');
        recordButton.setAttribute("aria-label", getTranslation('ariaStartRecording'));
        recordButton.classList.remove("recording");
         if (matchResultEl) {
             matchResultEl.textContent = getTranslation('processingRecording', "Processing recording...");
         }
    } else {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                cleanupRecordedAudio();
                if (matchResultEl) matchResultEl.textContent = "";

                mediaRecorder = new MediaRecorder(stream);
                recorderMimeType = mediaRecorder.mimeType;
                audioChunks = [];

                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    stream.getTracks().forEach(track => track.stop());

                    if(audioChunks.length > 0) {
                        const audioBlob = new Blob(audioChunks, { type: recorderMimeType || 'audio/webm' });
                        recordedAudioURL = URL.createObjectURL(audioBlob);
                        listenToRecordingButton.disabled = false;

                        const randomMatch = Math.floor(Math.random() * (95 - 70 + 1)) + 70;
                        if (matchResultEl) matchResultEl.textContent = `${getTranslation('matchResultLabel', 'Match:')} ${randomMatch}% ${getTranslation('simulatedMatch', '(Simulated)')}`;

                    } else {
                        listenToRecordingButton.disabled = true;
                        if (matchResultEl) matchResultEl.textContent = getTranslation('recordingStoppedNoData', "Recording stopped, but no audio data was captured.");
                    }
                };

                mediaRecorder.start();
                isRecording = true;
                recordButtonIcon.textContent = "stop_circle";
                if (recordButtonTextEl) recordButtonTextEl.textContent = getTranslation('stopRecordingButton');
                recordButton.setAttribute("aria-label", getTranslation('ariaStopRecording'));
                recordButton.classList.add("recording");
                if (matchResultEl) matchResultEl.textContent = getTranslation('recordingInProgress', "Recording...");

            } catch (err: any) {
                console.error("Error accessing microphone:", err);
                if (matchResultEl) {
                    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                        matchResultEl.textContent = getTranslation('micPermissionDenied', "Microphone permission denied. Please allow microphone access in your browser settings for this site.");
                    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                         matchResultEl.textContent = getTranslation('noMicFound', "No microphone found. Please connect a microphone and try again.");
                    } else {
                        matchResultEl.textContent = `${getTranslation('micError', "Error accessing microphone:")} ${err.message}`;
                    }
                }
                isRecording = false;
                recordButtonIcon.textContent = "mic";
                 if (recordButtonTextEl) recordButtonTextEl.textContent = getTranslation('recordButton');
                recordButton.setAttribute("aria-label", getTranslation('ariaStartRecording'));
                recordButton.classList.remove("recording");
                listenToRecordingButton.disabled = true;
            }
        } else {
            const errorMsg = getTranslation('micNotSupported', "Microphone recording is not supported in your browser.");
            if (matchResultEl) matchResultEl.textContent = errorMsg;
            else alert(errorMsg);
        }
    }
}

function handleListenToRecording() {
    if (recordedAudioURL) {
        const audio = new Audio(recordedAudioURL);
        audio.play().catch(e => {
            console.error("Error playing recorded audio:", e);
            if (matchResultEl) matchResultEl.textContent = getTranslation('errorPlayingRecording', "Error playing recording.");
        });
    } else {
        if (matchResultEl) matchResultEl.textContent = getTranslation('noRecordingToPlay', "No recording available to play.");
    }
}

function handleNext() {
    currentWordIndex = (currentWordIndex + 1) % ipaPracticeWords.length;
    updatePracticeWordDisplay();
    cleanupRecordedAudio();
    if (matchResultEl) matchResultEl.textContent = "";

    // Stop paragraph speech if it's playing
    window.speechSynthesis.cancel();
    clearParagraphHighlight();
    activeSpeechUtterance = null;


    setTimeout(() => {
        handleListen(); // Listen to new IPA example word
    }, 200);
}

function handleParagraphSpeedChange() {
    if (paragraphSpeedSlider && paragraphSpeedValueEl) {
        currentParagraphSpeed = parseFloat(paragraphSpeedSlider.value);
        paragraphSpeedValueEl.textContent = `${currentParagraphSpeed.toFixed(1)}x`;
        // If speech is active, update its rate (some browsers might not support changing rate mid-speech)
        if (activeSpeechUtterance && window.speechSynthesis.speaking) {
            // To change rate, we might need to stop and restart speech
            // For simplicity, current implementation requires re-clicking "Listen Paragraph"
            // Or, we can try to update it directly, though behavior varies:
            // activeSpeechUtterance.rate = currentParagraphSpeed;
            // Better: cancel and restart
            const speechWasActive = window.speechSynthesis.speaking;
            window.speechSynthesis.cancel(); 
            clearParagraphHighlight();
            if(speechWasActive && currentParagraphText) {
                handleListenParagraph(); // Restart with new speed
            }
        }
    }
}

async function handleLanguageButtonClick(event: MouseEvent) {
    const button = event.currentTarget as HTMLButtonElement;
    const newLang = button.dataset.langCode;
    if (newLang) {
        await setLanguage(newLang);
    }
}


// Event Listeners
listenButton?.addEventListener("click", handleListen);
recordButton?.addEventListener("click", handleRecord);
listenToRecordingButton?.addEventListener("click", handleListenToRecording);
nextButton?.addEventListener("click", handleNext);
newParagraphButton?.addEventListener("click", fetchNewParagraph);
listenParagraphButton?.addEventListener("click", handleListenParagraph);
paragraphSpeedSlider?.addEventListener("input", handleParagraphSpeedChange);

// Initial Setup
document.addEventListener("DOMContentLoaded", async () => {
    // Populate language buttons
    if (languageButtonGroup) {
        supportedLanguages.forEach(lang => {
            const button = document.createElement('button');
            button.classList.add('language-button');
            button.textContent = lang.nativeName || lang.geminiName; // Display native name
            button.dataset.langCode = lang.code;
            // ARIA label will be set in applyTranslations
            button.setAttribute('role', 'menuitemradio');
            button.setAttribute('aria-checked', 'false');
            button.addEventListener("click", handleLanguageButtonClick);
            languageButtonGroup.appendChild(button);
        });
    }
    
    const savedLang = localStorage.getItem('selectedLanguage');
    const browserLang = navigator.language.split('-')[0];
    let initialLang = 'en';

    if (savedLang && supportedLanguages.some(l => l.code === savedLang)) {
        initialLang = savedLang;
    } else if (supportedLanguages.some(l => l.code === browserLang)) {
        initialLang = browserLang;
    }
    
    await setLanguage(initialLang); // This will load translations and update active button

    if ('speechSynthesis' in window && window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
            // Voices might be loaded. This can be used to re-initialize voice selection if needed.
        };
    }
    updatePracticeWordDisplay(); 
    fetchNewParagraph(); 
    listenToRecordingButton.disabled = true;
    if(listenParagraphButton) listenParagraphButton.disabled = true; 
    if(paragraphSpeedSlider && paragraphSpeedValueEl) {
        currentParagraphSpeed = parseFloat(paragraphSpeedSlider.value);
        paragraphSpeedValueEl.textContent = `${currentParagraphSpeed.toFixed(1)}x`;
    }

    if (!process.env.API_KEY) {
        if (newParagraphButton) newParagraphButton.disabled = true;
        if (listenParagraphButton) listenParagraphButton.disabled = true;
    }
});

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable is not set. Please configure it to use Gemini API features.");
}
