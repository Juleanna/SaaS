import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckIcon,
  XMarkIcon,
  SparklesIcon,
  ShieldCheckIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  EnvelopeIcon,
  BoltIcon,
  GlobeAltIcon,
  CommandLineIcon,
  PuzzlePieceIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import api, { getResults } from '../services/api';
import toast from 'react-hot-toast';
import type { SubscriptionPlan, UserSubscription } from '../types/models';

interface UsageInfo {
  usage?: { stores?: number; products?: number; monthly_orders?: number };
  limits?: { max_stores?: number; max_products?: number; max_monthly_orders?: number };
}

const SubscriptionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: plans = [], isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/plans/');
      return getResults<SubscriptionPlan>(response.data);
    },
  });

  const { data: currentSubscription, isLoading: subLoading } = useQuery<UserSubscription | null>({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      try {
        const response = await api.get('/subscriptions/current/');
        return response.data as UserSubscription;
      } catch {
        return null;
      }
    },
  });

  const { data: usage } = useQuery<UsageInfo | null>({
    queryKey: ['subscription-usage'],
    queryFn: async () => {
      try {
        const response = await api.get('/subscriptions/usage/');
        return response.data as UsageInfo;
      } catch {
        return null;
      }
    },
  });

  const handleUpgrade = async (): Promise<void> => {
    if (!selectedPlan) return;
    setIsProcessing(true);
    try {
      const response = await api.post('/subscriptions/upgrade/', {
        plan_id: selectedPlan.id,
      });

      if (response.data.amount > 0) {
        toast.success(
          `План "${selectedPlan.name}" успішно активовано! Списано ${response.data.amount} ₴. Залишок: ${response.data.new_balance?.toFixed(2) ?? '—'} ₴`
        );
      } else {
        toast.success(`План "${selectedPlan.name}" успішно активовано!`);
      }

      setShowUpgradeModal(false);
      setSelectedPlan(null);
      setIsProcessing(false);
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    } catch (error: unknown) {
      const data = (error as { response?: { data?: { message?: string; error?: string } } })?.response?.data;
      if (data?.message) {
        toast.error(data.message);
      } else if (typeof data?.error === 'string' && data.error !== 'insufficient_balance') {
        toast.error(data.error);
      } else {
        toast.error('Помилка при зміні плану');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async (): Promise<void> => {
    setIsProcessing(true);
    try {
      await api.post('/subscriptions/cancel/');
      toast.success('Підписку скасовано');
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
      setShowCancelModal(false);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(message || 'Помилка при скасуванні');
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = plansLoading || subLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded-lg w-48 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card card-body space-y-4">
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentPlanId = currentSubscription?.plan_details?.id ?? currentSubscription?.plan;

  type PlanFeatureKey =
    | 'has_analytics'
    | 'has_email_support'
    | 'has_priority_support'
    | 'has_custom_domain'
    | 'has_api_access'
    | 'has_integrations';

  interface FeatureRow {
    key: PlanFeatureKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }

  const features: FeatureRow[] = [
    { key: 'has_analytics', label: 'Аналітика', icon: ChartBarIcon },
    { key: 'has_email_support', label: 'Email підтримка', icon: EnvelopeIcon },
    { key: 'has_priority_support', label: 'Пріоритетна підтримка', icon: BoltIcon },
    { key: 'has_custom_domain', label: 'Кастомний домен', icon: GlobeAltIcon },
    { key: 'has_api_access', label: 'API доступ', icon: CommandLineIcon },
    { key: 'has_integrations', label: 'Інтеграції', icon: PuzzlePieceIcon },
  ];

  const getPlanBg = (plan: SubscriptionPlan): string => {
    if (plan.slug === 'premium') return 'bg-purple-50';
    if (plan.slug === 'basic') return 'bg-blue-50';
    return 'bg-gray-50';
  };

  const getPlanAccent = (plan: SubscriptionPlan): string => {
    if (plan.slug === 'premium') return 'text-purple-600';
    if (plan.slug === 'basic') return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SparklesIcon className="h-7 w-7 text-blue-600" />
          Підписка та тарифні плани
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Оберіть план, який найкраще підходить для вашого бізнесу
        </p>
      </div>

      {/* Поточна підписка */}
      {currentSubscription && (
        <div className="card card-body">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Поточний план</p>
                <p className="text-lg font-bold text-gray-900">{currentSubscription.plan_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Статус</p>
                <span className={`badge ${currentSubscription.is_active ? 'badge-success' : 'badge-danger'}`}>
                  {currentSubscription.is_active ? 'Активна' : 'Неактивна'}
                </span>
              </div>
              {currentSubscription.is_active && (currentSubscription.days_remaining ?? 0) > 0 && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">Залишилось</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" />
                    {currentSubscription.days_remaining} днів
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Usage bars */}
          {usage && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <UsageBar
                icon={BuildingStorefrontIcon}
                label="Магазини"
                used={usage.usage?.stores || 0}
                max={usage.limits?.max_stores || 1}
              />
              <UsageBar
                icon={CubeIcon}
                label="Товари"
                used={usage.usage?.products || 0}
                max={usage.limits?.max_products || 50}
              />
              <UsageBar
                icon={ShoppingCartIcon}
                label="Замовлення/міс"
                used={usage.usage?.monthly_orders || 0}
                max={usage.limits?.max_monthly_orders || 100}
              />
            </div>
          )}
        </div>
      )}

      {/* Сітка планів */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = Number(currentPlanId) === Number(plan.id) && currentSubscription?.is_active;
          const bg = getPlanBg(plan);
          const accent = getPlanAccent(plan);

          return (
            <div
              key={plan.id}
              className={`card relative overflow-hidden transition-all duration-300 ${
                plan.is_featured ? 'ring-2 ring-blue-500 shadow-lg' : ''
              } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
            >
              {plan.is_featured && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-1.5 text-center text-sm font-semibold flex items-center justify-center gap-1">
                  <StarIcon className="h-4 w-4" />
                  Рекомендований
                </div>
              )}

              {isCurrent && !plan.is_featured && (
                <div className="bg-green-500 text-white py-1.5 text-center text-sm font-semibold flex items-center justify-center gap-1">
                  <CheckIcon className="h-4 w-4" />
                  Ваш поточний план
                </div>
              )}

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    {Number(plan.price) === 0 ? '0' : plan.price}
                  </span>
                  <span className="text-gray-500">
                    ₴/{plan.billing_cycle === 'monthly' ? 'міс' : 'рік'}
                  </span>
                </div>

                {/* Ліміти */}
                <div className={`rounded-xl p-4 space-y-3 ${bg}`}>
                  <LimitRow icon={BuildingStorefrontIcon} label="Магазинів" value={plan.max_stores} />
                  <LimitRow
                    icon={CubeIcon}
                    label="Товарів"
                    value={plan.max_products >= 10000 ? 'Безліміт' : plan.max_products}
                  />
                  <LimitRow
                    icon={ShoppingCartIcon}
                    label="Замовлень/міс"
                    value={plan.max_monthly_orders >= 99999 ? 'Безліміт' : plan.max_monthly_orders}
                  />
                  <LimitRow label="Комісія" value={`${plan.commission_percentage}%`} accent={accent} />
                </div>

                {/* Функції */}
                <div className="space-y-2.5">
                  {features.map((f) => {
                    const has = plan[f.key];
                    return (
                      <div key={f.key} className="flex items-center gap-2">
                        {has ? (
                          <CheckIcon className="h-5 w-5 text-green-500 shrink-0" />
                        ) : (
                          <XMarkIcon className="h-5 w-5 text-gray-300 shrink-0" />
                        )}
                        <span className={has ? 'text-gray-700' : 'text-gray-400'}>{f.label}</span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    if (isCurrent) return;
                    setSelectedPlan(plan);
                    setShowUpgradeModal(true);
                  }}
                  disabled={isCurrent}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    isCurrent
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : plan.is_featured
                      ? 'btn-primary'
                      : 'btn btn-outline'
                  }`}
                >
                  {isCurrent ? 'Поточний план' : 'Обрати план'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Скасування підписки */}
      {currentSubscription?.is_active && currentSubscription?.plan_details?.slug !== 'free' && (
        <div className="card card-body">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">Скасувати підписку</p>
              <p className="text-sm text-gray-500">
                Після скасування ви перейдете на безкоштовний план по закінченню поточного періоду
              </p>
            </div>
            <button
              onClick={() => setShowCancelModal(true)}
              className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 shrink-0"
            >
              Скасувати підписку
            </button>
          </div>
        </div>
      )}

      {/* Модалка апгрейду */}
      {showUpgradeModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Змінити план</h2>
            <p className="text-gray-600">
              Ви переходите на план <strong>{selectedPlan.name}</strong> за{' '}
              <strong>
                {Number(selectedPlan.price) === 0 ? 'безкоштовно' : `${selectedPlan.price} ₴/міс`}
              </strong>
            </p>

            {Number(selectedPlan.price) > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-700">
                  Оплата буде знята з балансу вашого рахунку
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  setSelectedPlan(null);
                }}
                disabled={isProcessing}
                className="btn btn-outline flex-1"
              >
                Скасувати
              </button>
              <button
                onClick={handleUpgrade}
                disabled={isProcessing}
                className="btn-primary flex-1"
              >
                {isProcessing ? 'Обробка...' : 'Підтвердити'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка скасування */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Скасувати підписку?</h2>
            <p className="text-gray-600">
              Ви впевнені? Після скасування ваш план буде діяти до кінця оплаченого періоду,
              а потім перейде на безкоштовний.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isProcessing}
                className="btn btn-outline flex-1"
              >
                Ні, залишити
              </button>
              <button
                onClick={handleCancel}
                disabled={isProcessing}
                className="btn-danger flex-1"
              >
                {isProcessing ? 'Обробка...' : 'Так, скасувати'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface UsageBarProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  used: number;
  max: number;
}

const UsageBar: React.FC<UsageBarProps> = ({ icon: Icon, label, used, max }) => {
  const percentage = max > 0 ? Math.min((used / max) * 100, 100) : 0;
  const isHigh = percentage >= 80;

  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-600 flex items-center gap-1">
          {Icon && <Icon className="h-4 w-4" />}
          {label}
        </span>
        <span className="text-sm font-medium text-gray-900">
          {used} / {max >= 99999 ? '∞' : max}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${isHigh ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface LimitRowProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  accent?: string;
}

const LimitRow: React.FC<LimitRowProps> = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-600 flex items-center gap-1.5">
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </span>
    <span className={`text-sm font-semibold ${accent || 'text-gray-900'}`}>{value}</span>
  </div>
);

export default SubscriptionsPage;
