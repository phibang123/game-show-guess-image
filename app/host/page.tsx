'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { animated, useSpring } from 'react-spring';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Card } from '@/app/components/ui/Card';
import { QRCode } from '@/app/components/ui/QRCode';

const AnimatedDiv = animated('div');

type SetupFormData = {
  hostCode: string;
  maxTeams: number;
  maxTeamMembers: number;
  timeLimit: number;
  roundsCount: number;
};

const schema = yup.object({
  hostCode: yup.string().required('Mã host là bắt buộc'),
  maxTeams: yup
    .number()
    .min(1, 'Số lượng tối thiểu là 1')
    .max(10, 'Số lượng tối đa là 10')
    .required('Số đội là bắt buộc'),
  maxTeamMembers: yup
    .number()
    .min(1, 'Số lượng tối thiểu là 1')
    .max(10, 'Số lượng tối đa là 10')
    .required('Số thành viên mỗi đội là bắt buộc'),
  timeLimit: yup
    .number()
    .min(10, 'Thời gian tối thiểu là 10 giây')
    .max(300, 'Thời gian tối đa là 300 giây')
    .required('Thời gian là bắt buộc'),
  roundsCount: yup
    .number()
    .min(1, 'Số vòng tối thiểu là 1')
    .max(10, 'Số vòng tối đa là 10')
    .required('Số vòng là bắt buộc'),
});

export default function HostPage() {
  const router = useRouter();
  const [gameCreated, setGameCreated] = useState(false);
  const [gameId, setGameId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      hostCode: '',
      maxTeams: 5,
      maxTeamMembers: 5,
      timeLimit: 60,
      roundsCount: 5,
    },
  });
  
  const [formSpring, formApi] = useSpring(() => ({
    opacity: 0,
    y: 30,
  }));
  
  const [qrSpring, qrApi] = useSpring(() => ({
    opacity: 0,
    scale: 0.8,
  }));
  
  React.useEffect(() => {
    formApi.start({
      opacity: 1,
      y: 0,
      config: { tension: 120, friction: 14 },
      delay: 200,
    });
    
    if (gameCreated) {
      qrApi.start({
        opacity: 1,
        scale: 1,
        config: { tension: 120, friction: 14 },
      });
    }
  }, [formApi, qrApi, gameCreated]);
  
  const onSubmit = async (data: SetupFormData) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setGameId(result.gameId);
        setGameCreated(true);
      } else {
        alert(`Lỗi: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Có lỗi xảy ra khi tạo trò chơi');
    } finally {
      setIsLoading(false);
    }
  };
  
  const startGame = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/game', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          hostCode: (document.getElementById('hostCode') as HTMLInputElement)?.value,
          startGame: true,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        router.push(`/host/game?gameId=${gameId}`);
      } else {
        alert(`Lỗi: ${result.error}`);
      }
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Có lỗi xảy ra khi bắt đầu trò chơi');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <main className="min-h-screen p-4 bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="container mx-auto max-w-4xl py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Tạo Phòng Game</h1>
          <p className="text-white/90">
            Thiết lập các thông số và chia sẻ mã QR cho người chơi tham gia
          </p>
        </div>
        
        {!gameCreated ? (
          <AnimatedDiv
            style={formSpring}
            className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Mã Host (dùng để xác thực)"
                {...register('hostCode')}
                error={errors.hostCode?.message}
                fullWidth
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Số đội tối đa"
                  type="number"
                  {...register('maxTeams', { valueAsNumber: true })}
                  error={errors.maxTeams?.message}
                  fullWidth
                />
                
                <Input
                  label="Số thành viên mỗi đội"
                  type="number"
                  {...register('maxTeamMembers', { valueAsNumber: true })}
                  error={errors.maxTeamMembers?.message}
                  fullWidth
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Thời gian cho mỗi vòng (giây)"
                  type="number"
                  {...register('timeLimit', { valueAsNumber: true })}
                  error={errors.timeLimit?.message}
                  fullWidth
                />
                
                <Input
                  label="Số vòng chơi"
                  type="number"
                  {...register('roundsCount', { valueAsNumber: true })}
                  error={errors.roundsCount?.message}
                  fullWidth
                />
              </div>
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading}
                fullWidth
                className="mt-6"
              >
                {isLoading ? 'Đang tạo...' : 'Tạo Phòng Game'}
              </Button>
            </form>
          </AnimatedDiv>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatedDiv
              style={{
                ...formSpring,
              }}
              className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Phòng đã tạo!</h2>
              <p className="text-white mb-6">
                ID Phòng: <span className="font-mono font-bold">{gameId}</span>
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Người chơi có thể tham gia bằng QR Code:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <QRCode
                      value={`${window.location.origin}/join-team?gameId=${gameId}`}
                      title="QR cho đội"
                      size={150}
                    />
                    <QRCode
                      value={`${window.location.origin}/join-audience?gameId=${gameId}`}
                      title="QR cho khán giả"
                      size={150}
                    />
                  </div>
                </div>
                
                <Button
                  onClick={startGame}
                  variant="success"
                  size="lg"
                  disabled={isLoading}
                  fullWidth
                >
                  {isLoading ? 'Đang bắt đầu...' : 'Bắt Đầu Trò Chơi'}
                </Button>
              </div>
            </AnimatedDiv>
            
            <AnimatedDiv
              style={{
                opacity: qrSpring.opacity,
                scale: qrSpring.scale,
              }}
              className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Trạng thái phòng</h2>
              <div className="space-y-4">
                <Card>
                  <h3 className="text-lg font-medium mb-2">
                    Đội tham gia
                  </h3>
                  <p className="text-gray-600 text-center text-lg">
                    <span className="text-5xl font-bold text-blue-600">0</span>/
                    <span className="text-xl">{5}</span>
                  </p>
                </Card>
                
                <Card>
                  <h3 className="text-lg font-medium mb-2">
                    Người xem
                  </h3>
                  <p className="text-gray-600 text-center text-lg">
                    <span className="text-5xl font-bold text-green-600">0</span>
                  </p>
                </Card>
                
                <div className="mt-6 text-white">
                  <p>
                    <strong>Lưu ý:</strong> Lưu lại mã Host để sử dụng khi cần.
                  </p>
                  <input
                    id="hostCode"
                    type="hidden"
                    {...register('hostCode')}
                  />
                </div>
              </div>
            </AnimatedDiv>
          </div>
        )}
      </div>
    </main>
  );
} 