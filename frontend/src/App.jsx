import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { normalizeText } from './utils/normalization';
import TurkeyMap from './TurkeyMap';
import './index.css';

function App() {
  const [allCities, setAllCities] = useState([]);
  const [unfoundCities, setUnfoundCities] = useState([]);
  const [foundCities, setFoundCities] = useState([]);
  const [currentPlateTarget, setCurrentPlateTarget] = useState(null);
  
  const [inputValue, setInputValue] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'playing' | 'finished'
  const [gameMode, setGameMode] = useState('sequential'); // 'sequential' | 'random' | 'map'
  const [flashState, setFlashState] = useState(null); // null | 'correct' | 'incorrect'
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
    
    // Mod seçimine göre başlangıç hedefini belirle
    if (gameMode === 'sequential') {
      setCurrentPlateTarget(allCities[0]);
    } else {
      // Rastgele mod veya Harita eşleştirme modu
      pickRandomPlate([...allCities]);
    }
    
    // Auto focus on input after starting (harita modunda input olmadığı için fokuslama yapma)
    if (gameMode !== 'map') {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
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

  // Doğru cevap verildiğinde ortak tetiklenecek fonksiyon
  const handleCorrectAnswer = (target = currentPlateTarget, currentFound = foundCities, currentUnfound = unfoundCities) => {
    // Animasyonu tetikle
    setFlashState('correct');
    setTimeout(() => setFlashState(null), 300);

    // Skoru artır, bulunanlara ekle
    const newFoundCities = [target, ...currentFound];
    setFoundCities(newFoundCities);

    // Kalan şehirlerden çıkar
    const remainingCities = currentUnfound.filter(c => c.plate !== target.plate);
    setUnfoundCities(remainingCities);

    // Inputu temizle
    setInputValue('');

    if (remainingCities.length === 0) {
      // Tüm iller bulundu!
      endGame();
    } else {
      // Yeni bir plaka seç
      if (gameMode === 'sequential') {
        // Sıralı modda bir sonraki bulunmamış plakayı bul
        const nextSequential = allCities.find(c => !newFoundCities.some(fc => fc.plate === c.plate));
        setCurrentPlateTarget(nextSequential);
      } else {
        // Rastgele veya Harita modunda yeni rastgele seç
        pickRandomPlate(remainingCities);
      }
    }
  };

  // 3. Handle input changes and instant check (for sequential & random mode)
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    if (gameState !== 'playing' || !currentPlateTarget || gameMode === 'map') return;

    const normalizedInput = normalizeText(value);
    const normalizedTarget = normalizeText(currentPlateTarget.city);

    // Alternatif kabul listesi
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

    if (isMatch) {
      handleCorrectAnswer();
    }
  };

  // Pas geçme fonksiyonu (Rastgele veya Harita modunda kullanılabilir)
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
      if (gameMode !== 'map' && inputRef.current) inputRef.current.focus();
    }
  };

  // Haritadan bir şehre tıklandığında tetiklenen fonksiyon
  const handleMapCityClick = (plate, cityName) => {
    if (gameState !== 'playing') return;

    if (gameMode === 'map') {
      // Harita Eşleştirme Modu: Tıklanan şehir doğru plaka mı?
      if (plate === currentPlateTarget.plate) {
        handleCorrectAnswer();
      } else {
        // Hatalı tıklandıysa kırmızı flash animasyonu tetikle
        setFlashState('incorrect');
        setTimeout(() => setFlashState(null), 300);
      }
    } else if (gameMode === 'sequential') {
      // Sıralı Modu: Tablodan/Haritadan tıklanan numarayı aktif hedef yap
      const clickedCity = allCities.find(c => c.plate === plate);
      const isAlreadyFound = foundCities.some(c => c.plate === plate);

      if (clickedCity && !isAlreadyFound) {
        setCurrentPlateTarget(clickedCity);
        setInputValue('');
        setTimeout(() => {
          if (inputRef.current) inputRef.current.focus();
        }, 50);
      }
    }
  };

  // Grid hücresine tıklandığında tetiklenen fonksiyon
  const handleGridCellClick = (cityObj) => {
    if (gameState !== 'playing' || gameMode !== 'sequential') return;

    // Zaten bulunmuşsa tıklanamaz
    const isAlreadyFound = foundCities.some(c => c.plate === cityObj.plate);
    if (isAlreadyFound) return;

    // Aktif hedef yap
    setCurrentPlateTarget(cityObj);
    setInputValue('');
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 50);
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
        <div className="header-logo-container">
          <div className="header-plate-logo">
            <span className="logo-tr">TR</span>
            <span className="logo-number">81</span>
          </div>
          <h1>PlakaTahmin</h1>
        </div>
        <p>Türkiye Şehir - Plaka Eşleştirme Oyunu</p>
      </header>

      <main className="main-content">
        {/* Game Area */}
        <section className={`game-card ${flashState === 'correct' ? 'flash-correct' : flashState === 'incorrect' ? 'flash-incorrect' : ''}`}>
          
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
              <div className="mode-selector-container">
                <p className="mode-title">Oyun Modunu Seçin:</p>
                <div className="mode-buttons">
                  <button 
                    className={`btn-mode ${gameMode === 'sequential' ? 'active' : ''}`}
                    onClick={() => setGameMode('sequential')}
                  >
                    Sıralı Mod (01 - 81)
                  </button>
                  <button 
                    className={`btn-mode ${gameMode === 'random' ? 'active' : ''}`}
                    onClick={() => setGameMode('random')}
                  >
                    Rastgele Mod
                  </button>
                  <button 
                    className={`btn-mode ${gameMode === 'map' ? 'active' : ''}`}
                    onClick={() => setGameMode('map')}
                  >
                    Harita Eşleştirme
                  </button>
                </div>
                <div className="mode-info">
                  {gameMode === 'sequential' && "01'den başlayarak sırayla tahmin edin. İstediğiniz plakaya tablodan/haritadan tıklayarak da geçiş yapabilirsiniz."}
                  {gameMode === 'random' && "Rastgele gelen plakaları tahmin edin. Zorlandıklarınızı pas geçip sonra yanıtlayabilirsiniz."}
                  {gameMode === 'map' && "Gelen plakanın hangi ile ait olduğunu harita üzerinden bulup üzerine tıklayın!"}
                </div>
              </div>
              <button className="btn-primary" onClick={startGame} style={{ marginTop: '1.5rem' }}>Oyuna Başla</button>
            </div>
          )}

          {gameState === 'playing' && currentPlateTarget && (
            <div className="play-area">
              <div className="plate-display">
                <span className="tr-badge">TR</span>
                <span className="plate-number">{currentPlateTarget.plate}</span>
              </div>
              
              {gameMode === 'map' ? (
                <div className="map-mode-hint">
                  <p>Bu plaka koduna sahip şehri <strong>harita üzerinde tıklayarak</strong> bulun!</p>
                  <div className="button-group" style={{ marginTop: '1rem' }}>
                    <button className="btn-secondary" onClick={passCity} title="Bu şehri atla">Pas Geç</button>
                    <button className="btn-danger" onClick={endGame} title="Oyunu bitir ve sonuçları gör">Oyunu Bitir</button>
                  </div>
                </div>
              ) : (
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
              )}
            </div>
          )}

          {gameState === 'finished' && (
            <div className="center-action end-screen">
              <h2>Oyun Bitti!</h2>
              <p>Mod: {gameMode === 'sequential' ? 'Sıralı Mod' : gameMode === 'random' ? 'Rastgele Mod' : 'Harita Eşleştirme'}</p>
              <p className="final-score">Toplam Skor: {foundCities.length} / {allCities.length}</p>
              <button className="btn-primary" onClick={startGame}>Tekrar Oyna</button>
              <button className="btn-secondary" onClick={() => setGameState('idle')} style={{ marginTop: '0.5rem' }}>Ana Menüye Dön</button>
            </div>
          )}
        </section>

        {/* Turkey SVG Map Section (Oyun/Bitiş Durumunda Gösterilir) */}
        {(!loading && !error && (gameState === 'playing' || gameState === 'finished')) && (
          <section className="map-section">
            <h3>Türkiye Haritası</h3>
            <TurkeyMap 
              gameState={gameState}
              foundCities={foundCities}
              currentPlateTarget={currentPlateTarget}
              onCityClick={handleMapCityClick}
              gameMode={gameMode}
            />
          </section>
        )}

        {/* Fixed Cities Grid Table */}
        {!loading && !error && (
          <section className="grid-section">
            <h3>Şehir Tablosu ({foundCities.length} / {allCities.length})</h3>
            <div className="cities-grid">
              {allCities.map(cityObj => {
                const isFound = foundCities.some(c => c.plate === cityObj.plate);
                const isActive = currentPlateTarget && currentPlateTarget.plate === cityObj.plate && gameState === 'playing';
                const isGameFinished = gameState === 'finished';

                let cellClass = "grid-cell";
                let displayText = "";

                if (isFound) {
                  cellClass += " cell-found";
                  displayText = cityObj.city.toUpperCase();
                } else if (isGameFinished) {
                  cellClass += " cell-missed";
                  displayText = cityObj.city.toUpperCase();
                } else if (isActive) {
                  cellClass += " cell-active";
                  displayText = "?";
                } else {
                  cellClass += " cell-empty";
                  // Tıklanabilir olduğunu göstermek için oyun oynanırken imleç pointer olacak
                  if (gameState === 'playing' && gameMode === 'sequential') {
                    cellClass += " cell-clickable";
                  }
                  displayText = "";
                }

                return (
                  <div 
                    key={cityObj.plate} 
                    className={cellClass}
                    onClick={() => handleGridCellClick(cityObj)}
                    title={gameState === 'playing' && gameMode === 'sequential' && !isFound ? `${cityObj.plate} nolu plakayı seç` : ''}
                  >
                    <span className="cell-plate">{cityObj.plate}</span>
                    <span className="cell-name">{displayText}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
