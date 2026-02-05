"""
Обробники команд Telegram бота
"""

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, ParseMode
from telegram.ext import ContextTypes
from django.utils.translation import gettext as _
from stores.models import Store
from products.models import Product
from .models import TelegramUser, TelegramSession, TelegramBot
import logging

logger = logging.getLogger(__name__)


class TelegramBotHandlers:
    """Обробники команд Telegram бота"""

    @staticmethod
    async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
        """
        Обробник команди /start
        """
        try:
            user = update.effective_user
            telegram_id = user.id

            # Отримати або створити Telegram користувача
            telegram_user, created = TelegramUser.objects.get_or_create(
                telegram_id=telegram_id,
                defaults={
                    "username": user.username or "",
                    "first_name": user.first_name or "",
                    "last_name": user.last_name or "",
                    "language_code": user.language_code or "uk",
                },
            )

            # Приветственное сообщение
            welcome_text = (
                f"👋 Вітаємо, {user.first_name}!\n\n"
                f"Це SaaS платформа для покупок у міні-магазинах.\n\n"
                f"Виберіть дію:\n"
            )

            keyboard = [
                [
                    InlineKeyboardButton(
                        "🏪 Переглянути магазини", callback_data="view_stores"
                    )
                ],
                [
                    InlineKeyboardButton(
                        "🔗 Прив'язати до аккаунту", callback_data="link_account"
                    )
                ],
                [InlineKeyboardButton("❓ Допомога", callback_data="help")],
            ]

            reply_markup = InlineKeyboardMarkup(keyboard)

            await update.message.reply_text(
                welcome_text, reply_markup=reply_markup, parse_mode=ParseMode.HTML
            )

            logger.info(f"Користувач {telegram_id} почав чат з ботом")

        except Exception as e:
            logger.error(f"Помилка в start_command: {e}")
            await update.message.reply_text("❌ Виникла помилка. Спробуйте пізніше.")

    @staticmethod
    async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
        """
        Обробник команди /help
        """
        try:
            help_text = (
                "📖 <b>Довідка</b>\n\n"
                "Доступні команди:\n"
                "• /start - Почати\n"
                "• /help - Ця інформація\n"
                "• /stores - Список магазинів\n"
                "• /orders - Мої замовлення\n"
                "• /account - Мій аккаунт\n\n"
                "Команди меню:\n"
                "• 🏪 Переглянути магазини\n"
                "• 🔗 Прив'язати до аккаунту\n"
                "• 🛒 Переглянути кошик\n"
            )

            await update.message.reply_text(help_text, parse_mode=ParseMode.HTML)
        except Exception as e:
            logger.error(f"Помилка в help_command: {e}")
            await update.message.reply_text("❌ Виникла помилка.")

    @staticmethod
    async def view_stores(update: Update, context: ContextTypes.DEFAULT_TYPE):
        """
        Відобразити список магазинів
        """
        try:
            query = update.callback_query
            await query.answer()

            # Отримати активні магазини
            stores = Store.objects.filter(is_active=True)[:10]

            if not stores:
                await query.edit_message_text("❌ Немає доступних магазинів.")
                return

            text = "🏪 <b>Доступні магазини:</b>\n\n"

            keyboard = []
            for store in stores:
                products_count = store.products_count
                text += f"• <b>{store.name}</b> ({products_count} товарів)\n"

                keyboard.append(
                    [
                        InlineKeyboardButton(
                            f"👉 {store.name}", callback_data=f"store_{store.id}"
                        )
                    ]
                )

            keyboard.append([InlineKeyboardButton("⬅️ Назад", callback_data="start")])

            reply_markup = InlineKeyboardMarkup(keyboard)

            await query.edit_message_text(
                text, reply_markup=reply_markup, parse_mode=ParseMode.HTML
            )

        except Exception as e:
            logger.error(f"Помилка в view_stores: {e}")
            await update.callback_query.edit_message_text("❌ Виникла помилка.")

    @staticmethod
    async def view_store_products(
        store_id: int, update: Update, context: ContextTypes.DEFAULT_TYPE
    ):
        """
        Відобразити товари магазину
        """
        try:
            query = update.callback_query
            await query.answer()

            store = Store.objects.get(id=store_id, is_active=True)
            products = store.products.filter(is_active=True)[:10]

            if not products:
                await query.edit_message_text(
                    f"❌ Немає товарів у магазині '{store.name}'."
                )
                return

            text = f"📦 <b>Товари магазину '{store.name}':</b>\n\n"

            keyboard = []
            for product in products:
                text += f"• <b>{product.name}</b>\n"
                text += f"   Ціна: {product.price} {product.currency}\n"
                text += f"   {product.short_description[:50]}...\n\n"

                keyboard.append(
                    [
                        InlineKeyboardButton(
                            f"🛒 {product.name}", callback_data=f"product_{product.id}"
                        )
                    ]
                )

            keyboard.append(
                [InlineKeyboardButton("⬅️ До магазинів", callback_data="view_stores")]
            )

            reply_markup = InlineKeyboardMarkup(keyboard)

            await query.edit_message_text(
                text, reply_markup=reply_markup, parse_mode=ParseMode.HTML
            )

        except Store.DoesNotExist:
            await update.callback_query.edit_message_text("❌ Магазин не знайдено.")
        except Exception as e:
            logger.error(f"Помилка в view_store_products: {e}")
            await update.callback_query.edit_message_text("❌ Виникла помилка.")

    @staticmethod
    async def view_product_detail(
        product_id: int, update: Update, context: ContextTypes.DEFAULT_TYPE
    ):
        """
        Відобразити деталі товару
        """
        try:
            query = update.callback_query
            await query.answer()

            product = Product.objects.get(id=product_id, is_active=True)

            text = (
                f"📦 <b>{product.name}</b>\n\n"
                f"<b>Ціна:</b> {product.price} {product.currency}\n"
                f"<b>Опис:</b> {product.description[:200]}\n\n"
                f"Натисніть кнопку для додавання до кошика →"
            )

            keyboard = [
                [
                    InlineKeyboardButton(
                        "🛒 Додати до кошика", callback_data=f"add_to_cart_{product.id}"
                    )
                ],
                [
                    InlineKeyboardButton(
                        "⬅️ Назад", callback_data=f"store_{product.store.id}"
                    )
                ],
            ]

            reply_markup = InlineKeyboardMarkup(keyboard)

            await query.edit_message_text(
                text, reply_markup=reply_markup, parse_mode=ParseMode.HTML
            )

        except Product.DoesNotExist:
            await update.callback_query.edit_message_text("❌ Товар не знайдено.")
        except Exception as e:
            logger.error(f"Помилка в view_product_detail: {e}")
            await update.callback_query.edit_message_text("❌ Виникла помилка.")

    @staticmethod
    async def add_to_cart(
        product_id: int, update: Update, context: ContextTypes.DEFAULT_TYPE
    ):
        """
        Додати товар до кошика
        """
        try:
            query = update.callback_query
            await query.answer()

            user = query.from_user
            telegram_id = user.id

            product = Product.objects.get(id=product_id)
            store = product.store

            # Отримати або створити сесію
            session, created = TelegramSession.objects.get_or_create(
                user_id=telegram_id, store=store, defaults={"current_state": "shopping"}
            )

            # Додати товар до кошика
            if not session.cart_items:
                session.cart_items = {}

            if str(product_id) in session.cart_items:
                session.cart_items[str(product_id)] += 1
            else:
                session.cart_items[str(product_id)] = 1

            session.save()

            text = (
                f"✅ Товар '{product.name}' додано до кошика!\n\n"
                f"Кількість: {session.cart_items[str(product_id)]}\n\n"
                f"Що далі?"
            )

            keyboard = [
                [
                    InlineKeyboardButton(
                        "🛒 Переглянути кошик", callback_data="view_cart"
                    )
                ],
                [
                    InlineKeyboardButton(
                        "📦 Ще товари", callback_data=f"store_{store.id}"
                    )
                ],
                [InlineKeyboardButton("🏪 До магазинів", callback_data="view_stores")],
            ]

            reply_markup = InlineKeyboardMarkup(keyboard)

            await query.edit_message_text(text, reply_markup=reply_markup)

            logger.info(f"Користувач {telegram_id} додав товар {product_id} до кошика")

        except Product.DoesNotExist:
            await query.edit_message_text("❌ Товар не знайдено.")
        except Exception as e:
            logger.error(f"Помилка в add_to_cart: {e}")
            await query.edit_message_text("❌ Виникла помилка.")

    @staticmethod
    async def view_cart(update: Update, context: ContextTypes.DEFAULT_TYPE):
        """
        Відобразити кошик
        """
        try:
            query = update.callback_query
            await query.answer()

            user = query.from_user
            telegram_id = user.id

            # Отримати активну сесію
            session = TelegramSession.objects.filter(
                user_id=telegram_id, current_state="shopping"
            ).first()

            if not session or not session.cart_items:
                await query.edit_message_text("🛒 Ваш кошик порожній.")
                return

            text = f"🛒 <b>Ваш кошик (магазин '{session.store.name}'):</b>\n\n"

            total_price = 0
            keyboard = []

            for product_id, quantity in session.cart_items.items():
                try:
                    product = Product.objects.get(id=product_id)
                    price = float(product.price) * quantity
                    total_price += price

                    text += (
                        f"• {product.name} x{quantity} = {price} {product.currency}\n"
                    )

                    keyboard.append(
                        [
                            InlineKeyboardButton(
                                f"🗑️ {product.name}",
                                callback_data=f"remove_from_cart_{product_id}",
                            )
                        ]
                    )
                except Product.DoesNotExist:
                    pass

            text += f"\n<b>Всього:</b> {total_price}\n"

            keyboard.append(
                [
                    InlineKeyboardButton(
                        "✅ Оформити замовлення", callback_data="checkout"
                    )
                ]
            )
            keyboard.append(
                [
                    InlineKeyboardButton(
                        "⬅️ Назад до товарів", callback_data=f"store_{session.store.id}"
                    )
                ]
            )

            reply_markup = InlineKeyboardMarkup(keyboard)

            await query.edit_message_text(
                text, reply_markup=reply_markup, parse_mode=ParseMode.HTML
            )

        except Exception as e:
            logger.error(f"Помилка в view_cart: {e}")
            await query.edit_message_text("❌ Виникла помилка.")

    @staticmethod
    async def link_account(update: Update, context: ContextTypes.DEFAULT_TYPE):
        """
        Прив'язати Telegram до аккаунту
        """
        try:
            query = update.callback_query
            await query.answer()

            user = query.from_user
            telegram_id = user.id

            # Отримати Telegram користувача
            telegram_user = TelegramUser.objects.get(telegram_id=telegram_id)

            if telegram_user.user:
                text = f"✅ Ви вже прив'язані до аккаунту: {telegram_user.user.email}"
            else:
                text = (
                    "🔗 <b>Прив'язування до аккаунту</b>\n\n"
                    "Щоб прив'язати свій Telegram до аккаунту SaaS, "
                    "перейдіть на сайт та виконайте команду:\n"
                    f"<code>/link_telegram {telegram_id}</code>\n\n"
                    "Або скопіюйте свій ID: <code>{}</code>".format(telegram_id)
                )

            keyboard = [[InlineKeyboardButton("⬅️ Назад", callback_data="start")]]
            reply_markup = InlineKeyboardMarkup(keyboard)

            await query.edit_message_text(
                text, reply_markup=reply_markup, parse_mode=ParseMode.HTML
            )

        except TelegramUser.DoesNotExist:
            await query.edit_message_text("❌ Користувач не знайдено.")
        except Exception as e:
            logger.error(f"Помилка в link_account: {e}")
            await query.edit_message_text("❌ Виникла помилка.")
