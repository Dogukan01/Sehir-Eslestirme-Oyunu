import React, { useEffect, useRef, useState } from 'react';

function TurkeyMap({ 
  gameState, 
  foundCities, 
  currentPlateTarget,
  onCityClick, 
  gameMode 
}) {
  const [svgContent, setSvgContent] = useState('');
  const containerRef = useRef(null);
  
  // onCityClick referansını korumak için ref kullanıyoruz, 
  // böylece callback her değiştiğinde useEffect'in gereksiz çalışmasını ve haritanın parlamasını önlüyoruz.
  const onClickRef = useRef(onCityClick);
  useEffect(() => {
    onClickRef.current = onCityClick;
  }, [onCityClick]);

  // 1. SVG Harita Dosyasını Yükle
  useEffect(() => {
    fetch('/turkiye.svg')
      .then(res => {
        if (!res.ok) throw new Error('SVG haritası yüklenemedi.');
        return res.text();
      })
      .then(data => {
        setSvgContent(data);
      })
      .catch(err => {
        console.error('Harita yükleme hatası:', err);
      });
  }, []);

  // 2. Harita Renklerini ve Tıklama Dinamiklerini Ayarla
  useEffect(() => {
    if (!svgContent || !containerRef.current) return;

    const svgElement = containerRef.current.querySelector('svg');
    if (!svgElement) return;

    svgElement.setAttribute('width', '100%');
    svgElement.setAttribute('height', '100%');
    svgElement.style.maxWidth = '100%';
    svgElement.style.height = 'auto';

    // Kıbrıs haritasını gizle
    const kibrisGroup = svgElement.querySelector('#kibris');
    if (kibrisGroup) {
      kibrisGroup.style.display = 'none';
    }

    const cityGroups = svgElement.querySelectorAll('g[data-plakakodu]');
    
    cityGroups.forEach(group => {
      const plate = group.getAttribute('data-plakakodu');
      const cityName = group.getAttribute('data-iladi');

      const isFound = foundCities.some(c => c.plate === plate);
      const isGameFinished = gameState === 'finished';
      const isActive = currentPlateTarget && currentPlateTarget.plate === plate && gameMode !== 'map';

      let fillColor = '#1e293b'; // Koyu gri/mavi varsayılan arka plan
      let strokeColor = 'rgba(255, 255, 255, 0.15)';
      let cursorStyle = 'default';

      if (isFound) {
        fillColor = '#10b981'; // Doğru tahmin (Yeşil)
        strokeColor = 'rgba(255, 255, 255, 0.4)';
      } else if (isGameFinished) {
        fillColor = '#ef4444'; // Bulunamamış şehir (Kırmızı)
        strokeColor = 'rgba(255, 255, 255, 0.4)';
      } else if (isActive) {
        fillColor = '#f59e0b'; // Turuncu (Aktif Soru - sadece mod 1 ve 2'de)
        strokeColor = '#ffffff';
        cursorStyle = 'pointer';
      } else {
        if (gameState === 'playing' && gameMode !== 'random') {
          cursorStyle = 'pointer';
        }
      }

      const paths = group.querySelectorAll('path');
      paths.forEach(path => {
        path.style.transition = 'fill 0.2s ease, stroke 0.2s ease';
        path.style.fill = fillColor;
        path.style.stroke = strokeColor;
        path.style.cursor = cursorStyle;
      });

      // Hover olayları (Sadece oyun oynanırken, şehir bulunmamışken ve rastgele modda değilken)
      if (gameState === 'playing' && !isFound && gameMode !== 'random') {
        group.onmouseenter = () => {
          paths.forEach(path => {
            path.style.fill = '#3b82f6'; // Hover durumunda Mavi renk
          });
        };
        group.onmouseleave = () => {
          paths.forEach(path => {
            path.style.fill = isActive ? '#f59e0b' : fillColor;
          });
        };
      } else {
        group.onmouseenter = null;
        group.onmouseleave = null;
      }

      // Tıklama Olayı
      group.onclick = () => {
        if (gameState !== 'playing') return;
        if (onClickRef.current) {
          onClickRef.current(plate, cityName);
        }
      };
    });

  }, [svgContent, gameState, foundCities, currentPlateTarget, gameMode]); 

  // React'in her render'da DOM'u sıfırlayıp event listener ve stilleri silmesini önlemek için
  // div elementini memoize ediyoruz. Harita sadece svgContent değiştiğinde (ilk yüklemede) render edilecek.
  const memoizedMap = React.useMemo(() => {
    return (
      <div 
        ref={containerRef} 
        className="map-container"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  }, [svgContent]);

  return memoizedMap;
}

export default TurkeyMap;
