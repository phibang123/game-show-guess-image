'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { animated, useSpring } from 'react-spring';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { GameState, Player, Team } from '@/app/lib/stores/gameStore';

const AnimatedDiv = animated('div');

type InputFormData = {
  input: string;
};

type PlayerInfo = Player & {
  teamName: string;
  gameId: string;
};

const schema = yup.object({
  input: yup.string().required('Hãy nhập mô tả của bạn'),
});

export default function GameTeamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get('gameId');
  const playerId = searchParams.get('playerId');
  const teamId = searchParams.get('teamId');
  
  const [game, setGame] = useState<GameState | null>(null);
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
  const [teamMembers, setTeamMembers] = useState<Player[]>([]);
  const [timer, setTimer] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InputFormData>({
    resolver: yupResolver(schema),
  });
  
  const [mainSpring, mainApi] = useSpring(() => ({
    opacity: 0,
    y: 30,
  }));
  
  const [timerSpring, timerApi] = useSpring(() => ({
    width: '100%',
  }));
  
  useEffect(() => {
    // Animating the entrance
    mainApi.start({
      opacity: 1,
      y: 0,
      config: { tension: 120, friction: 14 },
      delay: 200,
    });
    
    // Try to get player info from localStorage first
    const storedPlayer = localStorage.getItem('player');
    if (storedPlayer) {
      try {
        const playerData = JSON.parse(storedPlayer);
        if (playerData.gameId === gameId && playerData.id === playerId) {
          setPlayerInfo(playerData);
        }
      } catch (e) {
        console.error('Error parsing stored player data:', e);
      }
    }
    
    // Initial game data fetch
    fetchGameData();
    
    // Set up polling for game updates
    const interval = setInterval(fetchGameData, 5000);
    
    return () => clearInterval(interval);
  }, [mainApi, gameId, playerId, teamId]);
  
  useEffect(() => {
    if (!game) return;
    
    // If we're in the team-input phase, start the timer
    if (game.phase === 'team-input' && game.timeLimit > 0) {
      setTimer(game.timeLimit);
      
      // Animate the timer bar
      timerApi.start({
        width: '0%',
        config: {
          duration: game.timeLimit * 1000,
        },
      });
      
      const countdown = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(countdown);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(countdown);
    }
  }, [game, timerApi]);
  
  const fetchGameData = async () => {
    if (!gameId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/game?gameId=${gameId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể tải dữ liệu trò chơi');
      }
      
      const gameData = await response.json();
      setGame(gameData);
      
      // Extract team members
      if (teamId) {
        const team = gameData.teams.find((t: Team) => t.id === teamId);
        if (team) {
          setTeamMembers(team.members);
          
          // Check if current player has already submitted
          if (playerId) {
            const currentPlayer = team.members.find((m: Player) => m.id === playerId);
            if (currentPlayer && currentPlayer.input) {
              setSubmitted(true);
            }
          }
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching game data:', error);
      setError((error as Error).message || 'Có lỗi xảy ra khi tải dữ liệu trò chơi');
      setIsLoading(false);
    }
  };
  
  const onSubmit = async (data: InputFormData) => {
    if (!gameId || !playerId || !teamId) {
      setError('Thiếu thông tin cần thiết');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await fetch('/api/team', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          teamId,
          playerId,
          input: data.input,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSubmitted(true);
        // Refresh game data to get latest team inputs
        fetchGameData();
      } else {
        setError(result.error || 'Có lỗi xảy ra khi gửi đáp án');
      }
    } catch (error) {
      console.error('Error submitting input:', error);
      setError('Có lỗi xảy ra khi gửi đáp án');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (isLoading && !game) {
    return (
      <main className="min-h-screen p-4 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-4">Đang tải...</h1>
          <p>Vui lòng đợi trong khi chúng tôi kết nối với phòng chơi</p>
        </div>
      </main>
    );
  }
  
  if (error && !game) {
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
  
  if (!game) return null;
  
  // Render waiting screen if game is in setup phase
  if (game.phase === 'setup') {
    return (
      <main className="min-h-screen p-4 bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="container mx-auto max-w-4xl py-8">
          <AnimatedDiv
            style={mainSpring}
            className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg text-center"
          >
            <h1 className="text-3xl font-bold mb-4 text-white">Đang đợi trò chơi bắt đầu</h1>
            <p className="text-white mb-6">
              Host đang thiết lập trò chơi. Vui lòng đợi trong giây lát...
            </p>
            
            <Card className="mb-6">
              <h3 className="text-lg font-medium mb-2">Thông tin người chơi</h3>
              <p><strong>Tên:</strong> {playerInfo?.name || 'Không xác định'}</p>
              <p><strong>Đội:</strong> {playerInfo?.teamName || 'Không xác định'}</p>
            </Card>
            
            <div className="animate-pulse flex justify-center">
              <div className="h-2 w-24 bg-blue-300 rounded"></div>
            </div>
          </AnimatedDiv>
        </div>
      </main>
    );
  }
  
  // Render input form during team-input phase
  if (game.phase === 'team-input') {
    return (
      <main className="min-h-screen p-4 bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="container mx-auto max-w-4xl py-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Nhập Thông Tin</h1>
            <p className="text-white/90">
              Vòng {game.currentRound + 1}/{game.rounds.length} - Thời gian còn lại: {timer} giây
            </p>
            
            <div className="w-full bg-gray-300 h-2 rounded-full mt-3 overflow-hidden">
              <AnimatedDiv
                className="bg-red-500 h-full"
                style={timerSpring}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatedDiv
              style={mainSpring}
              className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">Hình ảnh bị che</h2>
                <div className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center overflow-hidden">
                  {game.rounds[game.currentRound]?.hiddenImage ? (
                    <img 
                      src={game.rounds[game.currentRound].hiddenImage} 
                      alt="Hình ảnh bị che" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-500">Không có hình ảnh</div>
                  )}
                </div>
              </div>
              
              {!submitted ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-white mb-1 block">
                      Mô tả của bạn về hình ảnh này
                    </label>
                    <textarea
                      {...register('input')}
                      className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full min-h-[100px]"
                      placeholder="Nhập mô tả của bạn ở đây..."
                    />
                    {errors.input && (
                      <span className="text-red-400 text-xs">{errors.input.message}</span>
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
                    disabled={submitting || timer === 0}
                    fullWidth
                  >
                    {submitting ? 'Đang gửi...' : 'Gửi đáp án'}
                  </Button>
                </form>
              ) : (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-6 rounded text-center">
                  <h3 className="text-xl font-bold mb-2">Đã gửi đáp án!</h3>
                  <p>Bạn đã gửi đáp án thành công. Đang đợi các thành viên khác trong đội...</p>
                </div>
              )}
            </AnimatedDiv>
            
            <div>
              <AnimatedDiv
                style={mainSpring}
                className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg mb-6"
              >
                <h2 className="text-2xl font-bold text-white mb-4">Trạng thái đội</h2>
                
                <div className="space-y-3">
                  {teamMembers.map((member: Player) => (
                    <Card key={member.id} className="!p-4" hoverable={false}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                        <span 
                          className={`px-3 py-1 rounded-full text-xs ${
                            member.input 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {member.input ? 'Đã trả lời' : 'Chưa trả lời'}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </AnimatedDiv>
              
              <AnimatedDiv
                style={mainSpring}
                className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg"
              >
                <h2 className="text-2xl font-bold text-white mb-4">Hướng dẫn</h2>
                <ul className="text-white space-y-2 list-disc pl-5">
                  <li>Nhìn kỹ hình ảnh bị che và mô tả những gì bạn thấy</li>
                  <li>Mỗi thành viên trong đội sẽ nhập một mô tả khác nhau</li>
                  <li>Hệ thống sẽ tạo ra hình ảnh dựa trên mô tả của đội bạn</li>
                  <li>Khán giả sẽ bình chọn cho hình ảnh giống nhất với hình ảnh gốc</li>
                </ul>
              </AnimatedDiv>
            </div>
          </div>
        </div>
      </main>
    );
  }
  
  // Render waiting screen during audience-vote phase
  if (game.phase === 'audience-vote') {
    return (
      <main className="min-h-screen p-4 bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="container mx-auto max-w-4xl py-8">
          <AnimatedDiv
            style={mainSpring}
            className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg text-center"
          >
            <h1 className="text-3xl font-bold mb-4 text-white">Đang đợi kết quả bình chọn</h1>
            <p className="text-white mb-6">
              Khán giả đang bình chọn cho các hình ảnh. Vui lòng đợi kết quả...
            </p>
            
            <Card className="mb-6">
              <h3 className="text-lg font-medium mb-2">Thông tin vòng chơi</h3>
              <p><strong>Vòng:</strong> {game.currentRound + 1}/{game.rounds.length}</p>
              <p><strong>Đội:</strong> {playerInfo?.teamName || 'Không xác định'}</p>
            </Card>
            
            <div className="animate-pulse flex justify-center">
              <div className="h-2 w-24 bg-blue-300 rounded"></div>
            </div>
          </AnimatedDiv>
        </div>
      </main>
    );
  }
  
  // Render final results
  if (game.phase === 'ended') {
    // Sort teams by score (descending)
    const sortedTeams = [...game.teams].sort((a, b) => b.score - a.score);
    const myTeam = sortedTeams.find(team => team.id === teamId);
    const myTeamRank = sortedTeams.findIndex(team => team.id === teamId) + 1;
    
    return (
      <main className="min-h-screen p-4 bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="container mx-auto max-w-4xl py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Kết Quả Trò Chơi</h1>
            <p className="text-white/90">
              Trò chơi đã kết thúc! Cảm ơn bạn đã tham gia.
            </p>
          </div>
          
          <AnimatedDiv
            style={mainSpring}
            className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg mb-6"
          >
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Bảng Xếp Hạng</h2>
            
            <div className="space-y-4">
              {sortedTeams.slice(0, 3).map((team, index) => (
                <Card 
                  key={team.id} 
                  className={`!p-6 border-2 ${
                    team.id === teamId ? 'border-yellow-400' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center mr-4 text-xl font-bold
                      ${index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                        index === 1 ? 'bg-gray-100 text-gray-800' : 
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'}
                    `}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{team.name}</h3>
                      <p className="text-gray-600">Thành viên: {team.members.length}</p>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">{team.score}</div>
                  </div>
                  
                  {team.id === teamId && (
                    <div className="mt-4 bg-yellow-50 p-3 rounded border border-yellow-200 text-center">
                      <p className="text-yellow-800 font-medium">Đội của bạn!</p>
                    </div>
                  )}
                </Card>
              ))}
              
              {myTeamRank > 3 && myTeam && (
                <div className="pt-4 border-t border-white/20">
                  <Card className="!p-6 border-2 border-yellow-400">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mr-4 text-xl font-bold">
                        {myTeamRank}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">{myTeam.name}</h3>
                        <p className="text-gray-600">Thành viên: {myTeam.members.length}</p>
                      </div>
                      <div className="text-3xl font-bold text-blue-600">{myTeam.score}</div>
                    </div>
                    <div className="mt-4 bg-yellow-50 p-3 rounded border border-yellow-200 text-center">
                      <p className="text-yellow-800 font-medium">Đội của bạn!</p>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </AnimatedDiv>
          
          <div className="text-center">
            <Button
              onClick={() => router.push('/')}
              variant="primary"
              size="lg"
              className="mt-6"
            >
              Quay lại trang chủ
            </Button>
          </div>
        </div>
      </main>
    );
  }
  
  // Default fallback
  return (
    <main className="min-h-screen p-4 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-3xl font-bold mb-4">Đang đợi...</h1>
        <p>Chúng tôi đang chuẩn bị trò chơi. Vui lòng đợi trong giây lát.</p>
      </div>
    </main>
  );
} 