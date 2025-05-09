'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { animated, useSpring } from 'react-spring';
import { io, Socket } from 'socket.io-client';

import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { QRCode } from '@/app/components/ui/QRCode';

const AnimatedDiv = animated('div');

type RoomStats = {
  teamsCount: number;
  audienceCount: number;
  maxTeams: number;
};

type TeamInfo = {
  id: string;
  name: string;
  membersCount: number;
  maxMembers: number;
};

export default function HostGameRoom() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;
  
  const socketStoreRef = useRef<Socket | null>(null);
  const [roomStats, setRoomStats] = useState<RoomStats>({
    teamsCount: 0,
    audienceCount: 0,
    maxTeams: 5,
  });
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [qrSpring, qrApi] = useSpring(() => ({
    opacity: 0,
    scale: 0.8,
  }));
  
  const [contentSpring, contentApi] = useSpring(() => ({
    opacity: 0,
    y: 30,
  }));
  
  // Khởi tạo animation
  useEffect(() => {
    qrApi.start({
      opacity: 1,
      scale: 1,
      config: { tension: 120, friction: 14 },
      delay: 200,
    });
    
    contentApi.start({
      opacity: 1,
      y: 0,
      config: { tension: 120, friction: 14 },
      delay: 400,
    });
  }, [qrApi, contentApi]);
  
  // Khởi tạo kết nối Socket.IO khi component mount
  useEffect(() => {
    // Khởi tạo socket chỉ khi component mount
    const socketInstance = io(`:PORT`, {
      path: '/api/socket',
      autoConnect: true,
      addTrailingSlash: false,
    });
    
    socketStoreRef.current = socketInstance;
    
    // Dọn dẹp khi component unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);
  
  // Lấy thông tin game ban đầu
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/game?gameId=${gameId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Không thể tải dữ liệu trò chơi');
        }
        
        const game = await response.json();
        
        // Định dạng danh sách đội
        const formattedTeams = game.teams.map((team: {
          id: string;
          name: string;
          members: Array<{id: string; name: string; email: string}>;
        }) => ({
          id: team.id,
          name: team.name,
          membersCount: team.members.length,
          maxMembers: game.maxTeamMembers,
        }));
        
        setTeams(formattedTeams);
        setRoomStats({
          teamsCount: formattedTeams.length,
          audienceCount: game.audience?.length || 0,
          maxTeams: game.maxTeams,
        });
      } catch (err) {
        console.error('Error fetching game data:', err);
        setError((err as Error).message || 'Có lỗi xảy ra khi tải dữ liệu trò chơi');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (gameId) {
      fetchGameData();
    }
  }, [gameId]);
  
  // Xử lý tham gia phòng và cập nhật dữ liệu khi gameId thay đổi
  useEffect(() => {
    if (!socketStoreRef.current || !gameId) return;
    // Tham gia phòng theo gameId
    socketStoreRef.current.emit('join-room', gameId);
    
    // Bắt đầu cập nhật tự động mỗi 5 giây
    socketStoreRef.current.emit('start-auto-updates', gameId);
    
    // Lắng nghe sự kiện cập nhật số liệu phòng
    socketStoreRef.current.on('room-stats-updated', (data) => {
      console.log('Room stats updated:', data);
      if (data.gameId === gameId) {
        setRoomStats({
          teamsCount: data.teamsCount,
          audienceCount: data.audienceCount,
          maxTeams: data.maxTeams,
        });
        
        // TODO: Cập nhật danh sách đội nếu cần
      }
    });
    
    // Yêu cầu dữ liệu ban đầu
    socketStoreRef.current.emit('request-room-stats', gameId);
    
    // Dọn dẹp khi component unmount hoặc gameId thay đổi
    return () => {
      socketStoreRef.current?.off('room-stats-updated');
      socketStoreRef.current?.emit('stop-auto-updates');
    };
  }, [socketStoreRef.current, gameId]);
  
  const startGame = async () => {
    try {
      setIsLoading(true);
      
      const hostCode = localStorage.getItem('hostCode') || '';
      
      const response = await fetch('/api/game', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          hostCode,
          startGame: true,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        router.push(`/host/game?gameId=${gameId}`);
      } else {
        setError(`Lỗi: ${result.error}`);
      }
    } catch (error) {
      console.error('Error starting game:', error);
      setError('Có lỗi xảy ra khi bắt đầu trò chơi');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <main className="min-h-screen p-4 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-4">Đang tải...</h1>
          <p>Vui lòng đợi trong khi chúng tôi tải dữ liệu phòng chơi</p>
        </div>
      </main>
    );
  }
  
  if (error) {
    return (
      <main className="min-h-screen p-4 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <h1 className="text-3xl font-bold mb-4 text-white">Lỗi</h1>
          <p className="text-white mb-6">{error}</p>
          <Button onClick={() => router.push('/host')} variant="primary">
            Quay lại trang tạo phòng
          </Button>
        </div>
      </main>
    );
  }
  
  return (
    <main className="min-h-screen p-4 bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="container mx-auto max-w-4xl py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Phòng Chờ Game</h1>
          <p className="text-white/90">
            ID Phòng: <span className="font-mono font-bold">{gameId}</span>
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatedDiv
            style={{
              ...contentSpring,
            }}
            className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Thông tin phòng</h2>
            
            <div className="space-y-4 mb-6">
              <Card>
                <h3 className="text-lg font-medium mb-2">
                  Đội tham gia
                </h3>
                <p className="text-gray-600 text-center text-lg">
                  <span className="text-5xl font-bold text-blue-600">{roomStats.teamsCount}</span>/
                  <span className="text-xl">{roomStats.maxTeams}</span>
                </p>
                <p className="text-xs text-gray-500 text-center mt-1">
                  Cập nhật tự động mỗi 5 giây
                </p>
              </Card>
              
              <Card>
                <h3 className="text-lg font-medium mb-2">
                  Khán giả
                </h3>
                <p className="text-gray-600 text-center text-lg">
                  <span className="text-5xl font-bold text-green-600">{roomStats.audienceCount}</span>
                </p>
                <p className="text-xs text-gray-500 text-center mt-1">
                  Cập nhật tự động mỗi 5 giây
                </p>
              </Card>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                Mã QR để tham gia:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <QRCode
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join-team?gameId=${gameId}`}
                  title="QR cho đội"
                  size={150}
                />
                <QRCode
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join-audience?gameId=${gameId}`}
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
              className="mt-4"
            >
              {isLoading ? 'Đang bắt đầu...' : 'Bắt Đầu Trò Chơi'}
            </Button>
          </AnimatedDiv>
          
          <AnimatedDiv
            style={{
              opacity: qrSpring.opacity,
              scale: qrSpring.scale,
            }}
            className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Danh sách đội</h2>
            
            {teams.length === 0 ? (
              <p className="text-white">Chưa có đội nào tham gia.</p>
            ) : (
              <div className="space-y-3">
                {teams.map(team => (
                  <Card key={team.id} className="!p-4" hoverable={false}>
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{team.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        team.membersCount >= team.maxMembers 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {team.membersCount}/{team.maxMembers}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            
            <div className="mt-6 text-white">
              <h3 className="text-lg font-medium mb-2">Hướng dẫn</h3>
              <ul className="text-white/90 space-y-2 list-disc pl-5">
                <li>Chia sẻ mã QR hoặc link cho người chơi để tham gia</li>
                <li>Đợi cho đến khi đủ số lượng đội và người chơi</li>
                <li>Nhấn &quot;Bắt Đầu Trò Chơi&quot; khi đã sẵn sàng</li>
                <li>Trò chơi sẽ bắt đầu và chuyển đến giao diện điều khiển</li>
              </ul>
            </div>
          </AnimatedDiv>
        </div>
      </div>
    </main>
  );
} 