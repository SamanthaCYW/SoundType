import { useState, useEffect, useRef, useCallback } from "react";

const SENTENCES = [
  // Greetings & Daily Life
  "How are you doing today",
  "Nice to meet you",
  "What time is it now",
  "I need to go to the store",
  "Can you help me please",
  "The weather is beautiful today",
  "I had a great day at work",
  "Let me think about it",
  "She is reading a book",
  "We are going to the park",
  // Food & Dining
  "I would like a cup of coffee",
  "The food tastes really good",
  "Can I have the check please",
  "We should try that new restaurant",
  "I usually eat breakfast at eight",
  // Travel & Directions
  "Where is the nearest bus stop",
  "How do I get to the airport",
  "Turn left at the next corner",
  "The hotel is across the street",
  "I need a taxi to downtown",
  // Work & Study
  "I have a meeting at three",
  "The project is due next week",
  "She works at a hospital",
  "He is studying for his exam",
  "Please send me the report",
  // Shopping & Money
  "How much does this cost",
  "I am looking for a gift",
  "Do you accept credit cards",
  "The store closes at nine",
  "This shirt is too small",
  // Social & Feelings
  "I really enjoyed the movie",
  "Thank you for your help",
  "I am sorry about that",
  "That sounds like a great idea",
  "I miss my family very much",
  // Nature & Weather
  "It might rain later today",
  "The sunset looks amazing tonight",
  "I love walking in the park",
  "Spring is my favorite season",
  "The mountains are covered with snow",
  // Health
  "I need to see a doctor",
  "Take this medicine after meals",
  "I try to exercise every day",
  "She feels much better now",
  "Drink plenty of water daily",
  // Technology
  "My phone battery is almost dead",
  "Can you send me a message",
  "The internet is very slow today",
  "I forgot my password again",
  "Please charge your phone tonight",
];

const DIFFICULTY_LEVELS = {
  easy: { label: "Easy", blanks: 0.3, description: "30% blanks", color: "#4ade80" },
  medium: { label: "Medium", blanks: 0.5, description: "50% blanks", color: "#fbbf24" },
  hard: { label: "Hard", blanks: 0.7, description: "70% blanks", color: "#f87171" },
  extreme: { label: "Extreme", blanks: 1.0, description: "100% blanks", color: "#c084fc" },
};

const SPEECH_RATES = [
  { value: 0.6, label: "0.6×", description: "Very Slow" },
  { value: 0.8, label: "0.8×", description: "Slow" },
  { value: 1.0, label: "1.0×", description: "Normal" },
  { value: 1.2, label: "1.2×", description: "Fast" },
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickBlanks(words, ratio) {
  const count = Math.max(1, Math.round(words.length * ratio));
  const indices = words.map((_, i) => i);
  const shuffled = shuffleArray(indices);
  return new Set(shuffled.slice(0, count));
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [difficulty, setDifficulty] = useState("medium");
  const [speechRate, setSpeechRate] = useState(1.0);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [words, setWords] = useState([]);
  const [blankIndices, setBlankIndices] = useState(new Set());
  const [userInputs, setUserInputs] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [showHint, setShowHint] = useState({});
  const [streak, setStreak] = useState(0);
  const [animate, setAnimate] = useState(false);
  const inputRefs = useRef({});
  const synthRef = useRef(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  const startPractice = () => {
    const shuffled = shuffleArray(SENTENCES);
    setQueue(shuffled);
    setCurrentIndex(0);
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    loadSentence(shuffled[0]);
    setScreen("practice");
  };

  const loadSentence = (sentence) => {
    const w = sentence.split(" ");
    const blanks = pickBlanks(w, DIFFICULTY_LEVELS[difficulty].blanks);
    setWords(w);
    setBlankIndices(blanks);
    setUserInputs({});
    setSubmitted(false);
    setPlayCount(0);
    setShowHint({});
    setAnimate(true);
    setTimeout(() => setAnimate(false), 600);
  };

  const speak = useCallback(() => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const sentence = queue[currentIndex];
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = "en-US";
    utterance.rate = speechRate;
    utterance.pitch = 1;
    const voices = synthRef.current.getVoices();
    const enVoice = voices.find(
      (v) => v.lang.startsWith("en") && v.name.includes("Google")
    ) || voices.find((v) => v.lang.startsWith("en"));
    if (enVoice) utterance.voice = enVoice;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
    setPlayCount((p) => p + 1);
  }, [queue, currentIndex, speechRate]);

  const handleInput = (index, value) => {
    setUserInputs((prev) => ({ ...prev, [index]: value }));
  };

  const handleKeyDown = (e, index) => {
    const blankList = [...blankIndices].sort((a, b) => a - b);
    const pos = blankList.indexOf(index);
    if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
      e.preventDefault();
      if (pos < blankList.length - 1) {
        inputRefs.current[blankList[pos + 1]]?.focus();
      } else {
        handleSubmit();
      }
    } else if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      if (pos > 0) {
        inputRefs.current[blankList[pos - 1]]?.focus();
      }
    }
  };

  const handleSubmit = () => {
    if (submitted) return;
    let correct = 0;
    blankIndices.forEach((i) => {
      if ((userInputs[i] || "").trim().toLowerCase() === words[i].toLowerCase()) {
        correct++;
      }
    });
    const allCorrect = correct === blankIndices.size;
    setSubmitted(true);
    setScore((prev) => ({
      correct: prev.correct + correct,
      total: prev.total + blankIndices.size,
    }));
    setStreak(allCorrect ? streak + 1 : 0);
  };

  const nextSentence = () => {
    const next = currentIndex + 1;
    if (next < queue.length) {
      setCurrentIndex(next);
      loadSentence(queue[next]);
    } else {
      setScreen("results");
    }
  };

  const getInputStatus = (index) => {
    if (!submitted) return "pending";
    return (userInputs[index] || "").trim().toLowerCase() === words[index].toLowerCase()
      ? "correct"
      : "wrong";
  };

  const revealHint = (index) => {
    setShowHint((prev) => ({ ...prev, [index]: true }));
  };

  const progress = queue.length > 0 ? ((currentIndex + (submitted ? 1 : 0)) / queue.length) * 100 : 0;
  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  // ─── HOME SCREEN ───
  if (screen === "home") {
    return (
      <div style={styles.container}>
        <div style={styles.homeCard}>
          <div style={styles.logoArea}>
            <div style={styles.logoIcon}>🎧</div>
            <h1 style={styles.title}>SoundType</h1>
            <p style={styles.subtitle}>
              Sharpen your English listening &amp; spelling skills
            </p>
          </div>

          <div style={styles.settingsSection}>
            <label style={styles.settingLabel}>Difficulty</label>
            <div style={styles.difficultyRow}>
              {Object.entries(DIFFICULTY_LEVELS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setDifficulty(key)}
                  style={{
                    ...styles.difficultyBtn,
                    background: difficulty === key ? val.color : "rgba(255,255,255,0.06)",
                    color: difficulty === key ? "#111" : "rgba(255,255,255,0.5)",
                    fontWeight: difficulty === key ? 700 : 500,
                    boxShadow: difficulty === key ? `0 4px 20px ${val.color}44` : "none",
                    transform: difficulty === key ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  <span style={{ fontSize: 13 }}>{val.label}</span>
                  <span style={{ fontSize: 10, opacity: 0.8 }}>{val.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={styles.settingsSection}>
            <label style={styles.settingLabel}>Speech Speed</label>
            <div style={styles.speedRow}>
              {SPEECH_RATES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setSpeechRate(r.value)}
                  style={{
                    ...styles.speedBtn,
                    background:
                      speechRate === r.value
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(255,255,255,0.04)",
                    color:
                      speechRate === r.value
                        ? "#fff"
                        : "rgba(255,255,255,0.4)",
                    borderColor:
                      speechRate === r.value
                        ? "rgba(255,255,255,0.3)"
                        : "rgba(255,255,255,0.08)",
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={startPractice} style={styles.startBtn}>
            Start Practice
            <span style={{ marginLeft: 8 }}>→</span>
          </button>

          <p style={styles.footerNote}>
            {SENTENCES.length} sentences · Uses browser speech synthesis
          </p>
        </div>
      </div>
    );
  }

  // ─── RESULTS SCREEN ───
  if (screen === "results") {
    const grade =
      accuracy >= 90
        ? { emoji: "🏆", text: "Outstanding!", color: "#4ade80" }
        : accuracy >= 70
        ? { emoji: "🌟", text: "Great job!", color: "#fbbf24" }
        : accuracy >= 50
        ? { emoji: "💪", text: "Keep going!", color: "#fb923c" }
        : { emoji: "📚", text: "Keep practicing!", color: "#f87171" };

    return (
      <div style={styles.container}>
        <div style={styles.resultsCard}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>{grade.emoji}</div>
          <h2 style={{ ...styles.resultsTitle, color: grade.color }}>
            {grade.text}
          </h2>
          <div style={styles.statGrid}>
            <div style={styles.statBox}>
              <div style={styles.statNum}>{score.correct}</div>
              <div style={styles.statLabel}>Correct</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statNum}>{score.total}</div>
              <div style={styles.statLabel}>Total Blanks</div>
            </div>
            <div style={styles.statBox}>
              <div style={{ ...styles.statNum, color: grade.color }}>{accuracy}%</div>
              <div style={styles.statLabel}>Accuracy</div>
            </div>
          </div>
          <div style={styles.resultsBtnRow}>
            <button onClick={startPractice} style={styles.retryBtn}>
              Try Again
            </button>
            <button onClick={() => setScreen("home")} style={styles.homeBtn}>
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── PRACTICE SCREEN ───
  const blankList = [...blankIndices].sort((a, b) => a - b);
  const allFilled = blankList.every((i) => (userInputs[i] || "").trim().length > 0);

  return (
    <div style={styles.container}>
      <div style={styles.practiceWrapper}>
        {/* Top Bar */}
        <div style={styles.topBar}>
          <button onClick={() => setScreen("home")} style={styles.backBtn}>
            ← Back
          </button>
          <div style={styles.progressInfo}>
            <span style={styles.progressText}>
              {currentIndex + 1} / {queue.length}
            </span>
            {streak >= 2 && (
              <span style={styles.streakBadge}>🔥 {streak} streak</span>
            )}
          </div>
          <div style={styles.accuracyBadge}>
            {accuracy}%
          </div>
        </div>

        {/* Progress Bar */}
        <div style={styles.progressBarTrack}>
          <div
            style={{ ...styles.progressBarFill, width: `${progress}%` }}
          />
        </div>

        {/* Main Card */}
        <div
          style={{
            ...styles.sentenceCard,
            opacity: animate ? 0 : 1,
            transform: animate ? "translateY(12px)" : "translateY(0)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
          }}
        >
          {/* Play Button */}
          <div style={styles.playSection}>
            <button
              onClick={speak}
              disabled={isSpeaking}
              style={{
                ...styles.playBtn,
                transform: isSpeaking ? "scale(1.08)" : "scale(1)",
                boxShadow: isSpeaking
                  ? "0 0 30px rgba(99,102,241,0.5)"
                  : "0 4px 20px rgba(99,102,241,0.3)",
              }}
            >
              <span style={{ fontSize: 28 }}>{isSpeaking ? "🔊" : "▶"}</span>
            </button>
            <div style={styles.playHints}>
              <span style={styles.playLabel}>
                {playCount === 0
                  ? "Tap to listen"
                  : isSpeaking
                  ? "Playing..."
                  : "Tap to replay"}
              </span>
              <span style={styles.playCountLabel}>
                Played {playCount} {playCount === 1 ? "time" : "times"} · Speed: {speechRate}×
              </span>
            </div>
          </div>

          {/* Sentence with blanks */}
          <div style={styles.sentenceArea}>
            {words.map((word, i) => {
              if (!blankIndices.has(i)) {
                return (
                  <span key={i} style={styles.givenWord}>
                    {word}
                  </span>
                );
              }
              const status = getInputStatus(i);
              const inputWidth = Math.max(60, word.length * 14 + 24);
              return (
                <span key={i} style={styles.blankWrapper}>
                  <input
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    value={userInputs[i] || ""}
                    onChange={(e) => handleInput(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    disabled={submitted}
                    placeholder="?"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    style={{
                      ...styles.blankInput,
                      width: inputWidth,
                      borderColor:
                        status === "correct"
                          ? "#4ade80"
                          : status === "wrong"
                          ? "#f87171"
                          : userInputs[i]
                          ? "rgba(99,102,241,0.6)"
                          : "rgba(255,255,255,0.15)",
                      background:
                        status === "correct"
                          ? "rgba(74,222,128,0.1)"
                          : status === "wrong"
                          ? "rgba(248,113,113,0.1)"
                          : "rgba(255,255,255,0.04)",
                      color:
                        status === "correct"
                          ? "#4ade80"
                          : status === "wrong"
                          ? "#f87171"
                          : "#fff",
                    }}
                  />
                  {submitted && status === "wrong" && (
                    <div style={styles.correction}>{word}</div>
                  )}
                  {!submitted && !showHint[i] && (
                    <button
                      onClick={() => revealHint(i)}
                      style={styles.hintBtn}
                      title="Show first letter"
                    >
                      ?
                    </button>
                  )}
                  {!submitted && showHint[i] && (
                    <div style={styles.hintText}>
                      {word[0]}{"_".repeat(word.length - 1)} ({word.length} letters)
                    </div>
                  )}
                </span>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div style={styles.actionRow}>
            {!submitted ? (
              <button
                onClick={handleSubmit}
                disabled={!allFilled}
                style={{
                  ...styles.submitBtn,
                  opacity: allFilled ? 1 : 0.4,
                  cursor: allFilled ? "pointer" : "not-allowed",
                }}
              >
                Check Answers ✓
              </button>
            ) : (
              <div style={styles.postSubmitRow}>
                <div style={styles.roundResult}>
                  {blankList.filter((i) => getInputStatus(i) === "correct").length} / {blankList.length} correct
                </div>
                <button onClick={nextSentence} style={styles.nextBtn}>
                  {currentIndex + 1 < queue.length ? "Next Sentence →" : "See Results →"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Keyboard tip */}
        <p style={styles.keyboardTip}>
          Press <kbd style={styles.kbd}>Tab</kbd> to move between blanks · <kbd style={styles.kbd}>Enter</kbd> to submit
        </p>
      </div>
    </div>
  );
}

// ─── STYLES ───

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(145deg, #0f0f1a 0%, #1a1a2e 40%, #16213e 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "'Outfit', 'Segoe UI', system-ui, sans-serif",
    boxSizing: "border-box",
  },
  // HOME
  homeCard: {
    maxWidth: 480,
    width: "100%",
    textAlign: "center",
    padding: "48px 32px 36px",
  },
  logoArea: { marginBottom: 40 },
  logoIcon: {
    fontSize: 56,
    marginBottom: 12,
    filter: "drop-shadow(0 4px 12px rgba(99,102,241,0.4))",
  },
  title: {
    fontSize: 42,
    fontWeight: 800,
    color: "#fff",
    margin: "0 0 8px",
    letterSpacing: "-1.5px",
    fontFamily: "'Outfit', sans-serif",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.45)",
    margin: 0,
    fontWeight: 400,
    letterSpacing: "0.5px",
  },
  settingsSection: { marginBottom: 28, textAlign: "left" },
  settingLabel: {
    display: "block",
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    marginBottom: 10,
  },
  difficultyRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
  },
  difficultyBtn: {
    border: "none",
    borderRadius: 10,
    padding: "12px 6px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    transition: "all 0.25s ease",
    fontFamily: "inherit",
  },
  speedRow: { display: "flex", gap: 8 },
  speedBtn: {
    flex: 1,
    border: "1px solid",
    borderRadius: 10,
    padding: "10px 0",
    cursor: "pointer",
    background: "transparent",
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.2s ease",
    fontFamily: "inherit",
  },
  startBtn: {
    width: "100%",
    padding: "16px",
    fontSize: 17,
    fontWeight: 700,
    border: "none",
    borderRadius: 14,
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    cursor: "pointer",
    marginTop: 12,
    letterSpacing: "0.3px",
    boxShadow: "0 6px 30px rgba(99,102,241,0.35)",
    transition: "transform 0.2s, box-shadow 0.2s",
    fontFamily: "inherit",
  },
  footerNote: {
    fontSize: 12,
    color: "rgba(255,255,255,0.25)",
    marginTop: 20,
  },
  // PRACTICE
  practiceWrapper: {
    maxWidth: 640,
    width: "100%",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    cursor: "pointer",
    padding: "6px 0",
    fontFamily: "inherit",
  },
  progressInfo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  progressText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: 600,
  },
  streakBadge: {
    background: "rgba(251,191,36,0.15)",
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 20,
  },
  accuracyBadge: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: 600,
  },
  progressBarTrack: {
    height: 3,
    background: "rgba(255,255,255,0.08)",
    borderRadius: 2,
    marginBottom: 28,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
    borderRadius: 2,
    transition: "width 0.5s ease",
  },
  sentenceCard: {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(20px)",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.07)",
    padding: "32px 28px",
  },
  playSection: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 28,
  },
  playBtn: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    flexShrink: 0,
  },
  playHints: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  playLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
  },
  playCountLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
  },
  sentenceArea: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: "10px 8px",
    marginBottom: 28,
    lineHeight: 2.2,
  },
  givenWord: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 18,
    fontWeight: 500,
    padding: "4px 0",
  },
  blankWrapper: {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
  },
  blankInput: {
    border: "1.5px solid rgba(255,255,255,0.15)",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 17,
    fontWeight: 600,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    textAlign: "center",
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
    letterSpacing: "0.5px",
  },
  correction: {
    fontSize: 12,
    color: "#4ade80",
    fontWeight: 600,
    marginTop: 4,
    fontFamily: "'JetBrains Mono', monospace",
  },
  hintBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
  },
  hintText: {
    fontSize: 11,
    color: "rgba(251,191,36,0.7)",
    marginTop: 3,
    fontFamily: "'JetBrains Mono', monospace",
  },
  actionRow: { textAlign: "center" },
  submitBtn: {
    padding: "14px 40px",
    fontSize: 16,
    fontWeight: 700,
    border: "none",
    borderRadius: 12,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
    fontFamily: "inherit",
  },
  postSubmitRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  roundResult: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
    fontWeight: 600,
  },
  nextBtn: {
    padding: "12px 28px",
    fontSize: 15,
    fontWeight: 700,
    border: "none",
    borderRadius: 12,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
  },
  keyboardTip: {
    textAlign: "center",
    color: "rgba(255,255,255,0.2)",
    fontSize: 12,
    marginTop: 20,
  },
  kbd: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 4,
    padding: "1px 6px",
    fontSize: 11,
    fontFamily: "monospace",
  },
  // RESULTS
  resultsCard: {
    maxWidth: 420,
    width: "100%",
    textAlign: "center",
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(20px)",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.07)",
    padding: "48px 36px",
  },
  resultsTitle: {
    fontSize: 32,
    fontWeight: 800,
    margin: "0 0 32px",
    letterSpacing: "-0.5px",
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    marginBottom: 36,
  },
  statBox: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: "18px 8px",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  statNum: {
    fontSize: 28,
    fontWeight: 800,
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontWeight: 600,
  },
  resultsBtnRow: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
  },
  retryBtn: {
    padding: "14px 32px",
    fontSize: 15,
    fontWeight: 700,
    border: "none",
    borderRadius: 12,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
  },
  homeBtn: {
    padding: "14px 32px",
    fontSize: 15,
    fontWeight: 700,
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.7)",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
