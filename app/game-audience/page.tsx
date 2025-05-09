'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { animated, useSpring } from 'react-spring';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { GameState, Audience } from '@/app/lib/stores/gameStore';

const AnimatedDiv = animated('div');

type AudienceInfo = Audience & {
  gameId: string;
};

export default function GameAudiencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get('gameId');
  const audienceId = searchParams.get('audienceId');
  
  const [game, setGame] = useState<GameState | null>(null);
  const [audienceInfo, setAudienceInfo] = useState<AudienceInfo | null>(null);
  const [votedTeamId, setVotedTeamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const [voteResults, setVoteResults] = useState<Record<string, number>>({});
  const [timer, setTimer] = useState<number>(30);
  
  const [mainSpring, mainApi] = useSpring(() => ({
    opacity: 0,
    y: 30,
  }));
  
  const [timerSpring, timerApi] = useSpring(() => ({
    width: '100%',
  }));
  
  const [cardsSpring, cardsApi] = useSpring(() => ({
    opacity: 0,
    y: 30,
  }));
  
  useEffect(() => {
    // Animating the entrance
    mainApi.start({
      opacity: 1,
      y: 0,
      config: { tension: 120, friction: 14 },
      delay: 200,
    });
    
    cardsApi.start({
      opacity: 1,
      y: 0,
      config: { tension: 120, friction: 14 },
      delay: 400,
    });
    
    // Try to get audience info from localStorage first
    const storedAudience = localStorage.getItem('audience');
    if (storedAudience) {
      try {
        const audienceData = JSON.parse(storedAudience);
        if (audienceData.gameId === gameId && audienceData.id === audienceId) {
          setAudienceInfo(audienceData);
        }
      } catch (e) {
        console.error('Error parsing stored audience data:', e);
      }
    }
    
    // Initial game data fetch
    fetchGameData();
    
    // Set up polling for game updates - every 5 seconds
    const interval = setInterval(fetchGameData, 5000);
    
    return () => clearInterval(interval);
  }, [mainApi, cardsApi, gameId, audienceId]);
  
  useEffect(() => {
    if (!game) return;
    
    // If we're in the audience-vote phase, start the timer for voting
    if (game && game.phase === 'audience-vote') {
      setTimer(30); // For example, 30 seconds for voting
      
      // Animate the timer bar
      timerApi.start({
        width: '0%',
        config: {
          duration: 30 * 1000, // 30 seconds
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
    
    // Update vote results if game phase is audience-vote
    if (game && game.phase === 'audience-vote') {
      fetchVoteResults();
      
      // Set up polling for vote results - every 5 seconds
      const voteInterval = setInterval(fetchVoteResults, 5000);
      
      return () => clearInterval(voteInterval);
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
      
      // Check if audience member has already voted
      if (audienceId && gameData.phase === 'audience-vote') {
        const audienceIndex = gameData.audience.findIndex((a: Audience) => a.id === audienceId);
        if (audienceIndex >= 0 && gameData.audience[audienceIndex].votedFor) {
          setVotedTeamId(gameData.audience[audienceIndex].votedFor);
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching game data:', error);
      setError((error as Error).message || 'Có lỗi xảy ra khi tải dữ liệu trò chơi');
      setIsLoading(false);
    }
  };
  
  const fetchVoteResults = async () => {
    if (!gameId) return;
    
    try {
      const response = await fetch(`/api/audience?gameId=${gameId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể tải kết quả bình chọn');
      }
      
      const voteData = await response.json();
      setVoteResults(voteData.voteCount || {});
    } catch (error) {
      console.error('Error fetching vote results:', error);
    }
  };
  
  const handleVote = async (teamId: string) => {
    if (!gameId || !audienceId) {
      setError('Thiếu thông tin cần thiết');
      return;
    }
    
    try {
      setVoting(true);
      
      const response = await fetch('/api/audience', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          audienceId,
          teamId,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setVotedTeamId(teamId);
        setVoteResults(result.voteCount || {});
      } else {
        setError(result.error || 'Có lỗi xảy ra khi bình chọn');
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      setError('Có lỗi xảy ra khi bình chọn');
    } finally {
      setVoting(false);
    }
  };
  
  // Helper function to get team name from id
  const getTeamName = (teamId: string) => {
    if (!game) return 'Unknown';
    const team = game.teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown';
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
  
  // Render waiting screen if game is in setup or team-input phase
  if (game.phase === 'setup' || game.phase === 'team-input') {
    return (
      <main className="min-h-screen p-4 bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="container mx-auto max-w-4xl py-8">
          <AnimatedDiv
            style={mainSpring}
            className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg text-center"
          >
            <h1 className="text-3xl font-bold mb-4 text-white">
              {game.phase === 'setup' 
                ? 'Đang đợi trò chơi bắt đầu' 
                : 'Đang đợi các đội nhập dữ liệu'
              }
            </h1>
            <p className="text-white mb-6">
              {game.phase === 'setup'
                ? 'Host đang thiết lập trò chơi. Vui lòng đợi trong giây lát...'
                : 'Các đội đang nhập thông tin. Bạn sẽ được bình chọn sau khi họ hoàn thành.'
              }
            </p>
            
            <Card className="mb-6">
              <h3 className="text-lg font-medium mb-2">Thông tin người xem</h3>
              <p><strong>Tên:</strong> {audienceInfo?.name || 'Không xác định'}</p>
              <p><strong>Vòng:</strong> {game.phase === 'team-input' ? `${game.currentRound + 1}/${game.rounds.length}` : 'Chưa bắt đầu'}</p>
            </Card>
            
            <div className="animate-pulse flex justify-center">
              <div className="h-2 w-24 bg-blue-300 rounded"></div>
            </div>
          </AnimatedDiv>
        </div>
      </main>
    );
  }
  
  // Render voting screen during audience-vote phase
  if (game.phase === 'audience-vote') {
    const currentRound = game.currentRound;
    const generatedImages = game.rounds[currentRound]?.generatedImages || {};
    const hiddenImage = game.rounds[currentRound]?.hiddenImage;
    
    return (
      <main className="min-h-screen p-4 bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="container mx-auto max-w-4xl py-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Bình Chọn Hình Ảnh</h1>
            <p className="text-white/90">
              Vòng {currentRound + 1}/{game.rounds.length} - Thời gian còn lại: {timer} giây
            </p>
            
            <div className="w-full bg-gray-300 h-2 rounded-full mt-3 overflow-hidden">
              <AnimatedDiv
                className="bg-red-500 h-full"
                style={timerSpring}
              />
            </div>
          </div>
          
          <div className="mb-8">
            <AnimatedDiv
              style={mainSpring}
              className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Hình ảnh gốc bị che</h2>
              <div className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center overflow-hidden">
                {hiddenImage ? (
                  <img 
                    src={hiddenImage} 
                    alt="Hình ảnh bị che" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-500">Không có hình ảnh</div>
                )}
              </div>
              
              <p className="mt-4 text-white text-center">
                Dựa vào hình ảnh bị che trên, hãy bình chọn cho hình ảnh mà bạn nghĩ giống nhất với hình ảnh gốc
              </p>
            </AnimatedDiv>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(generatedImages).map(([teamId, imageUrl]) => {
              const teamVotes = voteResults[teamId] || 0;
              const isVoted = votedTeamId === teamId;
              
              return (
                <AnimatedDiv
                  key={teamId}
                  style={cardsSpring}
                  className={`bg-white/10 backdrop-blur-sm p-4 rounded-2xl shadow-lg ${
                    isVoted ? 'ring-4 ring-yellow-400' : ''
                  }`}
                >
                  <div className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center overflow-hidden mb-3">
                    <img 
                      src={imageUrl} 
                      alt={`Hình ảnh đội ${getTeamName(teamId)}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-white">
                      Đội: {getTeamName(teamId)}
                    </h3>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                      {teamVotes} phiếu
                    </span>
                  </div>
                  
                  <Button
                    onClick={() => handleVote(teamId)}
                    variant={isVoted ? 'success' : 'primary'}
                    disabled={!!votedTeamId || voting || timer === 0}
                    fullWidth
                  >
                    {isVoted 
                      ? 'Đã bình chọn' 
                      : voting 
                        ? 'Đang bình chọn...' 
                        : 'Bình chọn'
                    }
                  </Button>
                </AnimatedDiv>
              );
            })}
          </div>
          
          {votedTeamId && (
            <AnimatedDiv
              style={{
                opacity: mainSpring.opacity,
                y: mainSpring.y,
              }}
              className="mt-8 bg-green-100 border border-green-400 text-green-700 px-4 py-6 rounded text-center"
            >
              <h3 className="text-xl font-bold mb-2">Đã bình chọn thành công!</h3>
              <p>Cảm ơn bạn đã bình chọn cho Đội {getTeamName(votedTeamId)}.</p>
            </AnimatedDiv>
          )}
        </div>
      </main>
    );
  }
  
  // Render final results
  if (game.phase === 'ended') {
    // Sort teams by score (descending)
    const sortedTeams = [...game.teams].sort((a, b) => b.score - a.score);
    const myVotedTeam = sortedTeams.find(team => team.id === audienceInfo?.votedFor);
    
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
                    team.id === audienceInfo?.votedFor ? 'border-yellow-400' : 'border-transparent'
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
                  
                  {team.id === audienceInfo?.votedFor && (
                    <div className="mt-4 bg-yellow-50 p-3 rounded border border-yellow-200 text-center">
                      <p className="text-yellow-800 font-medium">Bạn đã bình chọn đội này!</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
            
            {myVotedTeam && sortedTeams.indexOf(myVotedTeam) > 2 && (
              <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg text-white">
                <p className="text-center">
                  Đội bạn bình chọn ({myVotedTeam.name}) đã về hạng {sortedTeams.indexOf(myVotedTeam) + 1}
                </p>
              </div>
            )}
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