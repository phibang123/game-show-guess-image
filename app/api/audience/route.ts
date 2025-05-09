import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { Audience, GameState } from '@/app/lib/stores/gameStore';

const DATA_FILE = path.join(process.cwd(), 'app/data/games.json');

// Đọc dữ liệu game
const readGameData = (): Record<string, GameState> => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading game data:', error);
    return {};
  }
};

// Ghi dữ liệu game
const writeGameData = (games: Record<string, GameState>) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(games, null, 2));
  } catch (error) {
    console.error('Error writing game data:', error);
  }
};

// Thêm người khán giả mới
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.gameId || !data.name || !data.email) {
      return NextResponse.json({ 
        error: 'Game ID, name, and email are required' 
      }, { status: 400 });
    }
    
    const games = readGameData();
    const game = games[data.gameId];
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    // Tạo người khán giả mới
    const audienceId = Math.random().toString(36).substring(2, 9);
    const newAudience: Audience = {
      id: audienceId,
      name: data.name,
      email: data.email
    };
    
    game.audience.push(newAudience);
    games[data.gameId] = game;
    writeGameData(games);
    
    return NextResponse.json({ 
      audienceId, 
      name: data.name,
      gameId: data.gameId
    });
  } catch (error) {
    console.error('Error creating audience member:', error);
    return NextResponse.json({ error: 'Failed to create audience member' }, { status: 500 });
  }
}

// Gửi vote của khán giả
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.gameId || !data.audienceId || !data.teamId) {
      return NextResponse.json({ 
        error: 'Game ID, audience ID, and team ID are required' 
      }, { status: 400 });
    }
    
    const games = readGameData();
    const game = games[data.gameId];
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    // Tìm người khán giả
    const audienceIndex = game.audience.findIndex(a => a.id === data.audienceId);
    if (audienceIndex === -1) {
      return NextResponse.json({ error: 'Audience member not found' }, { status: 404 });
    }
    
    // Kiểm tra phase hiện tại
    if (game.phase !== 'audience-vote') {
      return NextResponse.json({ error: 'Cannot vote in current phase' }, { status: 400 });
    }
    
    // Tìm team được vote
    const teamIndex = game.teams.findIndex(t => t.id === data.teamId);
    if (teamIndex === -1) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    
    // Cập nhật vote của khán giả
    game.audience[audienceIndex].votedFor = data.teamId;
    
    // Cập nhật vote vào round hiện tại
    const currentRound = game.currentRound;
    if (!game.rounds[currentRound].votes[data.audienceId]) {
      game.rounds[currentRound].votes[data.audienceId] = [];
    }
    
    game.rounds[currentRound].votes[data.audienceId] = [data.teamId];
    
    // Lưu lại thay đổi
    games[data.gameId] = game;
    writeGameData(games);
    
    // Tính toán số vote hiện tại cho từng team
    const voteCount: Record<string, number> = {};
    Object.values(game.rounds[currentRound].votes).forEach(teamIds => {
      teamIds.forEach(teamId => {
        voteCount[teamId] = (voteCount[teamId] || 0) + 1;
      });
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Vote submitted successfully',
      voteCount
    });
  } catch (error) {
    console.error('Error submitting vote:', error);
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 });
  }
}

// Lấy kết quả vote hiện tại
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    
    if (!gameId) {
      return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
    }
    
    const games = readGameData();
    const game = games[gameId];
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    const currentRound = game.currentRound;
    if (currentRound >= game.rounds.length) {
      return NextResponse.json({ error: 'Invalid round' }, { status: 400 });
    }
    
    // Tính toán số vote hiện tại cho từng team
    const voteCount: Record<string, number> = {};
    Object.values(game.rounds[currentRound].votes).forEach(teamIds => {
      teamIds.forEach(teamId => {
        voteCount[teamId] = (voteCount[teamId] || 0) + 1;
      });
    });
    
    // Lấy thông tin team name
    const teamInfo = game.teams.reduce((acc, team) => {
      acc[team.id] = {
        name: team.name,
        voteCount: voteCount[team.id] || 0
      };
      return acc;
    }, {} as Record<string, { name: string; voteCount: number }>);
    
    return NextResponse.json({ 
      phase: game.phase,
      voteCount,
      teamInfo
    });
  } catch (error) {
    console.error('Error getting vote results:', error);
    return NextResponse.json({ error: 'Failed to get vote results' }, { status: 500 });
  }
} 