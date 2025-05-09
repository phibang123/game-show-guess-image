# Game Show Trực Tuyến

Ứng dụng game show trực tuyến tương tự như Kahoot, cho phép người chơi tham gia theo đội và khán giả bình chọn.

## Tính năng chính

- Tạo phòng chơi với mã QR
- Người chơi tham gia theo đội (tối đa 5 đội, mỗi đội 5 người)
- Khán giả tham gia bình chọn
- Hiệu ứng animation đẹp mắt
- Bảng xếp hạng và kết quả trò chơi

## Công nghệ sử dụng

- Next.js 14 (App Router)
- Tailwind CSS
- React Spring (animation)
- Zustand (state management)
- React Hook Form (form handling)
- Socket.IO (realtime communication) - hiện tại sử dụng polling thay thế

## Cài đặt

1. Clone repository:

```bash
git clone <repository-url>
cd gameshow-app
```

2. Cài đặt dependencies:

```bash
npm install
```

3. Chạy ứng dụng ở môi trường development:

```bash
npm run dev
```

4. Mở ứng dụng tại [http://localhost:3000](http://localhost:3000)

## Cách sử dụng

### Host

1. Truy cập trang chủ và chọn "Tạo phòng"
2. Thiết lập các thông số: số đội, số người mỗi đội, thời gian mỗi vòng, số vòng
3. Chia sẻ mã QR cho người chơi tham gia đội và khán giả
4. Bắt đầu trò chơi và điều khiển các giai đoạn

### Người chơi

1. Quét mã QR hoặc truy cập đường dẫn tham gia đội
2. Nhập tên, email và chọn đội
3. Nhập mô tả dựa trên hình ảnh được hiển thị
4. Xem kết quả sau khi trò chơi kết thúc

### Khán giả

1. Quét mã QR hoặc truy cập đường dẫn tham gia khán giả
2. Nhập tên và email
3. Chờ đến giai đoạn bình chọn và bình chọn cho hình ảnh yêu thích
4. Xem kết quả sau khi trò chơi kết thúc

## Cấu trúc thư mục

- `app/` - Mã nguồn chính của ứng dụng
  - `components/` - Các component UI tái sử dụng
  - `lib/` - Các tiện ích và state management
  - `api/` - API endpoints
  - `host/` - Trang dành cho host
  - `join-team/` - Trang tham gia đội
  - `join-audience/` - Trang tham gia khán giả
  - `game-team/` - Trang chơi game cho người trong đội
  - `game-audience/` - Trang bình chọn cho khán giả
  - `results/` - Trang kết quả

## Lưu ý phát triển tiếp theo

- Thêm xác thực người dùng
- Tích hợp API để generate hình ảnh thực tế từ AI
- Thêm tính năng realtime sử dụng Socket.IO
- Thêm cơ sở dữ liệu thực tế thay vì lưu vào file
- Thêm tính năng chat và tương tác giữa người chơi

## License

MIT
