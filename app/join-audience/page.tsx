'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { animated, useSpring } from 'react-spring';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Card } from '@/app/components/ui/Card';

const AnimatedDiv = animated('div');

type JoinAudienceFormData = {
  name: string;
  email: string;
};

const schema = yup.object({
  name: yup.string().required('Tên là bắt buộc'),
  email: yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
});

export default function JoinAudiencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get('gameId');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinAudienceFormData>({
    resolver: yupResolver(schema),
  });
  
  const [formSpring, formApi] = useSpring(() => ({
    opacity: 0,
    y: 30,
  }));
  
  const [infoSpring, infoApi] = useSpring(() => ({
    opacity: 0,
    y: 30,
  }));
  
  React.useEffect(() => {
    formApi.start({
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
  }, [formApi, infoApi]);
  
  const onSubmit = async (data: JoinAudienceFormData) => {
    if (!gameId) {
      setError('Thiếu ID phòng');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/audience', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          name: data.name,
          email: data.email,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Lưu thông tin người xem vào localStorage để dùng sau này
        localStorage.setItem('audience', JSON.stringify({
          id: result.audienceId,
          name: data.name,
          email: data.email,
          gameId,
        }));
        
        // Chuyển hướng đến trang chờ/chơi
        router.push(`/game-audience?gameId=${gameId}&audienceId=${result.audienceId}`);
      } else {
        setError(result.error || 'Có lỗi xảy ra khi tham gia');
      }
    } catch (error) {
      console.error('Error joining as audience:', error);
      setError('Có lỗi xảy ra khi tham gia');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!gameId) {
    return (
      <main className="min-h-screen p-4 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <h1 className="text-3xl font-bold mb-4 text-white">Lỗi</h1>
          <p className="text-white mb-6">Không tìm thấy ID phòng trong URL</p>
          <Button onClick={() => router.push('/')} variant="primary">
            Quay lại trang chủ
          </Button>
        </div>
      </main>
    );
  }
  
  return (
    <main className="min-h-screen p-4 bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="container mx-auto max-w-4xl py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Tham Gia Khán Giả</h1>
          <p className="text-white/90">
            Đăng ký để trở thành người bình chọn trong trò chơi
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatedDiv
            style={formSpring}
            className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Tên của bạn"
                {...register('name')}
                error={errors.name?.message}
                fullWidth
              />
              
              <Input
                label="Email"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                fullWidth
              />
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading}
                fullWidth
                className="mt-6"
              >
                {isLoading ? 'Đang tham gia...' : 'Tham Gia'}
              </Button>
            </form>
          </AnimatedDiv>
          
          <AnimatedDiv
            style={infoSpring}
            className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Thông tin khán giả</h2>
            
            <Card className="mb-6">
              <h3 className="text-lg font-medium mb-3">Vai trò của bạn</h3>
              <p className="text-gray-600 mb-4">
                Là khán giả, bạn sẽ được xem và bình chọn cho các đội trong trò chơi. 
                Sự lựa chọn của bạn sẽ quyết định đội nào giành chiến thắng!
              </p>
              <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                <p className="text-yellow-800 font-medium">Lưu ý:</p>
                <p className="text-yellow-700 text-sm">
                  Bạn sẽ cần đợi các đội chơi nhập thông tin trước khi được bình chọn.
                </p>
              </div>
            </Card>
            
            <Card>
              <h3 className="text-lg font-medium mb-3">Hướng dẫn</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">1</span>
                  <span>Đăng ký với tên và email của bạn</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">2</span>
                  <span>Đợi đến lượt bình chọn</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">3</span>
                  <span>Xem các hình ảnh được tạo và chọn hình yêu thích nhất</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">4</span>
                  <span>Người bình chọn đúng sẽ được giải thưởng (nếu có)</span>
                </li>
              </ul>
            </Card>
          </AnimatedDiv>
        </div>
      </div>
    </main>
  );
} 