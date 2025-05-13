'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { animated, useSpring } from 'react-spring';

import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { gameService } from '../api/services';

const AnimatedDiv = animated('div');

type SetupFormData = {
  hostCode: string;
  maxTeams: number;
  maxTeamMembers: number;
  timeLimit: number;
  roundsCount: number;
};

const schema = yup.object({
  hostCode: yup.string().required('Mã host là bắt buộc'),
  maxTeams: yup
    .number()
    .min(1, 'Số lượng tối thiểu là 1')
    .max(10, 'Số lượng tối đa là 10')
    .required('Số đội là bắt buộc'),
  maxTeamMembers: yup
    .number()
    .min(1, 'Số lượng tối thiểu là 1')
    .max(10, 'Số lượng tối đa là 10')
    .required('Số thành viên mỗi đội là bắt buộc'),
  timeLimit: yup
    .number()
    .min(10, 'Thời gian tối thiểu là 10 giây')
    .max(300, 'Thời gian tối đa là 300 giây')
    .required('Thời gian là bắt buộc'),
  roundsCount: yup
    .number()
    .min(1, 'Số vòng tối thiểu là 1')
    .max(10, 'Số vòng tối đa là 10')
    .required('Số vòng là bắt buộc'),
});

export default function HostPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      hostCode: '',
      maxTeams: 5,
      maxTeamMembers: 5,
      timeLimit: 60,
      roundsCount: 5,
    },
  });
  
  const [formSpring, formApi] = useSpring(() => ({
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
  }, [formApi]);
  
  const onSubmit = async (data: SetupFormData) => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await gameService.createGame(data);
      
      if (response.ok) {
        // Lưu hostCode vào localStorage để sử dụng sau này
        localStorage.setItem('hostCode', data.hostCode);
        
        // Chuyển hướng đến trang chi tiết phòng với gameId
        router.push(`/host/${response.gameId}`);
      } else {
        setError(`Lỗi: ${response.error}`);
      }
    } catch (error) {
      console.error('Error creating game:', error);
      setError('Có lỗi xảy ra khi tạo trò chơi');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <main className="min-h-screen p-4 bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="container mx-auto max-w-4xl py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Tạo Phòng Game</h1>
          <p className="text-white/90">
            Thiết lập các thông số cho phòng game mới
          </p>
        </div>
        
        <AnimatedDiv
          style={formSpring}
          className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Mã Host (dùng để xác thực)"
              {...register('hostCode')}
              error={errors.hostCode?.message}
              fullWidth
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Số đội tối đa"
                type="number"
                {...register('maxTeams', { valueAsNumber: true })}
                error={errors.maxTeams?.message}
                fullWidth
              />
              
              <Input
                label="Số thành viên mỗi đội"
                type="number"
                {...register('maxTeamMembers', { valueAsNumber: true })}
                error={errors.maxTeamMembers?.message}
                fullWidth
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Thời gian cho mỗi vòng (giây)"
                type="number"
                {...register('timeLimit', { valueAsNumber: true })}
                error={errors.timeLimit?.message}
                fullWidth
              />
              
              <Input
                label="Số vòng chơi"
                type="number"
                {...register('roundsCount', { valueAsNumber: true })}
                error={errors.roundsCount?.message}
                fullWidth
              />
            </div>
            
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
              {isLoading ? 'Đang tạo...' : 'Tạo Phòng Game'}
            </Button>
          </form>
        </AnimatedDiv>
      </div>
    </main>
  );
} 