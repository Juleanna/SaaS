import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../stores/authStore';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { loginSchema } from '../../schemas';

const forgotSchema = z.object({
  email: z.string().email('Невалідний email'),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(mode === 'login' ? loginSchema : forgotSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const result = await login(data);

      if (result.success) {
        toast.success('Успішний вхід в систему!');
        navigate('/');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Помилка входу в систему');
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPassword = async (data) => {
    setIsLoading(true);

    try {
      await api.post('/auth/password-reset/', { email: data.email });
      toast.success('Інструкції для відновлення пароля надіслано на вашу пошту');
      setMode('login');
      reset();
    } catch (error) {
      // Показуємо успіх навіть при помилці (щоб не розкривати які email є в системі)
      toast.success('Якщо цей email зареєстрований, ви отримаєте інструкції для відновлення пароля');
      setMode('login');
      reset();
    } finally {
      setIsLoading(false);
    }
  };

  const switchToForgot = () => {
    setMode('forgot');
    reset();
  };

  const switchToLogin = () => {
    setMode('login');
    reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {mode === 'login' ? (
          <>
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Вхід в систему
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Або{' '}
                <Link
                  to="/register"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  зареєструйтесь для створення облікового запису
                </Link>
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email', {
                      required: 'Email обов\'язковий',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Неправильний формат email',
                      },
                    })}
                    className="input"
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="form-error">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="form-label">
                    Пароль
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      {...register('password', {
                        required: 'Пароль обов\'язковий',
                      })}
                      className="input pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="form-error">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full"
                >
                  {isLoading ? 'Вхід...' : 'Увійти'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={switchToForgot}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Забули пароль?
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Відновлення пароля
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Введіть email, на який зареєстрований ваш обліковий запис
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onForgotPassword)}>
              <div>
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email', {
                      required: 'Email обов\'язковий',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Неправильний формат email',
                      },
                    })}
                    className="input pl-10"
                    placeholder="your@email.com"
                  />
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full"
                >
                  {isLoading ? 'Надсилання...' : 'Надіслати інструкції'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="text-sm text-blue-600 hover:text-blue-500 inline-flex items-center"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Повернутися до входу
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
