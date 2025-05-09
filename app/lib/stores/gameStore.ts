import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Team = {
  id: string;
  name: string;
  members: Player[];
  score: number;
};

export type Player = {
  id: string;
  name: string;
  email: string;
  teamId?: string;
  input?: string;
};

export type Audience = {
  id: string;
  name: string;
  email: string;
  votedFor?: string;
};

export type Round = {
  id: string;
  hiddenImage: string;
  teamInputs: Record<string, string[]>;
  generatedImages: Record<string, string>;
  votes: Record<string, string[]>;
  endTime?: number;
};

export type GameState = {
  gameId: string;
  hostCode: string;
  teams: Team[];
  audience: Audience[];
  maxTeams: number;
  maxTeamMembers: number;
  rounds: Round[];
  currentRound: number;
  phase: 'setup' | 'team-input' | 'audience-vote' | 'results' | 'ended';
  timeLimit: number;
  roundsCount: number;
};

export type GameStore = {
  game: GameState;
  isLoading: boolean;
  
  // Host actions
  createGame: (hostCode: string) => void;
  setMaxTeams: (max: number) => void;
  setMaxTeamMembers: (max: number) => void;
  setTimeLimit: (seconds: number) => void;
  setRoundsCount: (count: number) => void;
  startGame: () => void;
  nextPhase: () => void;
  endGame: () => void;
  
  // Team actions
  createTeam: (name: string) => string;
  joinTeam: (player: Player, teamId: string) => void;
  submitInput: (playerId: string, input: string) => void;
  
  // Audience actions
  joinAudience: (audience: Audience) => void;
  submitVote: (audienceId: string, teamId: string) => void;
  
  // Utility
  resetGame: () => void;
};

const initialGameState: GameState = {
  gameId: '',
  hostCode: '',
  teams: [],
  audience: [],
  maxTeams: 5,
  maxTeamMembers: 5,
  rounds: [],
  currentRound: 0,
  phase: 'setup',
  timeLimit: 60,
  roundsCount: 5,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      game: initialGameState,
      isLoading: false,
      
      createGame: (hostCode: string) => set(state => ({
        game: {
          ...state.game,
          gameId: Math.random().toString(36).substring(2, 15),
          hostCode,
        }
      })),
      
      setMaxTeams: (max: number) => set(state => ({
        game: { ...state.game, maxTeams: max }
      })),
      
      setMaxTeamMembers: (max: number) => set(state => ({
        game: { ...state.game, maxTeamMembers: max }
      })),
      
      setTimeLimit: (seconds: number) => set(state => ({
        game: { ...state.game, timeLimit: seconds }
      })),
      
      setRoundsCount: (count: number) => set(state => ({
        game: { ...state.game, roundsCount: count }
      })),
      
      startGame: () => {
        const { roundsCount } = get().game;
        const rounds: Round[] = Array.from({ length: roundsCount }, (_, i) => ({
          id: `round-${i + 1}`,
          hiddenImage: `/images/hidden-${(i % 5) + 1}.jpg`,
          teamInputs: {},
          generatedImages: {},
          votes: {},
        }));
        
        set(state => ({
          game: {
            ...state.game,
            rounds,
            currentRound: 0,
            phase: 'team-input',
          }
        }));
      },
      
      nextPhase: () => {
        const { phase, currentRound, rounds, roundsCount } = get().game;
        
        if (phase === 'team-input') {
          // Generate images based on team inputs (in a real app, this would call an AI service)
          const currentRoundData = { ...rounds[currentRound] };
          const teams = get().game.teams;
          
          teams.forEach(team => {
            // Mock image generation based on team inputs
            currentRoundData.generatedImages[team.id] = `/images/generated-${(currentRound % 5) + 1}-${team.id.slice(0, 3)}.jpg`;
          });
          
          const updatedRounds = [...rounds];
          updatedRounds[currentRound] = currentRoundData;
          
          set(state => ({
            game: {
              ...state.game,
              rounds: updatedRounds,
              phase: 'audience-vote'
            }
          }));
        } else if (phase === 'audience-vote') {
          // Calculate scores based on votes
          const currentRoundData = rounds[currentRound];
          const teams = [...get().game.teams];
          
          // Count votes for each team
          Object.values(currentRoundData.votes).forEach(teamIds => {
            teamIds.forEach(teamId => {
              const teamIndex = teams.findIndex(t => t.id === teamId);
              if (teamIndex >= 0) {
                teams[teamIndex].score += 1;
              }
            });
          });
          
          if (currentRound + 1 >= roundsCount) {
            // Game ended
            set(state => ({
              game: {
                ...state.game,
                teams,
                phase: 'ended'
              }
            }));
          } else {
            // Next round
            set(state => ({
              game: {
                ...state.game,
                teams,
                currentRound: currentRound + 1,
                phase: 'team-input'
              }
            }));
          }
        }
      },
      
      endGame: () => set(state => ({
        game: { ...state.game, phase: 'ended' }
      })),
      
      createTeam: (name: string) => {
        const teamId = Math.random().toString(36).substring(2, 9);
        set(state => ({
          game: {
            ...state.game,
            teams: [
              ...state.game.teams,
              { id: teamId, name, members: [], score: 0 }
            ]
          }
        }));
        return teamId;
      },
      
      joinTeam: (player: Player, teamId: string) => set(state => {
        const teams = [...state.game.teams];
        const teamIndex = teams.findIndex(t => t.id === teamId);
        
        if (teamIndex >= 0 && teams[teamIndex].members.length < state.game.maxTeamMembers) {
          teams[teamIndex].members = [...teams[teamIndex].members, { ...player, teamId }];
          return { game: { ...state.game, teams } };
        }
        
        return state;
      }),
      
      submitInput: (playerId: string, input: string) => set(state => {
        const teams = [...state.game.teams];
        let playerTeamId = '';
        let updated = false;
        
        // Find the player and update their input
        teams.forEach((team, teamIndex) => {
          const playerIndex = team.members.findIndex(m => m.id === playerId);
          if (playerIndex >= 0) {
            teams[teamIndex].members[playerIndex].input = input;
            playerTeamId = team.id;
            updated = true;
          }
        });
        
        if (!updated) return state;
        
        // Update round data with the team's inputs
        const rounds = [...state.game.rounds];
        const currentRound = state.game.currentRound;
        
        if (!rounds[currentRound].teamInputs[playerTeamId]) {
          rounds[currentRound].teamInputs[playerTeamId] = [];
        }
        
        // Add/update player input to the round's team inputs
        const allPlayerInputs = teams
          .find(t => t.id === playerTeamId)?.members
          .map(m => m.input || '')
          .filter(input => input !== '');
          
        rounds[currentRound].teamInputs[playerTeamId] = allPlayerInputs || [];
        
        return {
          game: {
            ...state.game,
            teams,
            rounds
          }
        };
      }),
      
      joinAudience: (audience: Audience) => set(state => ({
        game: {
          ...state.game,
          audience: [...state.game.audience, audience]
        }
      })),
      
      submitVote: (audienceId: string, teamId: string) => set(state => {
        const rounds = [...state.game.rounds];
        const currentRound = state.game.currentRound;
        
        if (!rounds[currentRound].votes[audienceId]) {
          rounds[currentRound].votes[audienceId] = [];
        }
        
        rounds[currentRound].votes[audienceId] = [teamId];
        
        // Update audience member's vote
        const audience = state.game.audience.map(a => 
          a.id === audienceId ? { ...a, votedFor: teamId } : a
        );
        
        return {
          game: {
            ...state.game,
            rounds,
            audience
          }
        };
      }),
      
      resetGame: () => set({ game: initialGameState }),
    }),
    {
      name: 'game-storage',
    }
  )
); 