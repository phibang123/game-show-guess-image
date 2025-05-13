'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { animated, useSpring } from 'react-spring';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Card } from '@/app/components/ui/Card';
import { Team } from '@/app/lib/stores/gameStore';
import { gameService, teamService } from '../api/services';

const AnimatedDiv = animated('div');

type JoinTeamFormData = {
  name: string;
  email: string;
  teamId: string;
};

const schema = yup.object({
  name: yup.string().required('Tên là bắt buộc'),
  email: yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
  teamId: yup.string().required('Bạn cần chọn đội'),
});

export default function JoinTeamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialGameId = searchParams.get('gameId') || '';

  const [roomIdInput, setRoomIdInput] = useState(initialGameId);
  const [roomIdError, setRoomIdError] = useState('');
  const [gameId, setGameId] = useState(initialGameId);
  const [teams, setTeams] = useState<Array<{ id: string; name: string; membersCount: number; maxMembers: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gameLoading, setGameLoading] = useState(false);
  const [error, setError] = useState('');
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<JoinTeamFormData>({
    resolver: yupResolver(schema),
  });
  
  const [formSpring, formApi] = useSpring(() => ({
    opacity: 0,
    y: 30,
  }));
  
  const [teamsSpring, teamsApi] = useSpring(() => ({
    opacity: 0,
    y: 30,
  }));
  
  useEffect(() => {
    formApi.start({
      opacity: 1,
      y: 0,
      config: { tension: 120, friction: 14 },
      delay: 200,
    });
    
    teamsApi.start({
      opacity: 1,
      y: 0,
      config: { tension: 120, friction: 14 },
      delay: 400,
    });
    console.log(gameId, 'gameId')
    if (gameId) {
      fetchGameData();
    }
  }, [formApi, teamsApi, gameId]);
  
  const fetchGameData = async () => {
    try {
      setGameLoading(true);
      const data = await gameService.getGame(gameId);
      
      if (data.phase !== 'setup') {
        setError('Trò chơi đã bắt đầu, không thể tham gia đội mới');
        setGameLoading(false);
        return;
      }
      
      const formattedTeams = data.teams.map((team: Team) => ({
        id: team.id,
        name: team.name,
        membersCount: team.members.length,
        maxMembers: data.maxTeamMembers,
      }));
      
      setTeams(formattedTeams);
      setGameLoading(false);
    } catch (err) {
      console.error('Error fetching game data:', err);
      setError((err as Error).message || 'Có lỗi xảy ra khi tải dữ liệu trò chơi');
      setGameLoading(false);
    }
  };
  
  const onSubmit = async (data: JoinTeamFormData) => {
    if (!gameId) {
      setError('Thiếu ID phòng');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/team', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          teamId: data.teamId,
          player: {
            name: data.name,
            email: data.email,
          },
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Lưu thông tin người chơi vào localStorage để dùng sau này
        localStorage.setItem('player', JSON.stringify({
          id: result.playerId,
          name: data.name,
          email: data.email,
          teamId: data.teamId,
          teamName: result.teamName,
          gameId,
        }));
        
        // Chuyển hướng đến trang chờ/chơi
        router.push(`/game-team?gameId=${gameId}&playerId=${result.playerId}&teamId=${data.teamId}`);
      } else {
        setError(result.error || 'Có lỗi xảy ra khi tham gia');
      }
    } catch (error) {
      console.error('Error joining team:', error);
      setError('Có lỗi xảy ra khi tham gia');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateTeam = async () => {
    if (!gameId) {
      setError('Thiếu ID phòng');
      return;
    }
    
    const teamName = prompt('Nhập tên đội của bạn:');
    if (!teamName) return;
    
    try {
      setIsLoading(true);
      
      const data = await teamService.createTeam({ gameId, teamName });
      
      if (data) {
        // Thêm đội mới vào danh sách
        setTeams([
          ...teams,
          {
            id: data.teamId,
            name: teamName,
            membersCount: 0,
            maxMembers: 5, // Giả định rằng maxMembers mặc định là 5
          },
        ]);
        
        // Tự động chọn đội mới tạo
        setValue('teamId', data.teamId);
      } else {
        setError('Có lỗi xảy ra khi tạo đội');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      setError('Có lỗi xảy ra khi tạo đội');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFindRoom = async () => {
    setRoomIdError('');
    setError('');
    if (!roomIdInput.trim()) {
      setRoomIdError('Vui lòng nhập ID phòng');
      return;
    }
    setGameLoading(true);
    try {
      const response = await fetch(`/api/game?gameId=${roomIdInput.trim()}`);
      if (!response.ok) {
        setRoomIdError('Không tìm thấy phòng với ID này');
        setGameLoading(false);
        setTeams([]);
        return;
      }
      setGameId(roomIdInput.trim());
      setRoomIdError('');
      setError('');
      // fetchGameData sẽ tự động chạy do gameId thay đổi
    } catch {
      setRoomIdError('Có lỗi xảy ra khi tìm phòng');
      setGameLoading(false);
      setTeams([]);
    }
  };
  
  if (gameLoading) {
    return (
      <main className="min-h-screen p-4 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-4">Đang tải...</h1>
          <p>Vui lòng đợi trong khi chúng tôi kết nối với phòng chơi</p>
        </div>
      </main>
    );
  }
  
  if (error && !teams.length) {
    return (
      <main className="min-h-screen p-4 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <h1 className="text-3xl font-bold mb-4 text-white">Lỗi</h1>
          <p className="text-white mb-6">{error}</p>
          <Button onClick={() => router.push('/')} variant="primary">
            Quay lại trang chủ
          </Button>
        </div>
      </main>
    );
  }
  
  return (
    <main className="min-h-screen p-4 bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="container mx-auto max-w-4xl py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Tham Gia Đội</h1>
          <p className="text-white/90">
            Nhập thông tin của bạn và chọn đội để tham gia
          </p>
        </div>
        <div className="flex flex-col items-center mb-8">
          <div className="flex gap-2 w-full max-w-md">
            <Input
              label="ID phòng"
              value={roomIdInput}
              onChange={e => {
                setRoomIdInput(e.target.value);
                setRoomIdError('');
              }}
              placeholder="Nhập ID phòng..."
              fullWidth
              error={roomIdError}
            />
            <Button
              variant="primary"
              onClick={handleFindRoom}
              disabled={gameLoading}
              className="self-end"
              isLoading={gameLoading}
            >
              Tìm phòng
            </Button>
          </div>
          {roomIdError && (
            <span className="text-red-500 text-xs mt-1">{roomIdError}</span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatedDiv
            style={formSpring}
            className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Tên của bạn"
                {...register('name')}
                error={errors.name?.message}
                fullWidth
              />
              
              <Input
                label="Email"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                fullWidth
              />
              
              <div className="mb-4">
                <label className="text-sm font-medium text-white mb-1 block">
                  Chọn đội
                </label>
                <select
                  {...register('teamId')}
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white"
                >
                  <option value="">-- Chọn đội --</option>
                  {teams.map(team => (
                    <option 
                      key={team.id} 
                      value={team.id}
                      disabled={team.membersCount >= team.maxMembers}
                    >
                      {team.name} ({team.membersCount}/{team.maxMembers})
                    </option>
                  ))}
                </select>
                {errors.teamId && (
                  <span className="text-red-500 text-xs mt-1">{errors.teamId.message}</span>
                )}
              </div>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading}
                fullWidth
                className="mt-6"
              >
                {isLoading ? 'Đang tham gia...' : 'Tham Gia'}
              </Button>
            </form>
          </AnimatedDiv>
          
          <div>
            <AnimatedDiv
              style={teamsSpring}
              className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg mb-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Danh sách đội</h2>
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleCreateTeam}
                  disabled={isLoading}
                >
                  + Tạo đội mới
                </Button>
              </div>
              
              {teams.length === 0 ? (
                <p className="text-white">Chưa có đội nào. Hãy tạo đội đầu tiên!</p>
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
            </AnimatedDiv>
            
            <AnimatedDiv
              style={teamsSpring}
              className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Hướng dẫn</h2>
              <ul className="text-white space-y-2 list-disc pl-5">
                <li>Đăng ký với tên và email của bạn</li>
                <li>Chọn đội hiện có hoặc tạo đội mới</li>
                <li>Mỗi đội có tối đa 5 thành viên</li>
                <li>Sau khi đăng ký thành công, bạn sẽ được chuyển đến phòng chờ</li>
                <li>Trò chơi sẽ bắt đầu khi host sẵn sàng</li>
              </ul>
            </AnimatedDiv>
          </div>
        </div>
      </div>
    </main>
  );
} 