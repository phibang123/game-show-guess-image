import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { GameState, Player, Team } from '@/app/lib/stores/gameStore';

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

// Tạo team mới
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.gameId || !data.teamName) {
      return NextResponse.json({ error: 'Game ID and team name are required' }, { status: 400 });
    }
    
    const games = readGameData();
    const game = games[data.gameId];
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    // Kiểm tra số lượng team tối đa
    if (game.teams.length >= game.maxTeams) {
      return NextResponse.json({ error: 'Maximum number of teams reached' }, { status: 400 });
    }
    
    // Tạo team mới
    const teamId = Math.random().toString(36).substring(2, 9);
    const newTeam: Team = {
      id: teamId,
      name: data.teamName,
      members: [],
      score: 0
    };
    
    game.teams.push(newTeam);
    games[data.gameId] = game;
    writeGameData(games);
    
    return NextResponse.json({ teamId, teamName: data.teamName });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}

// Thêm người chơi vào team
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.gameId || !data.teamId || !data.player) {
      return NextResponse.json({ 
        error: 'Game ID, team ID, and player data are required' 
      }, { status: 400 });
    }
    
    const { name, email } = data.player;
    if (!name || !email) {
      return NextResponse.json({ 
        error: 'Player name and email are required' 
      }, { status: 400 });
    }
    
    const games = readGameData();
    const game = games[data.gameId];
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    // Tìm team
    const teamIndex = game.teams.findIndex(t => t.id === data.teamId);
    if (teamIndex === -1) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    
    // Kiểm tra số lượng thành viên tối đa
    if (game.teams[teamIndex].members.length >= game.maxTeamMembers) {
      return NextResponse.json({ 
        error: 'Maximum number of team members reached' 
      }, { status: 400 });
    }
    
    // Thêm người chơi vào team
    const playerId = Math.random().toString(36).substring(2, 9);
    const player: Player = {
      id: playerId,
      name,
      email,
      teamId: data.teamId
    };
    
    game.teams[teamIndex].members.push(player);
    games[data.gameId] = game;
    writeGameData(games);
    
    return NextResponse.json({ 
      playerId, 
      teamId: data.teamId,
      teamName: game.teams[teamIndex].name
    });
  } catch (error) {
    console.error('Error adding player to team:', error);
    return NextResponse.json({ error: 'Failed to add player to team' }, { status: 500 });
  }
}

// Gửi input của người chơi
export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.gameId || !data.teamId || !data.playerId || data.input === undefined) {
      return NextResponse.json({ 
        error: 'Game ID, team ID, player ID, and input are required' 
      }, { status: 400 });
    }
    
    const games = readGameData();
    const game = games[data.gameId];
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    // Tìm team
    const teamIndex = game.teams.findIndex(t => t.id === data.teamId);
    if (teamIndex === -1) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    
    // Tìm người chơi
    const playerIndex = game.teams[teamIndex].members.findIndex(p => p.id === data.playerId);
    if (playerIndex === -1) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    
    // Kiểm tra phase hiện tại
    if (game.phase !== 'team-input') {
      return NextResponse.json({ error: 'Cannot submit input in current phase' }, { status: 400 });
    }
    
    // Cập nhật input người chơi
    game.teams[teamIndex].members[playerIndex].input = data.input;
    
    // Cập nhật input vào round hiện tại
    const currentRound = game.currentRound;
    if (!game.rounds[currentRound].teamInputs[data.teamId]) {
      game.rounds[currentRound].teamInputs[data.teamId] = [];
    }
    
    // Thu thập tất cả input của team
    const allTeamInputs = game.teams[teamIndex].members
      .map(m => m.input || '')
      .filter(input => input !== '');
    
    game.rounds[currentRound].teamInputs[data.teamId] = allTeamInputs;
    
    // Lưu lại thay đổi
    games[data.gameId] = game;
    writeGameData(games);
    
    return NextResponse.json({ 
      success: true,
      message: 'Input submitted successfully',
      allTeamInputs
    });
  } catch (error) {
    console.error('Error submitting player input:', error);
    return NextResponse.json({ error: 'Failed to submit player input' }, { status: 500 });
  }
} 