/*
TODO: Cài đặt Socket.IO Server cho ứng dụng

Trong tương lai, chúng ta sẽ thay thế cơ chế polling (request định kỳ) bằng Socket.IO 
để cập nhật dữ liệu thời gian thực. Hiện tại, chúng ta đang sử dụng polling
mỗi 3-5 giây để cập nhật trạng thái trò chơi, vote, và kết quả.

Hướng dẫn cài đặt Socket.IO Server:

1. Cài đặt socket.io và socket.io-client (đã cài đặt)
2. Tạo socket.io server trong file api/socket/route.ts
3. Thiết lập các sự kiện socket.io:
   - Tham gia phòng (join-room)
   - Cập nhật trạng thái trò chơi (game-update)
   - Nhập dữ liệu người chơi (player-input)
   - Bình chọn của khán giả (audience-vote)
   - Kết quả bình chọn (vote-results)
   - Chuyển giai đoạn trò chơi (phase-change)
   - Kết thúc trò chơi (game-end)

4. Cập nhật các component sử dụng socket.io thay vì polling:
   - Host game page
   - Team game page
   - Audience game page

Ví dụ cài đặt Socket.IO Server:

```typescript
import { createServer } from 'http';
import { Server } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';

const ioHandler = (req: NextApiRequest, res: NextApiResponse) => {
  if (!res.socket.server.io) {
    const httpServer = createServer();
    const io = new Server(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
      });

      socket.on('game-update', (data) => {
        io.to(data.gameId).emit('game-updated', data);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
};

export default ioHandler;
```

Sau đó, ở phía client, chúng ta sẽ sử dụng socket.io-client để kết nối và lắng nghe sự kiện.
*/

import { NextResponse } from 'next/server';
import { Server } from 'socket.io';

// Biến toàn cục để lưu trữ instances của Socket.IO Server
let io: Server;

export async function GET() {
  if (!io) {
    // Khởi tạo Socket.IO Server nếu chưa tồn tại
    io = new Server({
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    // Thiết lập các sự kiện socket
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Sự kiện tham gia phòng
      socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
      });

      // Sự kiện cập nhật trạng thái phòng (đội tham gia và người xem)
      socket.on('request-room-stats', async (gameId) => {
        try {
          // Giả lập dữ liệu từ database (thay thế bằng truy vấn thật sau)
          // Trong triển khai thực tế, bạn sẽ lấy dữ liệu từ Database (Redis, MongoDB, v.v.)
          const mockGame = {
            teams: Array(Math.floor(Math.random() * 5)).fill(null), 
            audience: Array(Math.floor(Math.random() * 20)).fill(null),
            maxTeams: 5
          };
          
          const roomStats = {
            gameId,
            teamsCount: mockGame.teams.length,
            audienceCount: mockGame.audience.length,
            maxTeams: mockGame.maxTeams,
          };
          
          // Phát sóng cập nhật đến tất cả clients trong phòng
          io.to(gameId).emit('room-stats-updated', roomStats);
        } catch (error) {
          console.error('Error fetching room stats:', error);
        }
      });

      // Cập nhật tự động mỗi 5 giây
      socket.on('start-auto-updates', (gameId) => {
        // Lưu interval ID vào socket để có thể xóa khi disconnect
        const intervalId = setInterval(async () => {
          try {
            // Giả lập dữ liệu từ database (thay thế bằng truy vấn thật sau)
            const mockGame = {
              teams: Array(Math.floor(Math.random() * 5)).fill(null),
              audience: Array(Math.floor(Math.random() * 20)).fill(null),
              maxTeams: 5
            };
            
            const roomStats = {
              gameId,
              teamsCount: mockGame.teams.length,
              audienceCount: mockGame.audience.length,
              maxTeams: mockGame.maxTeams,
            };
            
            io.to(gameId).emit('room-stats-updated', roomStats);
          } catch (error) {
            console.error('Error in auto-update:', error);
          }
        }, 5000); // Cập nhật mỗi 5 giây
        
        // Lưu intervalId vào socket data
        socket.data.autoUpdateInterval = intervalId;
      });
      
      // Dừng cập nhật tự động
      socket.on('stop-auto-updates', () => {
        if (socket.data.autoUpdateInterval) {
          clearInterval(socket.data.autoUpdateInterval);
        }
      });

      // Sự kiện ngắt kết nối
      socket.on('disconnect', () => {
        // Dọn dẹp interval khi client ngắt kết nối
        if (socket.data.autoUpdateInterval) {
          clearInterval(socket.data.autoUpdateInterval);
        }
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  return new NextResponse('Socket.IO Server đang chạy', { status: 200 });
} 