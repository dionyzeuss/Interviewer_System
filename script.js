"use strict";

// ==========================================
// 1. INTERVIEW QUESTIONS
// ==========================================

const questions = [
  {
    round: "HR SCREENING",
    category: "INTRODUCTION",
    text: "Good morning. Please introduce yourself and tell me about your educational background.",
    hint: "Tell the interviewer about your IT education, projects, and relevant skills.",
  },
  {
    round: "HR SCREENING",
    category: "MOTIVATION",
    text: "Why are you interested in the IT Service Engineer position at Columbia Technologies, Inc.?",
    hint: "Explain your interest in IT support and your willingness to learn.",
  },
  {
    round: "HR SCREENING",
    category: "ROLE UNDERSTANDING",
    text: "What do you understand about the responsibilities of an IT Service Engineer?",
    hint: "Consider troubleshooting, technical support, maintenance, and helping users.",
  },
  {
    round: "HR SCREENING",
    category: "TECHNICAL BACKGROUND",
    text: "What technical skills can you contribute to our company, even though you are applying for an entry-level position?",
    hint: "Discuss your actual skills, school projects, and tools you have used.",
  },
  {
    round: "HR SCREENING",
    category: "STRENGTHS",
    text: "What are your greatest strengths, and what technical skill are you currently improving?",
    hint: "Be honest and give a concrete example of how you learn.",
  },
  {
    round: "TECHNICAL INTERVIEW",
    category: "COMPUTER FUNDAMENTALS",
    text: "Can you explain the difference between computer hardware and software? Please give examples of each.",
    hint: "Define both terms and give practical examples.",
  },
  {
    round: "TECHNICAL INTERVIEW",
    category: "TROUBLESHOOTING",
    text: "A computer suddenly becomes very slow. Walk me through the steps you would take to troubleshoot it.",
    hint: "Explain how you would investigate the cause instead of immediately replacing parts.",
  },
  {
    round: "TECHNICAL INTERVIEW",
    category: "HARDWARE",
    text: "A computer powers on, but the monitor displays no image. How would you diagnose the problem?",
    hint: "Consider power, monitor connections, display input, and hardware.",
  },
  {
    round: "TECHNICAL INTERVIEW",
    category: "NETWORKING",
    text: "What is an IP address, and why is it important for computers connected to a network?",
    hint: "Explain how devices communicate over a network.",
  },
  {
    round: "TECHNICAL INTERVIEW",
    category: "NETWORK TROUBLESHOOTING",
    text: "A user cannot access the internet, but their coworkers can. What would you check first, and why?",
    hint: "Start with the affected device and narrow down the cause systematically.",
  },
  {
    round: "SITUATIONAL INTERVIEW",
    category: "CUSTOMER SERVICE",
    text: "An employee is frustrated because their computer is not working and they need to finish an urgent task. How would you handle the situation?",
    hint: "Balance empathy, communication, urgency, and technical investigation.",
  },
  {
    round: "SITUATIONAL INTERVIEW",
    category: "PROBLEM SOLVING",
    text: "Suppose you encounter a technical problem you have never seen before. What would you do?",
    hint: "Explain how you research, test safely, document, and seek guidance.",
  },
  {
    round: "SITUATIONAL INTERVIEW",
    category: "ESCALATION",
    text: "What would you do if you could not resolve a technical issue after several troubleshooting attempts?",
    hint: "Explain when to escalate and what information to provide.",
  },
  {
    round: "SITUATIONAL INTERVIEW",
    category: "ADAPTABILITY",
    text: "How would you explain a complicated technical issue to someone who has little knowledge of computers?",
    hint: "Focus on simple language, patience, and checking their understanding.",
  },
  {
    round: "FINAL QUESTIONS",
    category: "CAREER GOALS",
    text: "Why should we hire you, and what are your career goals for the next three years?",
    hint: "Summarize your strengths, learning mindset, and professional goals.",
  },
];

// ==========================================
// 2. GET HTML ELEMENTS
// ==========================================

const $ = (id) => document.getElementById(id);

const welcomeScreen = $("welcomeScreen");
const interviewScreen = $("interviewScreen");
const resultsScreen = $("resultsScreen");

const startBtn = $("startBtn");
const recordBtn = $("recordBtn");
const stopRecordBtn = $("stopRecordBtn");
const nextBtn = $("nextBtn");
const previousBtn = $("previousBtn");
const skipBtn = $("skipBtn");
const replayQuestionBtn = $("replayQuestionBtn");
const stopSpeechBtn = $("stopSpeechBtn");

const questionText = $("questionText");
const questionCategory = $("questionCategory");
const questionHint = $("questionHint");
const roundLabel = $("roundLabel");

const answerAudio = $("answerAudio");
const audioPlayerContainer = $("audioPlayerContainer");

const recordings = new Map();

let currentIndex = 0;
let mediaRecorder = null;
let mediaStream = null;
let audioChunks = [];
let currentAudioUrl = null;
let recordingStartTime = 0;
let recordingInterval = null;
let interviewStartTime = 0;
let interviewInterval = null;
let currentRecordingKey = null;
let lastMimeType = "audio/webm";
let isStartingRecording = false;
let isStoppingRecording = false;

// ==========================================
// 3. FORMAT TIME
// ==========================================

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(remainingSeconds).padStart(2, "0")
  );
}

function elapsedInterviewSeconds() {
  return interviewStartTime
    ? Math.floor((Date.now() - interviewStartTime) / 1000)
    : 0;
}

function showMessage(message, type = "") {
  const element = $("recordingMessage");
  element.textContent = message;
  element.className = "message" + (type ? " " + type : "");
}

// ==========================================
// 4. BROWSER VOICE / TEXT-TO-SPEECH
// ==========================================

function stopSpeech() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  $("speakerStatus").textContent = "READY";
  $("speakerStatus").classList.remove("speaking");
}

function speak(text) {
  stopSpeech();

  if (!("speechSynthesis" in window)) {
    showMessage(
      "Text-to-speech is not supported by this browser. You can still read the questions.",
      "error",
    );
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = "en-US";
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  // Prefer an English voice if one is available.
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find((voice) =>
    voice.lang.toLowerCase().startsWith("en"),
  );

  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  utterance.onstart = () => {
    $("speakerStatus").textContent = "SPEAKING";
    $("speakerStatus").classList.add("speaking");
  };

  utterance.onend = () => {
    $("speakerStatus").textContent = "READY";
    $("speakerStatus").classList.remove("speaking");
  };

  utterance.onerror = () => {
    $("speakerStatus").textContent = "READY";
    $("speakerStatus").classList.remove("speaking");
  };

  window.speechSynthesis.speak(utterance);
}

// ==========================================
// 5. DISPLAY THE CURRENT QUESTION
// ==========================================

function updateQuestion() {
  const question = questions[currentIndex];
  const number = currentIndex + 1;
  const progress = Math.round((number / questions.length) * 100);

  questionText.textContent = question.text;
  questionCategory.textContent = question.category;
  questionHint.textContent = question.hint;
  roundLabel.textContent = `ROUND ${getRoundNumber(currentIndex)} · ${question.round}`;

  $("progressText").textContent = `Question ${number} of ${questions.length}`;

  $("progressPercent").textContent = `${progress}%`;
  $("progressBar").style.width = `${progress}%`;

  $("greetingText").textContent = "Please answer naturally and professionally.";

  previousBtn.disabled = currentIndex === 0;

  stopSpeech();
  showMessage("");

  const savedRecording = recordings.get(currentIndex);

  if (savedRecording) {
    showSavedRecording(savedRecording);
    nextBtn.disabled = false;
  } else {
    clearAudioPlayer();
    resetRecordingDisplay();
    nextBtn.disabled = true;
  }

  // Read the question aloud after the UI has updated.
  window.setTimeout(() => {
    if (!interviewScreen.hidden) {
      speak(question.text);
    }
  }, 350);
}

function getRoundNumber(index) {
  if (index <= 4) return 1;
  if (index <= 9) return 2;
  return 3;
}

// ==========================================
// 6. START THE INTERVIEW
// ==========================================

startBtn.addEventListener("click", () => {
  const candidateName = $("candidateName").value.trim();

  if (!candidateName) {
    $("candidateName").focus();
    alert("Please enter your full name before starting.");
    return;
  }

  if (
    !("mediaDevices" in navigator) ||
    !navigator.mediaDevices.getUserMedia ||
    !window.MediaRecorder
  ) {
    alert(
      "Your browser does not support the required recording features. " +
        "Please use a recent version of Chrome or Edge and open this page " +
        "through VS Code Live Server or localhost.",
    );
    return;
  }

  $("resultsGreeting").textContent = "";
  welcomeScreen.hidden = true;
  resultsScreen.hidden = true;
  interviewScreen.hidden = false;

  interviewStartTime = Date.now();

  interviewInterval = window.setInterval(() => {
    $("elapsedTime").textContent = formatTime(elapsedInterviewSeconds());
  }, 1000);

  updateQuestion();
});

// ==========================================
// 7. MICROPHONE AND AUDIO RECORDING
// ==========================================

function chooseMimeType() {
  if (!window.MediaRecorder.isTypeSupported) {
    return "";
  }

  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

  return types.find((type) => window.MediaRecorder.isTypeSupported(type)) || "";
}

async function startRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    return;
  }

  if (isStartingRecording || isStoppingRecording) {
    return;
  }

  isStartingRecording = true;
  recordBtn.disabled = true;
  showMessage("Requesting microphone access...");

  try {
    stopSpeech();

    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const mimeType = chooseMimeType();

    mediaRecorder = mimeType
      ? new MediaRecorder(mediaStream, { mimeType })
      : new MediaRecorder(mediaStream);

    lastMimeType = mediaRecorder.mimeType || mimeType || "audio/webm";
    audioChunks = [];
    currentRecordingKey = currentIndex;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onerror = () => {
      showMessage("A recording error occurred. Please try again.", "error");
    };

    mediaRecorder.onstop = () => {
      const chunks = audioChunks.slice();
      audioChunks = [];

      // Release the microphone as soon as recording finishes.
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        mediaStream = null;
      }

      const wasCancelled = mediaRecorder?.cancelled === true;
      const key = currentRecordingKey;
      currentRecordingKey = null;

      isStoppingRecording = false;
      $("recordingStatus").classList.remove("active");
      $("recordingStatusText").textContent = "Not recording";
      $("micIcon").classList.remove("recording");
      $("recordingTitle").textContent = "Recording finished";
      $("recordingDescription").textContent =
        "You can replay your response or record it again.";

      recordBtn.disabled = false;
      stopRecordBtn.disabled = true;

      if (wasCancelled) {
        showMessage("Recording cancelled.", "");
        return;
      }

      if (!chunks.length || (!key && key !== 0)) {
        showMessage("No audio was captured. Please try again.", "error");
        return;
      }

      const blob = new Blob(chunks, { type: lastMimeType });

      if (!blob.size) {
        showMessage("The recording is empty. Please try again.", "error");
        return;
      }

      const previousRecording = recordings.get(key);

      if (previousRecording?.url) {
        URL.revokeObjectURL(previousRecording.url);
      }

      const recording = {
        blob,
        url: URL.createObjectURL(blob),
        mimeType: lastMimeType,
        duration: Math.max(
          0,
          Math.round((Date.now() - recordingStartTime) / 1000),
        ),
        question: questions[key].text,
      };

      recordings.set(key, recording);

      if (key === currentIndex) {
        showSavedRecording(recording);
        nextBtn.disabled = false;
      }

      showMessage(
        "Answer saved for this session. Replay it or continue when ready.",
        "success",
      );

      mediaRecorder = null;
    };

    mediaRecorder.start(250);

    recordingStartTime = Date.now();
    isStartingRecording = false;

    $("recordingStatus").classList.add("active");
    $("recordingStatusText").textContent = "Recording";
    $("micIcon").classList.add("recording");
    $("recordingTitle").textContent = "Recording your answer...";
    $("recordingDescription").textContent =
      "Speak clearly. Press Stop recording when you finish.";

    recordBtn.disabled = true;
    stopRecordBtn.disabled = false;
    nextBtn.disabled = true;

    recordingInterval = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - recordingStartTime) / 1000);

      $("recordingTimer").textContent = formatTime(seconds);
    }, 250);

    showMessage("Recording in progress...");
  } catch (error) {
    isStartingRecording = false;
    recordBtn.disabled = false;

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }

    if (
      error.name === "NotAllowedError" ||
      error.name === "PermissionDeniedError"
    ) {
      showMessage(
        "Microphone permission was denied. Allow microphone access in your browser settings.",
        "error",
      );
    } else if (error.name === "NotFoundError") {
      showMessage("No microphone was found on this device.", "error");
    } else {
      showMessage(
        "Unable to start recording. Check your microphone and try again.",
        "error",
      );
    }

    console.error("Recording error:", error);
  }
}

function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    return;
  }

  if (isStoppingRecording) return;

  isStoppingRecording = true;

  if (recordingInterval) {
    clearInterval(recordingInterval);
    recordingInterval = null;
  }

  $("recordingTimer").textContent = formatTime(
    Math.floor((Date.now() - recordingStartTime) / 1000),
  );

  stopRecordBtn.disabled = true;
  showMessage("Saving your recording...");

  mediaRecorder.stop();
}

function showSavedRecording(recording) {
  clearAudioPlayer();

  currentAudioUrl = recording.url;
  answerAudio.src = recording.url;
  audioPlayerContainer.hidden = false;

  $("recordingTimer").textContent = formatTime(recording.duration);
  $("recordingTitle").textContent = "Your answer is saved";
  $("recordingDescription").textContent =
    "Listen to your response before continuing.";

  recordBtn.disabled = false;
  stopRecordBtn.disabled = true;
  nextBtn.disabled = false;
}

function resetRecordingDisplay() {
  $("recordingTimer").textContent = "00:00";
  $("recordingTitle").textContent = "Ready when you are";
  $("recordingDescription").textContent =
    "Press the button below and answer in your own words.";

  $("recordingStatus").classList.remove("active");
  $("recordingStatusText").textContent = "Not recording";
  $("micIcon").classList.remove("recording");

  recordBtn.disabled = false;
  stopRecordBtn.disabled = true;
}

function clearAudioPlayer() {
  answerAudio.pause();
  answerAudio.removeAttribute("src");
  answerAudio.load();

  audioPlayerContainer.hidden = true;
  currentAudioUrl = null;
}

recordBtn.addEventListener("click", startRecording);
stopRecordBtn.addEventListener("click", stopRecording);

// ==========================================
// 8. QUESTION NAVIGATION
// ==========================================

function isRecording() {
  return (
    isStartingRecording ||
    isStoppingRecording ||
    (mediaRecorder && mediaRecorder.state !== "inactive")
  );
}

function goToQuestion(index) {
  if (isRecording()) {
    showMessage("Stop the recording before changing questions.", "error");
    return;
  }

  if (index < 0 || index >= questions.length) {
    return;
  }

  currentIndex = index;
  updateQuestion();
}

nextBtn.addEventListener("click", () => {
  if (isRecording()) {
    showMessage("Stop the recording before continuing.", "error");
    return;
  }

  if (!recordings.has(currentIndex)) {
    showMessage("Record an answer or skip this question.", "error");
    return;
  }

  stopSpeech();

  if (currentIndex === questions.length - 1) {
    finishInterview();
  } else {
    goToQuestion(currentIndex + 1);
  }
});

previousBtn.addEventListener("click", () => {
  stopSpeech();
  goToQuestion(currentIndex - 1);
});

skipBtn.addEventListener("click", () => {
  if (isRecording()) {
    showMessage("Stop the recording before skipping.", "error");
    return;
  }

  stopSpeech();

  if (currentIndex === questions.length - 1) {
    finishInterview();
  } else {
    goToQuestion(currentIndex + 1);
  }
});

replayQuestionBtn.addEventListener("click", () => {
  speak(questions[currentIndex].text);
});

stopSpeechBtn.addEventListener("click", stopSpeech);

$("downloadAnswerBtn").addEventListener("click", () => {
  const recording = recordings.get(currentIndex);

  if (recording) {
    downloadRecording(recording, currentIndex);
  }
});

// ==========================================
// 9. DOWNLOAD RECORDINGS
// ==========================================

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadRecording(recording, index) {
  const extension = recording.mimeType.includes("mp4") ? "mp4" : "webm";

  downloadBlob(
    recording.blob,
    `interview-answer-${String(index + 1).padStart(2, "0")}.${extension}`,
  );
}

// ==========================================
// 10. FINISH AND REVIEW THE INTERVIEW
// ==========================================

function finishInterview() {
  if (isRecording()) {
    showMessage("Stop recording before finishing.", "error");
    return;
  }

  stopSpeech();

  if (interviewInterval) {
    clearInterval(interviewInterval);
    interviewInterval = null;
  }

  if (recordingInterval) {
    clearInterval(recordingInterval);
    recordingInterval = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  interviewScreen.hidden = true;
  welcomeScreen.hidden = true;
  resultsScreen.hidden = false;

  const name = $("candidateName").value.trim();
  const completed = recordings.size;
  const skipped = questions.length - completed;
  const duration = formatTime(elapsedInterviewSeconds());

  $("resultsGreeting").textContent =
    `Well done, ${name}. You have completed this practice session. ` +
    "Review your recordings to identify areas for improvement.";

  $("completedCount").textContent = completed;
  $("skippedCount").textContent = skipped;
  $("totalTime").textContent = duration;

  const reviewList = $("reviewList");
  reviewList.replaceChildren();

  questions.forEach((question, index) => {
    const recording = recordings.get(index);
    const item = document.createElement("article");
    item.className = "review-item";

    const title = document.createElement("h3");
    title.textContent = `Question ${index + 1}: ${question.category}`;

    const text = document.createElement("p");
    text.textContent = question.text;

    item.append(title, text);

    if (recording) {
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.preload = "none";
      audio.src = recording.url;

      const downloadLink = document.createElement("a");
      downloadLink.href = recording.url;

      const extension = recording.mimeType.includes("mp4") ? "mp4" : "webm";

      downloadLink.download = `interview-answer-${String(index + 1).padStart(2, "0")}.${extension}`;

      downloadLink.textContent = "Download this recording";

      item.append(audio, downloadLink);
    } else {
      const skippedLabel = document.createElement("p");
      skippedLabel.textContent = "No answer recorded.";
      item.append(skippedLabel);
    }

    reviewList.appendChild(item);
  });
}

// ==========================================
// 11. DOWNLOAD A TEXT SUMMARY
// ==========================================

$("downloadSummaryBtn").addEventListener("click", () => {
  const name = $("candidateName").value.trim();
  const lines = [
    "IT SERVICE ENGINEER MOCK INTERVIEW",
    "Columbia Technologies, Inc. — Practice session",
    `Candidate: ${name}`,
    `Date: ${new Date().toLocaleString()}`,
    `Duration: ${formatTime(elapsedInterviewSeconds())}`,
    `Answers recorded: ${recordings.size}/${questions.length}`,
    "",
    "INTERVIEW QUESTIONS",
    "",
  ];

  questions.forEach((question, index) => {
    const recording = recordings.get(index);

    lines.push(`${index + 1}. [${question.category}] ${question.text}`);
    lines.push(
      recording
        ? `Status: Recorded (${formatTime(recording.duration)})`
        : "Status: Skipped / no recording",
    );
    lines.push("");
  });

  lines.push(
    "Note: This summary tracks recording completion only. " +
      "It does not evaluate answer quality.",
  );

  downloadBlob(
    new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }),
    "IT-Interview-Summary.txt",
  );
});

// ==========================================
// 12. RESTART THE INTERVIEW
// ==========================================

$("restartBtn").addEventListener("click", () => {
  stopSpeech();

  if (interviewInterval) {
    clearInterval(interviewInterval);
    interviewInterval = null;
  }

  if (recordingInterval) {
    clearInterval(recordingInterval);
    recordingInterval = null;
  }

  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.cancelled = true;
    mediaRecorder.stop();
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  if (currentAudioUrl) {
    answerAudio.pause();
  }

  recordings.forEach((recording) => {
    URL.revokeObjectURL(recording.url);
  });

  recordings.clear();
  mediaRecorder = null;
  currentRecordingKey = null;
  audioChunks = [];
  currentIndex = 0;
  interviewStartTime = 0;
  isStartingRecording = false;
  isStoppingRecording = false;

  $("candidateName").value = "";
  $("elapsedTime").textContent = "00:00";

  resultsScreen.hidden = true;
  interviewScreen.hidden = true;
  welcomeScreen.hidden = false;

  resetRecordingDisplay();
  clearAudioPlayer();
  showMessage("");
});

// Load available voices where supported.
if ("speechSynthesis" in window) {
  window.speechSynthesis.getVoices();

  window.speechSynthesis.addEventListener?.("voiceschanged", () =>
    window.speechSynthesis.getVoices(),
  );
}

/* ==========================================
   13. DARK MODE TOGGLE
   ========================================== */

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeLabel = document.getElementById("themeLabel");

const THEME_STORAGE_KEY = "it-interview-simulator-theme";

function applyTheme(theme) {
  const isDark = theme === "dark";

  document.documentElement.dataset.theme = isDark ? "dark" : "light";

  themeIcon.textContent = isDark ? "☀️" : "🌙";
  themeLabel.textContent = isDark ? "Light mode" : "Dark mode";

  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Switch to light mode" : "Switch to dark mode",
  );

  themeToggle.setAttribute("aria-pressed", String(isDark));
}

function getInitialTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }
  } catch (error) {
    console.warn("Theme preference could not be read.", error);
  }

  // Use the operating system's appearance if no preference is saved.
  return window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Apply the initial theme when the app loads.
applyTheme(getInitialTheme());

// Toggle themes when the button is clicked.
themeToggle.addEventListener("click", () => {
  const currentTheme = document.documentElement.dataset.theme || "light";

  const nextTheme = currentTheme === "dark" ? "light" : "dark";

  applyTheme(nextTheme);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch (error) {
    console.warn("Theme preference could not be saved.", error);
  }
});
