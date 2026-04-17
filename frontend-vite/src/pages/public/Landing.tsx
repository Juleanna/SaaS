import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RocketLaunchIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  BoltIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  CheckIcon,
  SparklesIcon,
  UserGroupIcon,
  ClockIcon,
  Cog6ToothIcon,
  QrCodeIcon,
  TruckIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

const Landing: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: BuildingStorefrontIcon,
      title: 'Мультимагазинність',
      desc: 'Створюйте та керуйте кількома магазинами з одного акаунту. Кожен магазин — окремий бренд з власним дизайном.',
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      icon: CubeIcon,
      title: 'Каталог товарів',
      desc: 'Необмежена кількість товарів з варіантами, категоріями, SEO-налаштуваннями та автоматичним ціноутворенням.',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      icon: ShoppingCartIcon,
      title: 'Замовлення',
      desc: 'Повний цикл обробки замовлень: від кошика до доставки. Статуси, сповіщення, історія змін.',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Прайс-листи',
      desc: 'Гнучке ціноутворення: націнки, формули, масові оновлення. Кілька стратегій ціноутворення одночасно.',
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      icon: TruckIcon,
      title: 'Склад та логістика',
      desc: 'Управління складами, залишками, постачальниками. Інвентаризація зі сканером штрихкодів.',
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      icon: ChartBarIcon,
      title: 'Аналітика',
      desc: 'Дашборд з ключовими метриками: продажі, дохід, конверсія. Все в реальному часі.',
      gradient: 'from-amber-500 to-orange-600',
    },
  ];

  const extraFeatures = [
    { icon: DevicePhoneMobileIcon, text: 'Адаптивний дизайн' },
    { icon: ShieldCheckIcon, text: 'JWT-авторизація' },
    { icon: BoltIcon, text: 'Блискавична швидкість' },
    { icon: GlobeAltIcon, text: 'SEO-оптимізація' },
    { icon: QrCodeIcon, text: 'Штрихкоди та QR' },
    { icon: ChatBubbleLeftRightIcon, text: 'Telegram-бот' },
    { icon: Cog6ToothIcon, text: 'API для інтеграцій' },
    { icon: CurrencyDollarIcon, text: 'Мультиплатежі' },
  ];

  const plans = [
    {
      name: 'Free',
      price: '0',
      desc: 'Для старту',
      features: ['1 магазин', 'До 50 товарів', 'Базова аналітика', 'Email-підтримка'],
      cta: 'Почати безкоштовно',
      popular: false,
      gradient: 'from-gray-100 to-gray-200',
      textColor: 'text-gray-900',
    },
    {
      name: 'Basic',
      price: '299',
      desc: 'Для малого бізнесу',
      features: ['3 магазини', 'До 500 товарів', 'Прайс-листи', 'Складський облік', 'Telegram-сповіщення'],
      cta: 'Обрати Basic',
      popular: true,
      gradient: 'from-blue-600 to-purple-700',
      textColor: 'text-white',
    },
    {
      name: 'Premium',
      price: '799',
      desc: 'Для серйозного бізнесу',
      features: ['Необмежено магазинів', 'Необмежено товарів', 'Всі функції', 'API-доступ', 'Пріоритетна підтримка', 'Кастомний домен'],
      cta: 'Обрати Premium',
      popular: false,
      gradient: 'from-gray-100 to-gray-200',
      textColor: 'text-gray-900',
    },
  ];

  const testimonials = [
    {
      name: 'Олександр К.',
      role: 'Власник TechStore',
      text: 'Перейшов з Shopify на AITPoludsky і зекономив 80% на місячних витратах. Функціонал навіть кращий!',
      rating: 5,
    },
    {
      name: 'Марія В.',
      role: 'Fashion Hub',
      text: 'Прайс-листи з формулами — це магія. Тепер перерахунок тисячі товарів займає секунди, а не дні.',
      rating: 5,
    },
    {
      name: 'Дмитро Л.',
      role: 'Мережа магазинів',
      text: 'Керую 5 магазинами з одного акаунту. Складський облік та інвентаризація працюють бездоганно.',
      rating: 5,
    },
  ];

  const faqs = [
    {
      q: 'Чи можу я спробувати безкоштовно?',
      a: 'Так! Тариф Free дає повний доступ до основних функцій без обмежень за часом. Ви можете створити магазин та додати до 50 товарів абсолютно безкоштовно.',
    },
    {
      q: 'Як швидко можна запустити магазин?',
      a: 'Реєстрація та створення магазину займає до 5 хвилин. Додайте товари, налаштуйте дизайн — і ваш магазин готовий до роботи.',
    },
    {
      q: 'Чи підтримуються платіжні системи?',
      a: 'Так, ми підтримуємо Stripe, PayPal, YooKassa та банківські перекази. Ви можете налаштувати кілька методів оплати одночасно.',
    },
    {
      q: 'Чи є API для інтеграцій?',
      a: 'Так, повний REST API з документацією Swagger/ReDoc. Ви можете інтегрувати свою CRM, ERP або будь-яку іншу систему.',
    },
    {
      q: 'Як працює складський облік?',
      a: 'Повне управління складами: залишки, резерви, постачання, партії товарів. Підтримка сканера штрихкодів для інвентаризації.',
    },
  ];

  const stats = [
    { value: '500+', label: 'Активних магазинів' },
    { value: '50K+', label: 'Товарів в каталозі' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Підтримка' },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-gray-100' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <RocketLaunchIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AITPoludsky
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className={`text-sm font-medium transition-colors ${isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-gray-700 hover:text-gray-900'}`}>
                Можливості
              </a>
              <a href="#pricing" className={`text-sm font-medium transition-colors ${isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-gray-700 hover:text-gray-900'}`}>
                Тарифи
              </a>
              <a href="#testimonials" className={`text-sm font-medium transition-colors ${isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-gray-700 hover:text-gray-900'}`}>
                Відгуки
              </a>
              <a href="#faq" className={`text-sm font-medium transition-colors ${isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-gray-700 hover:text-gray-900'}`}>
                FAQ
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                Увійти
              </Link>
              <Link to="/register" className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all">
                Почати безкоштовно
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 lg:pt-44 pb-20 lg:pb-32">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-50 blur-3xl"></div>
          <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-gradient-to-br from-emerald-100 to-cyan-100 rounded-full opacity-40 blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-gradient-to-br from-orange-100 to-pink-100 rounded-full opacity-30 blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full mb-8">
              <SparklesIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">SaaS-платформа для e-commerce</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 leading-[1.1]">
              Ваш бізнес.{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                Ваші правила.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Створюйте інтернет-магазини, керуйте товарами, замовленнями та складом — все в одному місці.
              Без програмістів, без зайвих витрат.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                to="/register"
                className="group inline-flex items-center px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-1 transition-all"
              >
                Створити магазин
                <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/marketplace"
                className="inline-flex items-center px-8 py-4 text-base font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                Переглянути маркетплейс
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-28 bg-gray-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Все для вашого магазину
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Повний набір інструментів для запуску та масштабування онлайн-бізнесу
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="group bg-white rounded-2xl border border-gray-200/80 p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Extra features pills */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
            {extraFeatures.map((ef, i) => (
              <div key={i} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <ef.icon className="h-4 w-4 text-blue-600" />
                {ef.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Як це працює
            </h2>
            <p className="text-lg text-gray-600">Три простих кроки до вашого онлайн-магазину</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '01',
                title: 'Реєстрація',
                desc: 'Створіть акаунт за 30 секунд. Без кредитної картки, без зобов\'язань.',
                icon: UserGroupIcon,
                gradient: 'from-blue-500 to-indigo-600',
              },
              {
                step: '02',
                title: 'Налаштування',
                desc: 'Створіть магазин, додайте товари, налаштуйте дизайн та способи оплати.',
                icon: Cog6ToothIcon,
                gradient: 'from-purple-500 to-pink-600',
              },
              {
                step: '03',
                title: 'Продажі',
                desc: 'Отримуйте замовлення, керуйте складом та масштабуйте бізнес.',
                icon: RocketLaunchIcon,
                gradient: 'from-emerald-500 to-teal-600',
              },
            ].map((step, i) => (
              <div key={i} className="relative text-center group">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Крок {step.step}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 lg:py-28 bg-gray-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Прозорі тарифи
            </h2>
            <p className="text-lg text-gray-600">Без прихованих платежів. Масштабуйтесь, коли готові.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-blue-600 to-purple-700 shadow-2xl shadow-blue-500/25 scale-[1.03]'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-bl-xl text-xs font-bold text-white uppercase tracking-wider">
                    Популярний
                  </div>
                )}

                <div className="p-8">
                  <h3 className={`text-lg font-bold mb-1 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-6 ${plan.popular ? 'text-blue-200' : 'text-gray-500'}`}>
                    {plan.desc}
                  </p>

                  <div className="flex items-baseline gap-1 mb-8">
                    <span className={`text-5xl font-extrabold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ${plan.popular ? 'text-blue-200' : 'text-gray-500'}`}>
                      {plan.price === '0' ? '' : ' ₴/міс'}
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat, j) => (
                      <li key={j} className="flex items-center gap-3">
                        <CheckIcon className={`h-5 w-5 flex-shrink-0 ${plan.popular ? 'text-blue-200' : 'text-emerald-500'}`} />
                        <span className={`text-sm ${plan.popular ? 'text-blue-100' : 'text-gray-700'}`}>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/register"
                    className={`block text-center w-full py-3.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                      plan.popular
                        ? 'bg-white text-blue-700 hover:shadow-xl'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/25'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Що кажуть клієнти
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200/80 p-7 hover:shadow-lg transition-all">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <StarSolid key={j} className="h-5 w-5 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div>
                  <div className="text-sm font-bold text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 lg:py-28 bg-gray-50/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Часті питання
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden">
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="text-sm font-semibold text-gray-900 pr-4">{faq.q}</span>
                  <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeFaq === i ? 'bg-blue-100 text-blue-600 rotate-45' : 'bg-gray-100 text-gray-400'}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${activeFaq === i ? 'max-h-48 pb-6' : 'max-h-0'}`}>
                  <p className="px-6 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-12 lg:p-20 text-center">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/5 rounded-full blur-2xl"></div>
            </div>

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
                Готові почати?
              </h2>
              <p className="text-lg text-blue-100 max-w-xl mx-auto mb-10">
                Приєднуйтесь до сотень підприємців, які вже використовують AITPoludsky для свого бізнесу.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="group inline-flex items-center px-8 py-4 text-base font-semibold text-blue-700 bg-white rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  Створити акаунт безкоштовно
                  <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/marketplace"
                  className="inline-flex items-center px-8 py-4 text-base font-semibold text-white border-2 border-white/30 rounded-2xl hover:bg-white/10 transition-all"
                >
                  Переглянути демо
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <RocketLaunchIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">AITPoludsky</span>
              </div>
              <p className="text-sm leading-relaxed">
                SaaS-платформа для створення та управління інтернет-магазинами.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Продукт</h4>
              <ul className="space-y-2.5">
                <li><a href="#features" className="text-sm hover:text-white transition-colors">Можливості</a></li>
                <li><a href="#pricing" className="text-sm hover:text-white transition-colors">Тарифи</a></li>
                <li><Link to="/marketplace" className="text-sm hover:text-white transition-colors">Маркетплейс</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Компанія</h4>
              <ul className="space-y-2.5">
                <li><a href="#testimonials" className="text-sm hover:text-white transition-colors">Відгуки</a></li>
                <li><a href="#faq" className="text-sm hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Акаунт</h4>
              <ul className="space-y-2.5">
                <li><Link to="/login" className="text-sm hover:text-white transition-colors">Увійти</Link></li>
                <li><Link to="/register" className="text-sm hover:text-white transition-colors">Реєстрація</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm">&copy; {new Date().getFullYear()} AITPoludsky. Всі права захищені.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
