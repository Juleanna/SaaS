import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Головна сторінка сайту
 */
const HomePage = ({ isAuthenticated }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6">
                Розпочніть свій онлайн магазин за хвилини
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                StoreHub - це найпростіший спосіб розпочати продавати онлайн.
                Без технічних знань, без компліцій. Просто створіть магазин і почніть заробляти.
              </p>
              <div className="flex gap-4">
                {!isAuthenticated ? (
                  <>
                    <Link
                      to="/register"
                      className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                    >
                      🚀 Почати безкоштовно
                    </Link>
                    <Link
                      to="/login"
                      className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Вхід
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/dashboard"
                    className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    📊 На панель управління
                  </Link>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-white bg-opacity-10 rounded-lg p-8">
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-4 bg-white bg-opacity-20 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            ✨ Особливості StoreHub
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon="🛍️"
              title="Простий конструктор магазину"
              description="Створіть свій магазин без коду за допомогою нашого інтуїтивного конструктора"
            />
            <FeatureCard
              icon="💳"
              title="Інтеграція платежів"
              description="Приймайте платежі через Stripe, PayPal, ЮKassa та інші популярні системи"
            />
            <FeatureCard
              icon="📱"
              title="Telegram бот"
              description="Продавайте через Telegram! Ваш особистий бот для сезонних售 товарів"
            />
            <FeatureCard
              icon="📊"
              title="Аналітика і звіти"
              description="Відслідковуйте продажі, замовлення та доход в режимі реального часу"
            />
            <FeatureCard
              icon="🔔"
              title="Повідомлення і сповіщення"
              description="Отримуйте email та Telegram сповіщення про нові замовлення та платежі"
            />
            <FeatureCard
              icon="💰"
              title="Тарифні плани"
              description="Вибирайте план за своїми потребами з можливістю масштабування"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            💳 Прозора цінова політика
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard
              name="Стартер"
              price="0"
              currency="₴"
              features={[
                '✓ 1 магазин',
                '✓ 50 товарів',
                '✓ Базова підтримка',
                '✓ Email сповіщення'
              ]}
              cta="Почати"
            />
            <PricingCard
              name="Професіонал"
              price="99"
              currency="₴"
              period="місяць"
              features={[
                '✓ 5 магазинів',
                '✓ Без обмеження товарів',
                '✓ Приоритетна підтримка',
                '✓ Email + Telegram',
                '✓ Аналітика',
                '✓ Telegram бот'
              ]}
              cta="Вибрати"
              featured
            />
            <PricingCard
              name="Бізнес"
              price="299"
              currency="₴"
              period="місяць"
              features={[
                '✓ Необмежено магазинів',
                '✓ Без обмеження товарів',
                '✓ 24/7 підтримка',
                '✓ Email + Telegram + SMS',
                '✓ Розширена аналітика',
                '✓ API доступ',
                '✓ Кастомні домени'
              ]}
              cta="Вибрати"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <StatItem number="10K+" label="Магазинів" />
            <StatItem number="500K+" label="Замовлень" />
            <StatItem number="50M+" label="Доходу 💰" />
            <StatItem number="50+" label="Країн" />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            ❓ Часті запитання
          </h2>

          <div className="space-y-6">
            <FAQItem
              question="Скільки коштує створення магазину?"
              answer="Створення магазину повністю безкоштовне! Ви можете користуватися базовим планом безлімітно. Платні плани дозволяють розширити функціональність."
            />
            <FAQItem
              question="Як я можу приймати платежі?"
              answer="StoreHub підтримує Stripe, PayPal, ЮKassa та інші системи. Просто виберіть зручну для вас та налаштуйте з'єднання."
            />
            <FAQItem
              question="Чи я можу користуватися своїм доменом?"
              answer="Так! На тарифе Професіонал та вище ви можете підключити свій кастомний домен."
            />
            <FAQItem
              question="Яка комісія платформи?"
              answer="Комісія залежить від тарифу: Стартер - 5%, Професіонал - 2%, Бізнес - 1% від кожного замовлення."
            />
            <FAQItem
              question="Як налаштувати Telegram бот?"
              answer="Налаштування займає 2-3 хвилини. Просто перейдіть в налаштування магазину, натисніть 'Підключити Telegram' та слідуйте інструкціям."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Готові розпочати свій бізнес?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Приєднуйтесь до тисяч успішних продавців на StoreHub
          </p>
          {!isAuthenticated && (
            <Link
              to="/register"
              className="inline-block px-12 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-lg"
            >
              🚀 Почати без сплати
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">StoreHub</h3>
              <p className="text-sm">Ваша платформа для продажу онлайн</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Продукт</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Особливості</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Ціни</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Компанія</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Про нас</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Блог</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Контакти</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Юридичні</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Умови користування</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Політика конфіденційності</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-sm">
              © 2024 StoreHub. Всі права захищені.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

/**
 * Карточка особливості
 */
const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white rounded-lg shadow-lg p-8">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

/**
 * Карточка ціни
 */
const PricingCard = ({ name, price, currency, period, features, cta, featured }) => (
  <div
    className={`rounded-lg p-8 transition-transform hover:scale-105 ${
      featured
        ? 'bg-blue-600 text-white shadow-2xl ring-2 ring-blue-400'
        : 'bg-white shadow-lg text-gray-900'
    }`}
  >
    {featured && (
      <div className="text-center mb-4">
        <span className="inline-block px-3 py-1 bg-yellow-400 text-blue-900 rounded-full text-sm font-bold">
          ⭐ РЕКОМЕНДОВАНО
        </span>
      </div>
    )}

    <h3 className="text-2xl font-bold mb-4">{name}</h3>

    <div className="mb-6">
      <span className="text-5xl font-bold">{price}</span>
      <span className={`text-lg ml-1 ${featured ? 'text-blue-100' : 'text-gray-600'}`}>
        {currency}
        {period && `/${period}`}
      </span>
    </div>

    <button
      className={`w-full py-3 rounded-lg font-semibold mb-8 transition-colors ${
        featured
          ? 'bg-yellow-400 text-blue-900 hover:bg-yellow-300'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {cta}
    </button>

    <ul className={`space-y-3 ${featured ? 'text-blue-100' : 'text-gray-700'}`}>
      {features.map((feature, idx) => (
        <li key={idx}>{feature}</li>
      ))}
    </ul>
  </div>
);

/**
 * Статистика
 */
const StatItem = ({ number, label }) => (
  <div>
    <div className="text-4xl font-bold mb-2">{number}</div>
    <div className="text-blue-100">{label}</div>
  </div>
);

/**
 * FAQ Item
 */
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left"
      >
        <h3 className="text-lg font-semibold text-gray-900">{question}</h3>
        <span className={`text-2xl transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <p className="text-gray-700 mt-4">{answer}</p>
      )}
    </div>
  );
};

export default HomePage;
