'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { animated, useSpring } from 'react-spring';
import { Button } from '@/app/components/ui/Button';

const AnimatedDiv = animated('div');

export default function Home() {
  const router = useRouter();
  
  const [titleSpring, titleApi] = useSpring(() => ({
    y: -20,
    opacity: 0,
  }));
  
  const [buttonsSpring, buttonsApi] = useSpring(() => ({
    y: 50,
    opacity: 0,
  }));
  
  const [logoSpring, logoApi] = useSpring(() => ({
    scale: 0.8,
    opacity: 0,
    rotate: -10,
  }));
  
  React.useEffect(() => {
    const timeout1 = setTimeout(() => {
      titleApi.start({
        y: 0,
        opacity: 1,
        config: { tension: 120, friction: 14 },
      });
    }, 300);
    
    const timeout2 = setTimeout(() => {
      buttonsApi.start({
        y: 0,
        opacity: 1,
        config: { tension: 120, friction: 14 },
      });
    }, 600);
    
    const timeout3 = setTimeout(() => {
      logoApi.start({
        scale: 1,
        opacity: 1,
        rotate: 0,
        config: { tension: 200, friction: 15 },
      });
    }, 100);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [titleApi, buttonsApi, logoApi]);
  
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="max-w-4xl w-full flex flex-col items-center">
        <AnimatedDiv
          style={{
            scale: logoSpring.scale,
            opacity: logoSpring.opacity,
            rotate: logoSpring.rotate.to(r => `${r}deg`),
          }}
          className="mb-8"
        >
          <div className="bg-white p-6 rounded-full w-24 h-24 flex items-center justify-center shadow-xl mb-4">
            <span className="text-4xl">🎮</span>
          </div>
        </AnimatedDiv>
        
        <AnimatedDiv
          style={{
            y: titleSpring.y,
            opacity: titleSpring.opacity,
          }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-white mb-4">Game Show Trực Tuyến</h1>
          <p className="text-xl text-white opacity-90 max-w-lg">
            Trò chơi tương tác với đội và khán giả. Vui vẻ, gay cấn và đầy bất ngờ!
          </p>
        </AnimatedDiv>
        
        <AnimatedDiv
          style={{
            y: buttonsSpring.y,
            opacity: buttonsSpring.opacity,
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-lg"
        >
          <div className="bg-white/20 backdrop-blur-sm p-6 rounded-xl shadow-lg text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Là Host?</h2>
            <p className="text-white mb-4">Tạo phòng và quản lý trò chơi của bạn</p>
            <Button
              variant="primary"
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50"
              onClick={() => router.push('/host')}
              fullWidth
            >
              Tạo phòng
            </Button>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm p-6 rounded-xl shadow-lg text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Là người chơi?</h2>
            <p className="text-white mb-4">Tham gia phòng hiện có</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="success"
                onClick={() => router.push('/join-team')}
                fullWidth
              >
                Tham gia đội
              </Button>
              <Button
                variant="warning"
                onClick={() => router.push('/join-audience')}
                fullWidth
              >
                Tham gia khán giả
              </Button>
            </div>
          </div>
        </AnimatedDiv>
        
        <AnimatedDiv
          style={{
            opacity: buttonsSpring.opacity,
          }}
          className="mt-12 text-white/70 text-sm"
        >
          <p>© 2025 Game Show Online - Sản phẩm demo</p>
        </AnimatedDiv>
      </div>
    </main>
  );
}
