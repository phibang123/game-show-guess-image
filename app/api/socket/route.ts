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