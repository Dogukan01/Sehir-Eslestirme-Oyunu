import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { normalizeText } from './utils/normalization';
import './index.css';

function App() {
  const [allCities, setAllCities] = useState([]);
  const [unfoundCities, setUnfoundCities] = useState([]);
  const [foundCities, setFoundCities] = useState([]);
  const [currentPlateTarget, setCurrentPlateTarget] = useState(null);

  const [inputValue, setInputValue] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300 seconds)
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'playing' | 'finished'
  const [flashAnimation, setFlashAnimation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const inputRef = useRef(null);

  // 1. Fetch cities on initial load
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5001/api/cities');
        setAllCities(response.data);
        setError(null);
      } catch (err) {
        console.error("Şehir verileri çekilemedi:", err);
        setError("API sunucusuna bağlanılamadı. Lütfen backend'in çalıştığından ve 5001 portunun açık olduğundan emin olun.");
      } finally {
        setLoading(false);
      }
    };
    fetchCities();
  }, []);

  // 2. Timer logic
  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      endGame();
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // Start the game
  const startGame = () => {
    setFoundCities([]);
    setUnfoundCities([...allCities]);
    setTimeLeft(300); // 5 minutes
    setGameState('playing');
    setInputValue('');
    pickRandomPlate([...allCities]);

    // Auto focus on input after starting
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };

  const endGame = () => {
    setGameState('finished');
  };

  // Pick a random plate from available pool
  const pickRandomPlate = (pool) => {
    if (pool.length === 0) return;
    const randomIndex = Math.floor(Math.random() * pool.length);
    setCurrentPlateTarget(pool[randomIndex]);
  };

  // 3. Handle input changes and instant check
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    if (gameState !== 'playing' || !currentPlateTarget) return;

    const normalizedInput = normalizeText(value);
    const normalizedTarget = normalizeText(currentPlateTarget.city);

    // Alternatif kabul listesi (Büyük-küçük harften ve Türkçe karakterlerden arındırılmış halleri)
    const synonyms = {
      "mersin": ["icel"],
      "afyonkarahisar": ["afyon"],
      "sanliurfa": ["urfa"],
      "kahramanmaras": ["maras"],
      "kocaeli": ["izmit"],
      "sakarya": ["adapazari"],
      "gaziantep": ["antep"],
      "hatay": ["antakya"]
    };

    const isMatch = normalizedInput === normalizedTarget ||
      (synonyms[normalizedTarget] && synonyms[normalizedTarget].includes(normalizedInput));

    // Anlık kontrol: eşleşme var mı?
    if (isMatch) {
      // Doğru cevap!

      // Animasyonu tetikle
      setFlashAnimation(true);
      setTimeout(() => setFlashAnimation(false), 300);

      // Skoru artır, bulunanlara ekle
      const newFoundCities = [currentPlateTarget, ...foundCities];
      setFoundCities(newFoundCities);

      // Kalan şehirlerden çıkar
      const remainingCities = unfoundCities.filter(c => c.plate !== currentPlateTarget.plate);
      setUnfoundCities(remainingCities);

      // Inputu temizle
      setInputValue('');

      if (remainingCities.length === 0) {
        // Tüm iller bulundu!
        endGame();
      } else {
        // Yeni bir plaka seç
        pickRandomPlate(remainingCities);
      }
    }
  };

  // Pas geçme fonksiyonu
  const passCity = () => {
    if (unfoundCities.length > 1) {
      let nextTarget;
      // Aynı plakanın üst üste gelmemesini sağla
      do {
        const randomIndex = Math.floor(Math.random() * unfoundCities.length);
        nextTarget = unfoundCities[randomIndex];
      } while (nextTarget.plate === currentPlateTarget.plate);

      setCurrentPlateTarget(nextTarget);
      setInputValue('');
      if (inputRef.current) inputRef.current.focus();
    }
  };

  // Format time (MM:SS)
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Plaka Eşleştirme Oyunu</h1>
        <p>81 ili ne kadar hızlı bulabilirsin?</p>
      </header>

      <main className="main-content">
        {/* Game Area */}
        <section className={`game-card ${flashAnimation ? 'flash-correct' : ''}`}>

          <div className="stats-row">
            <div className="stat-box timer">
              <span>Süre</span>
              <h2>{formatTime(timeLeft)}</h2>
            </div>
            <div className="stat-box score">
              <span>Skor</span>
              <h2>{foundCities.length} / {allCities.length}</h2>
            </div>
          </div>

          {loading ? (
            <div className="center-action">
              <p>Şehirler yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="center-action error-text" style={{ color: 'var(--error)', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
              <p>{error}</p>
            </div>
          ) : gameState === 'idle' && (
            <div className="center-action">
              <button className="btn-primary" onClick={startGame}>Oyuna Başla</button>
            </div>
          )}

          {gameState === 'playing' && currentPlateTarget && (
            <div className="play-area">
              <div className="plate-display">
                <span className="tr-badge">TR</span>
                <span className="plate-number">{currentPlateTarget.plate}</span>
              </div>
              <div className="input-group">
                <input
                  ref={inputRef}
                  type="text"
                  className="city-input"
                  placeholder="Şehir adı giriniz..."
                  value={inputValue}
                  onChange={handleInputChange}
                  autoFocus
                  autoComplete="off"
                />
                <div className="button-group">
                  {unfoundCities.length > 1 && (
                    <button className="btn-secondary" onClick={passCity} title="Bu şehri atla">Pas Geç</button>
                  )}
                  <button className="btn-danger" onClick={endGame} title="Oyunu bitir ve sonuçları gör">Oyunu Bitir</button>
                </div>
              </div>
            </div>
          )}

          {gameState === 'finished' && (
            <div className="center-action end-screen">
              <h2>Süre Doldu!</h2>
              <p>Toplam Skor: {foundCities.length} / {allCities.length}</p>
              <button className="btn-primary" onClick={startGame}>Tekrar Oyna</button>
            </div>
          )}
        </section>

        {/* Fixed Cities Grid Table */}
        <section className="grid-section">
          <h3>Şehir Tablosu ({foundCities.length} / {allCities.length})</h3>
          <div className="cities-grid">
            {allCities.map(cityObj => {
              // Şehir bulundu mu?
              const isFound = foundCities.some(c => c.plate === cityObj.plate);
              const isGameFinished = gameState === 'finished';

              let cellClass = "grid-cell";
              let displayText = "";

              if (isFound) {
                cellClass += " cell-found";
                displayText = cityObj.city.toUpperCase();
              } else if (isGameFinished) {
                cellClass += " cell-missed";
                displayText = cityObj.city.toUpperCase();
              } else {
                cellClass += " cell-empty";
                displayText = ""; // Boş bırak
              }

              return (
                <div key={cityObj.plate} className={cellClass}>
                  <span className="cell-plate">{cityObj.plate}</span>
                  <span className="cell-name">{displayText}</span>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
