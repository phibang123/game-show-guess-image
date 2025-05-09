import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { GameState } from '@/app/lib/stores/gameStore';

const DATA_FILE = path.join(process.cwd(), 'app/data/games.json');

// Đảm bảo thư mục data tồn tại
const ensureDataDir = () => {
  const dir = path.join(process.cwd(), 'app/data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}));
  }
};

// Đọc dữ liệu game
const readGameData = (): Record<string, GameState> => {
  ensureDataDir();
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
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(games, null, 2));
  } catch (error) {
    console.error('Error writing game data:', error);
  }
};

// Tạo game mới
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.hostCode) {
      return NextResponse.json({ error: 'Host code is required' }, { status: 400 });
    }
    
    const gameId = Math.random().toString(36).substring(2, 15);
    const games = readGameData();
    
    const newGame: GameState = {
      gameId,
      hostCode: data.hostCode,
      teams: [],
      audience: [],
      maxTeams: data.maxTeams || 5,
      maxTeamMembers: data.maxTeamMembers || 5,
      rounds: [],
      currentRound: 0,
      phase: 'setup',
      timeLimit: data.timeLimit || 60,
      roundsCount: data.roundsCount || 5,
    };
    
    games[gameId] = newGame;
    writeGameData(games);
    
    return NextResponse.json({ gameId, hostCode: data.hostCode });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
  }
}

// Lấy dữ liệu game
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const hostCode = searchParams.get('hostCode');
    
    if (!gameId) {
      return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
    }
    
    const games = readGameData();
    const game = games[gameId];
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    // Xác thực host nếu hostCode được cung cấp
    if (hostCode && game.hostCode !== hostCode) {
      return NextResponse.json({ error: 'Invalid host code' }, { status: 403 });
    }
    
    return NextResponse.json(game);
  } catch (error) {
    console.error('Error getting game:', error);
    return NextResponse.json({ error: 'Failed to get game' }, { status: 500 });
  }
}

// Cập nhật trạng thái game
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.gameId || !data.hostCode) {
      return NextResponse.json({ error: 'Game ID and host code are required' }, { status: 400 });
    }
    
    const games = readGameData();
    const game = games[data.gameId];
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    // Xác thực host
    if (game.hostCode !== data.hostCode) {
      return NextResponse.json({ error: 'Invalid host code' }, { status: 403 });
    }
    
    // Cập nhật trạng thái game
    if (data.phase) game.phase = data.phase;
    if (data.timeLimit) game.timeLimit = data.timeLimit;
    if (data.maxTeams) game.maxTeams = data.maxTeams;
    if (data.maxTeamMembers) game.maxTeamMembers = data.maxTeamMembers;
    if (data.roundsCount) game.roundsCount = data.roundsCount;
    if (data.currentRound !== undefined) game.currentRound = data.currentRound;
    
    // Cập nhật rounds nếu có
    if (data.startGame && game.phase === 'setup') {
      game.rounds = Array.from({ length: game.roundsCount }, (_, i) => ({
        id: `round-${i + 1}`,
        hiddenImage: `/images/hidden-${(i % 5) + 1}.jpg`,
        teamInputs: {},
        generatedImages: {},
        votes: {},
      }));
      game.currentRound = 0;
      game.phase = 'team-input';
    }
    
    games[data.gameId] = game;
    writeGameData(games);
    
    return NextResponse.json(game);
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
  }
} 