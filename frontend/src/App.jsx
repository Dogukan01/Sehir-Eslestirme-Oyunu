import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { normalizeText } from './utils/normalization';
import TurkeyMap from './TurkeyMap';
import { regions, getCityRegion } from './utils/regions';
import { playCorrectSound, playIncorrectSound, playWinSound } from './utils/sound';
import './index.css';

function App() {
  const [allCities, setAllCities] = useState([]);
  const [unfoundCities, setUnfoundCities] = useState([]);
  const [foundCities, setFoundCities] = useState([]);
  const [currentPlateTarget, setCurrentPlateTarget] = useState(null);

  const [inputValue, setInputValue] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'playing' | 'finished'
  const [gameMode, setGameMode] = useState('sequential'); // 'sequential' | 'random' | 'map' | 'training'
  const [flashState, setFlashState] = useState(null); // null | 'correct' | 'incorrect'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sound and Leaderboard State
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('game_muted') === 'true');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('game_leaderboard')) || {
        sequential: null,
        random: null,
        map: null,
        training: null
      };
    } catch {
      return { sequential: null, random: null, map: null, training: null };
    }
  });

  // Hint States
  const [hintsUsed, setHintsUsed] = useState(0);
  const [activeHint, setActiveHint] = useState(null);

  const inputRef = useRef(null);
  const foundCitiesRef = useRef([]);
  const gameCardRef = useRef(null);
  const hasScrolledRef = useRef(false);

  // Sync found cities to ref to avoid stale closures in timer/async handlers
  useEffect(() => {
    foundCitiesRef.current = foundCities;
  }, [foundCities]);

  const scrollToGameView = () => {
    if (gameCardRef.current) {
      const offset = gameCardRef.current.offsetTop - 20;
      window.scrollTo({
        top: offset > 0 ? offset : 0,
        behavior: 'smooth'
      });
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const newVal = !prev;
      localStorage.setItem('game_muted', String(newVal));
      return newVal;
    });
  };

  const updateLeaderboard = (mode, score, timeElapsed, isCompleted) => {
    setLeaderboard(prev => {
      const currentRecord = prev[mode];
      let isNewRecord = false;

      if (!currentRecord) {
        isNewRecord = true;
      } else {
        if (mode === 'sequential' || mode === 'training') {
          if (score === 81) {
            if (currentRecord.score < 81 || timeElapsed < currentRecord.time) {
              isNewRecord = true;
            }
          } else if (score > currentRecord.score) {
            isNewRecord = true;
          }
        } else {
          if (score > currentRecord.score) {
            isNewRecord = true;
          } else if (score === currentRecord.score && timeElapsed < currentRecord.time) {
            isNewRecord = true;
          }
        }
      }

      if (isNewRecord) {
        const newRecord = { score, time: timeElapsed, date: new Date().toLocaleDateString('tr-TR') };
        const updated = { ...prev, [mode]: newRecord };
        localStorage.setItem('game_leaderboard', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  };

  // 1. Fetch cities on initial load
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.BASE_URL}cities.json`);
        setAllCities(response.data);
        setError(null);
      } catch (err) {
        console.error("Şehir verileri çekilemedi:", err);
        setError("Şehir verileri yüklenemedi. Lütfen sayfayı yenilemeyi veya internet bağlantınızı kontrol etmeyi deneyin.");
      } finally {
        setLoading(false);
      }
    };
    fetchCities();
  }, []);

  // 2. Timer / Stopwatch logic
  useEffect(() => {
    let timer;
    if (gameState === 'playing') {
      if (gameMode === 'training') {
        // Eğitim modu: kronometre yukarı doğru sayar
        timer = setInterval(() => {
          setTimeLeft(prev => prev + 1);
        }, 1000);
      } else {
        // Diğer modlar: geri sayım
        if (timeLeft > 0) {
          timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
          }, 1000);
        } else {
          endGame(foundCitiesRef.current);
        }
      }
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, gameMode]);

  // Start the game
  const startGame = () => {
    setFoundCities([]);
    setUnfoundCities([...allCities]);
    setTimeLeft(gameMode === 'training' ? 0 : 300); // Eğitim modunda 0, diğerlerinde 300
    setGameState('playing');
    setInputValue('');
    setHintsUsed(0);
    setActiveHint(null);
    hasScrolledRef.current = false;

    // Mod seçimine göre başlangıç hedefini belirle
    if (gameMode === 'sequential' || gameMode === 'training') {
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
    } else {
      // Harita modunda oyun başladığı an haritayı görebilmek için ekranı kaydır
      setTimeout(() => {
        scrollToGameView();
      }, 150);
    }
  };

  const endGame = (currentFound = foundCitiesRef.current) => {
    setGameState('finished');
    const isCompleted = currentFound.length === allCities.length;
    const elapsed = gameMode === 'training' ? timeLeft : (300 - timeLeft);

    if (isCompleted) {
      playWinSound(isMuted);
    }
    updateLeaderboard(gameMode, currentFound.length, elapsed, isCompleted);
  };

  // Pick a random plate from available pool
  const pickRandomPlate = (pool) => {
    if (pool.length === 0) return;
    const randomIndex = Math.floor(Math.random() * pool.length);
    setCurrentPlateTarget(pool[randomIndex]);
  };

  // Doğru cevap verildiğinde ortak tetiklenecek fonksiyon
  const handleCorrectAnswer = (target = currentPlateTarget, currentFound = foundCities, currentUnfound = unfoundCities) => {
    playCorrectSound(isMuted);

    // Animasyonu tetikle
    setFlashState('correct');
    setTimeout(() => setFlashState(null), 300);

    // İpucunu temizle
    setActiveHint(null);

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
      endGame(newFoundCities);
    } else {
      // Yeni bir plaka seç
      if (gameMode === 'sequential' || gameMode === 'training') {
        // Sıralı veya eğitim modunda bir sonraki bulunmamış plakayı bul
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

    if (value.length > 0 && !hasScrolledRef.current) {
      scrollToGameView();
      hasScrolledRef.current = true;
    }

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
        playIncorrectSound(isMuted);
        // Hatalı tıklandıysa kırmızı flash animasyonu tetikle
        setFlashState('incorrect');
        setTimeout(() => setFlashState(null), 300);
      }
    } else if (gameMode === 'sequential' || gameMode === 'training') {
      // Sıralı veya Eğitim Modu: Tablodan/Haritadan tıklanan numarayı aktif hedef yap
      const clickedCity = allCities.find(c => c.plate === plate);
      const isAlreadyFound = foundCities.some(c => c.plate === plate);

      if (clickedCity && !isAlreadyFound) {
        setCurrentPlateTarget(clickedCity);
        setInputValue('');
        setActiveHint(null);
        setTimeout(() => {
          if (inputRef.current) inputRef.current.focus();
        }, 50);
      }
    }
  };

  // Grid hücresine tıklandığında tetiklenen fonksiyon
  const handleGridCellClick = (cityObj) => {
    if (gameState !== 'playing' || (gameMode !== 'sequential' && gameMode !== 'training')) return;

    // Zaten bulunmuşsa tıklanamaz
    const isAlreadyFound = foundCities.some(c => c.plate === cityObj.plate);
    if (isAlreadyFound) return;

    // Aktif hedef yap
    setCurrentPlateTarget(cityObj);
    setInputValue('');
    setActiveHint(null);
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

  // Hint Logic
  const getHint = () => {
    if (gameState !== 'playing' || !currentPlateTarget) return;

    if (gameMode !== 'training' && hintsUsed >= 3) {
      setActiveHint("Daha fazla ipucu hakkınız kalmadı! (Limit: 3)");
      return;
    }

    const region = getCityRegion(currentPlateTarget.plate);
    const firstLetter = currentPlateTarget.city.charAt(0).toUpperCase();

    let hintText = "";
    if (hintsUsed % 2 === 0) {
      hintText = `Bölge: ${region} Bölgesi`;
    } else {
      hintText = `İlk Harf: "${firstLetter}"`;
    }

    setHintsUsed(prev => prev + 1);
    setActiveHint(hintText);
  };

  // Calculate Region Stats dynamically
  const regionStats = useMemo(() => {
    const stats = {};
    Object.entries(regions).forEach(([regionName, plates]) => {
      const total = plates.length;
      const found = foundCities.filter(c => plates.includes(c.plate)).length;
      const percent = total > 0 ? Math.round((found / total) * 100) : 0;
      stats[regionName] = { found, total, percent };
    });
    return stats;
  }, [foundCities]);

  const elapsedSeconds = gameMode === 'training' ? timeLeft : (300 - timeLeft);

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-controls">
          <button className="btn-icon" onClick={toggleMute} title={isMuted ? "Sesi Aç" : "Sesi Kapat"}>
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button className="btn-icon" onClick={() => setShowLeaderboard(true)} title="Rekorlarım">
            🏆 Rekorlar
          </button>
        </div>
        <div className="header-logo-container">
          <div className="header-plate-logo">
            <span className="logo-tr">TR</span>
            <span className="logo-number">81</span>
          </div>
          <h1>PlakaTahmin</h1>
        </div>
        <p>Türkiye Şehir - Plaka Eşleştirme Oyunu</p>
      </header>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="modal-overlay" onClick={() => setShowLeaderboard(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🏆 Kişisel En İyi Derecelerim</h2>
              <button className="close-btn" onClick={() => setShowLeaderboard(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="leaderboard-grid">
                <div className="leaderboard-item">
                  <div className="item-title">Sıralı Mod (01 - 81)</div>
                  {leaderboard.sequential ? (
                    <div className="item-stats">
                      <p><strong>En Yüksek Skor:</strong> {leaderboard.sequential.score} / 81</p>
                      <p><strong>En İyi Süre:</strong> {formatTime(leaderboard.sequential.time)}</p>
                      <p className="item-date">Tarih: {leaderboard.sequential.date}</p>
                    </div>
                  ) : (
                    <p className="no-record">Henüz rekor yok</p>
                  )}
                </div>
                <div className="leaderboard-item">
                  <div className="item-title">Rastgele Mod</div>
                  {leaderboard.random ? (
                    <div className="item-stats">
                      <p><strong>En Yüksek Skor:</strong> {leaderboard.random.score} / 81</p>
                      <p><strong>En İyi Süre:</strong> {formatTime(leaderboard.random.time)}</p>
                      <p className="item-date">Tarih: {leaderboard.random.date}</p>
                    </div>
                  ) : (
                    <p className="no-record">Henüz rekor yok</p>
                  )}
                </div>
                <div className="leaderboard-item">
                  <div className="item-title">Harita Eşleştirme</div>
                  {leaderboard.map ? (
                    <div className="item-stats">
                      <p><strong>En Yüksek Skor:</strong> {leaderboard.map.score} / 81</p>
                      <p><strong>En İyi Süre:</strong> {formatTime(leaderboard.map.time)}</p>
                      <p className="item-date">Tarih: {leaderboard.map.date}</p>
                    </div>
                  ) : (
                    <p className="no-record">Henüz rekor yok</p>
                  )}
                </div>
                <div className="leaderboard-item">
                  <div className="item-title">Eğitim Modu</div>
                  {leaderboard.training ? (
                    <div className="item-stats">
                      <p><strong>En Yüksek Skor:</strong> {leaderboard.training.score} / 81</p>
                      <p><strong>En İyi Süre:</strong> {formatTime(leaderboard.training.time)}</p>
                      <p className="item-date">Tarih: {leaderboard.training.date}</p>
                    </div>
                  ) : (
                    <p className="no-record">Henüz rekor yok</p>
                  )}
                </div>
              </div>
              <button
                className="btn-danger"
                style={{ marginTop: '1.5rem', width: '100%' }}
                onClick={() => {
                  if (confirm("Tüm rekorlarınızı sıfırlamak istediğinize emin misiniz?")) {
                    localStorage.removeItem('game_leaderboard');
                    setLeaderboard({ sequential: null, random: null, map: null, training: null });
                  }
                }}
              >
                Tüm Verileri Sıfırla
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="main-content">
        {/* Game Area */}
        <section ref={gameCardRef} className={`game-card ${flashState === 'correct' ? 'flash-correct' : flashState === 'incorrect' ? 'flash-incorrect' : ''}`}>

          <div className="stats-row">
            <div className="stat-box timer">
              <span>{gameMode === 'training' ? 'Geçen Süre' : 'Kalan Süre'}</span>
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
                  <button
                    className={`btn-mode ${gameMode === 'training' ? 'active' : ''}`}
                    onClick={() => setGameMode('training')}
                  >
                    Eğitim Modu
                  </button>
                </div>
                <div className="mode-info">
                  {gameMode === 'sequential' && "01'den başlayarak sırayla tahmin edin. İstediğiniz plakaya tablodan/haritadan tıklayarak da geçiş yapabilirsiniz."}
                  {gameMode === 'random' && "Rastgele gelen plakaları tahmin edin. Zorlandıklarınızı pas geçip sonra yanıtlayabilirsiniz."}
                  {gameMode === 'map' && "Gelen plakanın hangi ile ait olduğunu harita üzerinden bulup üzerine tıklayın!"}
                  {gameMode === 'training' && "01'den başlayarak süresiz ve stressiz tahmin yapın. Zaman yukarı doğru sayarak ne kadar sürede bitirdiğinizi gösterir."}
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
                <div className="map-mode-hint-area" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="map-mode-hint">
                    <p>Bu plaka koduna sahip şehri <strong>harita üzerinde tıklayarak</strong> bulun!</p>
                  </div>
                  <div className="button-group" style={{ marginTop: '1rem' }}>
                    <button className="btn-hint" onClick={getHint} title="İpucu Al">
                      💡 {gameMode === 'training' ? 'İpucu' : `İpucu (${3 - hintsUsed})`}
                    </button>
                    <button className="btn-secondary" onClick={passCity} title="Bu şehri atla">Pas Geç</button>
                    <button className="btn-danger" onClick={() => endGame(foundCities)} title="Oyunu bitir ve sonuçları gör">Oyunu Bitir</button>
                  </div>
                  {activeHint && (
                    <div className="hint-display" style={{ marginTop: '0.75rem' }}>
                      <span>{activeHint}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
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
                      <button className="btn-hint" onClick={getHint} title="İpucu Al">
                        💡 {gameMode === 'training' ? 'İpucu' : `İpucu (${3 - hintsUsed})`}
                      </button>
                      {unfoundCities.length > 1 && (
                        <button className="btn-secondary" onClick={passCity} title="Bu şehri atla">Pas Geç</button>
                      )}
                      <button className="btn-danger" onClick={() => endGame(foundCities)} title="Oyunu bitir ve sonuçları gör">Oyunu Bitir</button>
                    </div>
                  </div>
                  {activeHint && (
                    <div className="hint-display">
                      <span>{activeHint}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {gameState === 'finished' && (
            <div className="center-action end-screen">
              <h2>{foundCities.length === allCities.length ? 'Tebrikler, Tamamladınız! 🎉' : 'Oyun Sona Erdi!'}</h2>
              <p>Mod: {
                gameMode === 'sequential' ? 'Sıralı Mod' :
                  gameMode === 'random' ? 'Rastgele Mod' :
                    gameMode === 'map' ? 'Harita Eşleştirme' : 'Eğitim Modu'
              }</p>
              <div className="final-score">
                <p>Toplam Skor: {foundCities.length} / {allCities.length}</p>
                <p>Toplam Süre: {formatTime(elapsedSeconds)}</p>
                {leaderboard[gameMode] && leaderboard[gameMode].score === foundCities.length && leaderboard[gameMode].time === elapsedSeconds && (
                  <p className="new-record-tag" style={{ color: '#f59e0b', fontWeight: 'bold', marginTop: '0.5rem', animation: 'pulse 1.5s infinite' }}>⭐ Yeni En İyi Derece! ⭐</p>
                )}
              </div>
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

        {/* Coğrafi Bölge İstatistikleri (Oyun/Bitiş Durumunda Gösterilir) */}
        {(!loading && !error && (gameState === 'playing' || gameState === 'finished')) && (
          <section className="regions-section">
            <h3>Coğrafi Bölge İstatistikleri</h3>
            <div className="regions-grid">
              {Object.entries(regionStats).map(([regionName, stat]) => (
                <div key={regionName} className="region-card">
                  <div className="region-header-row">
                    <span className="region-name">{regionName}</span>
                    <span className="region-count">{stat.found} / {stat.total}</span>
                  </div>
                  <div className="region-progress-bar-bg">
                    <div
                      className="region-progress-bar-fill"
                      style={{ width: `${stat.percent}%` }}
                    />
                  </div>
                  <span className="region-percent">%{stat.percent}</span>
                </div>
              ))}
            </div>
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
                  if (gameState === 'playing' && (gameMode === 'sequential' || gameMode === 'training')) {
                    cellClass += " cell-clickable";
                  }
                  displayText = "";
                }

                return (
                  <div
                    key={cityObj.plate}
                    className={cellClass}
                    onClick={() => handleGridCellClick(cityObj)}
                    title={gameState === 'playing' && (gameMode === 'sequential' || gameMode === 'training') && !isFound ? `${cityObj.plate} nolu plakayı seç` : ''}
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
