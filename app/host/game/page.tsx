'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { animated, useSpring } from 'react-spring';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { GameState } from '@/app/lib/stores/gameStore';

const AnimatedDiv = animated('div');

export default function HostGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get('gameId');
  
  const [game, setGame] = useState<GameState | null>(null);
  const [hostCode, setHostCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  const [mainSpring, mainApi] = useSpring(() => ({
    opacity: 0,
    y: 30,
  }));
  
  const [timerSpring, timerApi] = useSpring(() => ({
    width: '100%',
  }));
  
  const [infoSpring, infoApi] = useSpring(() => ({
    opacity: 0,
    y: 30,
  }));
  
  useEffect(() => {
    // Animate the entrance
    mainApi.start({
      opacity: 1,
      y: 0,
      config: { tension: 120, friction: 14 },
      delay: 200,
    });
    
    infoApi.start({
      opacity: 1,
      y: 0,
      config: { tension: 120, friction: 14 },
      delay: 400,
    });
    
    // Get host code from localStorage
    const storedHostData = localStorage.getItem('hostData');
    if (storedHostData) {
      try {
        const data = JSON.parse(storedHostData);
        if (data.gameId === gameId) {
          setHostCode(data.hostCode);
        }
      } catch (e) {
        console.error('Error parsing stored host data:', e);
      }
    }
    
    // Initial game data fetch
    fetchGameData();
    
    // Set up polling for game updates
    const interval = setInterval(fetchGameData, 3000);
    
    return () => clearInterval(interval);
  }, [mainApi, infoApi, gameId]);
  
  useEffect(() => {
    if (!game || game.phase !== 'team-input') return;
    
    // Set up timer countdown
    if (game.timeLimit > 0) {
      setTimeLeft(game.timeLimit);
      
      // Animate the timer bar
      timerApi.start({
        width: '0%',
        config: {
          duration: game.timeLimit * 1000,
        },
      });
      
      const countdown = setInterval(() => {
        setTimeLeft(prev => {
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
    if (!gameId || !hostCode) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/game?gameId=${gameId}&hostCode=${hostCode}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể tải dữ liệu trò chơi');
      }
      
      const gameData = await response.json();
      setGame(gameData);
      
      // Store host data if not already stored
      if (!localStorage.getItem('hostData')) {
        localStorage.setItem('hostData', JSON.stringify({
          gameId,
          hostCode,
        }));
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching game data:', error);
      setError((error as Error).message || 'Có lỗi xảy ra khi tải dữ liệu trò chơi');
      setIsLoading(false);
    }
  };
  
  const handleNextPhase = async () => {
    if (!gameId || !hostCode) {
      setError('Thiếu thông tin cần thiết');
      return;
    }
    
    try {
      setActionLoading(true);
      
      const response = await fetch('/api/game', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          hostCode,
          phase: getNextPhase(game?.phase || 'setup'),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể cập nhật trạng thái trò chơi');
      }
      
      // Refresh game data
      fetchGameData();
    } catch (error) {
      console.error('Error moving to next phase:', error);
      setError((error as Error).message || 'Có lỗi xảy ra khi chuyển giai đoạn');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleEndGame = async () => {
    if (!gameId || !hostCode) {
      setError('Thiếu thông tin cần thiết');
      return;
    }
    
    // Confirm with host
    if (!window.confirm('Bạn có chắc chắn muốn kết thúc trò chơi?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      
      const response = await fetch('/api/game', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          hostCode,
          phase: 'ended',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể kết thúc trò chơi');
      }
      
      // Refresh game data
      fetchGameData();
    } catch (error) {
      console.error('Error ending game:', error);
      setError((error as Error).message || 'Có lỗi xảy ra khi kết thúc trò chơi');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Helper function to determine next phase
  const getNextPhase = (currentPhase: string) => {
    switch (currentPhase) {
      case 'setup':
        return 'team-input';
      case 'team-input':
        return 'audience-vote';
      case 'audience-vote':
        // If this is the last round, go to ended, else go to next round (team-input)
        if (game && game.currentRound + 1 >= game.roundsCount) {
          return 'ended';
        } else {
          return 'team-input';
        }
      default:
        return 'ended';
    }
  };
  
  // Helper function to get current phase display name
  const getPhaseDisplayName = (phase: string) => {
    switch (phase) {
      case 'setup':
        return 'Thiết lập';
      case 'team-input':
        return 'Nhập dữ liệu';
      case 'audience-vote':
        return 'Bình chọn';
      case 'ended':
        return 'Kết thúc';
      default:
        return phase;
    }
  };
  
  // Helper functions to check team and audience inputs
  const getTeamInputsCount = () => {
    if (!game || !game.rounds || game.currentRound >= game.rounds.length) return 0;
    
    const currentRound = game.rounds[game.currentRound];
    let count = 0;
    
    game.teams.forEach(team => {
      if (currentRound.teamInputs[team.id]?.length > 0) {
        count++;
      }
    });
    
    return count;
  };
  
  const getAudienceVotesCount = () => {
    if (!game || !game.rounds || game.currentRound >= game.rounds.length) return 0;
    
    const currentRound = game.rounds[game.currentRound];
    return Object.keys(currentRound.votes).length;
  };
  
  if (isLoading && !game) {
    return (
      <main className="min-h-screen p-4 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-4">Đang tải...</h1>
          <p>Vui lòng đợi trong khi chúng tôi kết nối với phòng chơi</p>
        </div>
      </main>
    );
  }
  
  if (!hostCode) {
    return (
      <main className="min-h-screen p-4 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <AnimatedDiv
          style={mainSpring}
          className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg max-w-md w-full"
        >
          <h1 className="text-3xl font-bold mb-6 text-white text-center">Xác thực Host</h1>
          
          <div className="mb-4">
            <label className="text-sm font-medium text-white mb-1 block">
              Mã Host
            </label>
            <input
              type="text"
              value={hostCode}
              onChange={e => setHostCode(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              placeholder="Nhập mã host của bạn"
            />
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <Button
            onClick={fetchGameData}
            variant="primary"
            size="lg"
            disabled={!hostCode}
            fullWidth
          >
            Xác thực
          </Button>
        </AnimatedDiv>
      </main>
    );
  }
  
  // Game has ended
  if (game?.phase === 'ended') {
    // Sort teams by score (descending)
    const sortedTeams = [...(game.teams || [])].sort((a, b) => b.score - a.score);
    
    return (
      <main className="min-h-screen p-4 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="container mx-auto max-w-4xl py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Kết Quả Trò Chơi</h1>
            <p className="text-white/90">
              Trò chơi đã kết thúc!
            </p>
          </div>
          
          <AnimatedDiv
            style={mainSpring}
            className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg mb-6"
          >
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Bảng Xếp Hạng</h2>
            
            <div className="space-y-4">
              {sortedTeams.map((team, index) => (
                <Card 
                  key={team.id} 
                  className="!p-6"
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
                </Card>
              ))}
            </div>
          </AnimatedDiv>
          
          <div className="text-center space-y-4">
            <Button
              onClick={() => router.push('/host')}
              variant="primary"
              size="lg"
              className="mr-4"
            >
              Tạo phòng mới
            </Button>
            
            <Button
              onClick={() => router.push('/')}
              variant="secondary"
              size="lg"
            >
              Quay lại trang chủ
            </Button>
          </div>
        </div>
      </main>
    );
  }
  
  // Main host control interface
  return (
    <main className="min-h-screen p-4 bg-gradient-to-br from-blue-600 to-purple-700">
      <div className="container mx-auto max-w-4xl py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Điều khiển trò chơi</h1>
            <p className="text-white/90">
              ID Phòng: <span className="font-mono font-bold">{gameId}</span>
            </p>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
            <span className="text-white font-medium">Giai đoạn: </span>
            <span className="text-yellow-300 font-bold">
              {getPhaseDisplayName(game?.phase || 'setup')}
            </span>
          </div>
        </div>
        
        {game?.phase === 'team-input' && (
          <div className="w-full bg-white/10 backdrop-blur-sm p-4 rounded-lg mb-8 text-center">
            <p className="text-white mb-2">
              Vòng {(game?.currentRound || 0) + 1}/{game?.roundsCount || 0} - Thời gian còn lại: {timeLeft} giây
            </p>
            <div className="w-full bg-gray-300 h-2 rounded-full overflow-hidden">
              <AnimatedDiv
                className="bg-red-500 h-full"
                style={timerSpring}
              />
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatedDiv
            style={mainSpring}
            className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Trạng thái hiện tại</h2>
            
            <Card className="mb-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Số đội tham gia</h3>
                <span className="text-3xl font-bold text-blue-600">
                  {game?.teams.length || 0}/{game?.maxTeams || 0}
                </span>
              </div>
            </Card>
            
            <Card className="mb-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Số người xem</h3>
                <span className="text-3xl font-bold text-green-600">
                  {game?.audience.length || 0}
                </span>
              </div>
            </Card>
            
            {game?.phase === 'team-input' && (
              <Card className="mb-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Đội đã gửi dữ liệu</h3>
                  <span className="text-3xl font-bold text-purple-600">
                    {getTeamInputsCount()}/{game?.teams.length || 0}
                  </span>
                </div>
              </Card>
            )}
            
            {game?.phase === 'audience-vote' && (
              <Card className="mb-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Khán giả đã bình chọn</h3>
                  <span className="text-3xl font-bold text-yellow-600">
                    {getAudienceVotesCount()}/{game?.audience.length || 0}
                  </span>
                </div>
              </Card>
            )}
            
            <div className="flex space-x-4 mt-6">
              <Button
                onClick={handleNextPhase}
                variant="primary"
                size="lg"
                disabled={actionLoading}
                fullWidth
              >
                {actionLoading ? 'Đang xử lý...' : 
                  game?.phase === 'setup' ? 'Bắt đầu trò chơi' :
                  game?.phase === 'team-input' ? 'Kết thúc nhập liệu' : 
                  game?.phase === 'audience-vote' && game?.currentRound + 1 >= (game?.roundsCount || 0)
                    ? 'Kết thúc trò chơi'
                    : 'Vòng tiếp theo'
                }
              </Button>
              
              {game?.phase !== 'setup' && (
                <Button
                  onClick={handleEndGame}
                  variant="danger"
                  size="lg"
                  disabled={actionLoading}
                >
                  Kết thúc
                </Button>
              )}
            </div>
          </AnimatedDiv>
          
          <div>
            <AnimatedDiv
              style={infoSpring}
              className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg mb-6"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Danh sách đội</h2>
              
              {game?.teams.length === 0 ? (
                <p className="text-white">Chưa có đội nào tham gia.</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {game?.teams.map(team => (
                    <Card key={team.id} className="!p-4" hoverable={false}>
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{team.name}</h3>
                          <p className="text-sm text-gray-500">Thành viên: {team.members.length}/{game?.maxTeamMembers}</p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          Điểm: {team.score}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </AnimatedDiv>
            
            <AnimatedDiv
              style={infoSpring}
              className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Hướng dẫn điều khiển</h2>
              <ul className="text-white space-y-2 list-disc pl-5">
                <li>Bạn có thể chuyển giai đoạn của trò chơi bằng nút điều khiển chính</li>
                <li>Trong giai đoạn nhập liệu, các đội sẽ nhập thông tin dựa trên hình ảnh</li>
                <li>Trong giai đoạn bình chọn, khán giả sẽ bình chọn cho các đội</li>
                <li>Khi kết thúc, bảng xếp hạng sẽ hiển thị đội thắng cuộc</li>
                <li>Bạn có thể kết thúc trò chơi bất cứ lúc nào</li>
              </ul>
            </AnimatedDiv>
          </div>
        </div>
      </div>
    </main>
  );
} 