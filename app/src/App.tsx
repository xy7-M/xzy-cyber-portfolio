import { useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navigation from './sections/Navigation';
import Hero from './sections/Hero';
import Curriculum from './sections/Curriculum';
import CinematicVision from './sections/CinematicVision';
import PersonalCard from './sections/PersonalCard';
import AlumniArchives from './sections/AlumniArchives';
import Footer from './sections/Footer';
import CapabilityDetail from './sections/CapabilityDetail';

/**
 * 背景音乐：隐藏式播放，无任何前端界面。
 * 音量 40%，无限循环。浏览器禁止带声音自动播放，
 * 因此先尝试直接播放，被拦截则在用户首次交互时启动。
 */
function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.4;

    const tryPlay = () => {
      audio.play().catch(() => {
        const unlock = () => {
          audio.play().catch(() => {});
        };
        window.addEventListener('pointerdown', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
      });
    };
    tryPlay();
  }, []);

  return (
    <audio
      ref={audioRef}
      src="audio/bgm.m4a"
      loop
      preload="auto"
      style={{ display: 'none' }}
    />
  );
}

function HomePage() {
  return (
    <div
      style={{
        background: '#050a12',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      <Navigation />

      <main>
        <Hero />
        <Curriculum />
        <CinematicVision />
        <PersonalCard />
        <AlumniArchives />
        <Footer />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <>
      <BackgroundMusic />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/capability/:slug" element={<CapabilityDetail />} />
      </Routes>
    </>
  );
}
