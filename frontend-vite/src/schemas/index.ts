import { z } from 'zod';

// Допоміжні
const optionalString = (max: number) =>
  z.string().max(max, `Максимум ${max} символів`).optional().or(z.literal(''));

const decimalString = z
  .union([z.string(), z.number()])
  .transform((v) => (v === '' || v === null || v === undefined ? '' : String(v)))
  .refine((v) => v === '' || /^-?\d+(\.\d+)?$/.test(v), 'Має бути числом')
  .optional();

export const categorySchema = z.object({
  name: z.string().min(1, "Назва категорії обов'язкова").max(100),
  description: optionalString(500),
  slug: optionalString(100),
  meta_title: optionalString(60),
  meta_description: optionalString(160),
  is_active: z.boolean().default(true),
});

export const productSchema = z.object({
  name: z.string().min(1, "Назва товару обов'язкова").max(200),
  description: z.string().min(1, "Опис обов'язковий"),
  short_description: optionalString(300),
  price: z
    .union([z.string(), z.number()])
    .refine((v) => v !== '' && !isNaN(Number(v)), 'Ціна має бути числом')
    .refine((v) => Number(v) > 0, 'Ціна має бути більше нуля'),
  sale_price: decimalString,
  currency: z.string().default('UAH'),
  category: z.union([z.string(), z.number(), z.null()]).optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  weight: decimalString,
  dimensions: optionalString(50),
  sku: optionalString(50),
  minimum_order_quantity: decimalString,
  maximum_order_quantity: decimalString,
  order_increment: decimalString,
});

export const priceListSchema = z.object({
  name: z.string().min(1, "Назва прайс-листа обов'язкова").max(200),
  description: optionalString(500),
  pricing_strategy: z.string().default('cost_plus_markup'),
  default_markup_percentage: decimalString,
  default_markup_amount: decimalString,
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
  auto_update_from_cost: z.boolean().default(false),
  update_frequency: z.string().default('manual'),
});

export const loginSchema = z.object({
  email: z.string().email('Невалідний email'),
  password: z.string().min(6, 'Пароль має містити мін. 6 символів'),
});

export const registerSchema = z
  .object({
    email: z.string().email('Невалідний email'),
    username: z.string().min(3, 'Логін має містити мін. 3 символи').max(150),
    password: z.string().min(8, 'Пароль має містити мін. 8 символів'),
    password_confirm: z.string(),
    first_name: optionalString(150),
    last_name: optionalString(150),
    phone: optionalString(20),
    company_name: optionalString(100),
  })
  .refine((d) => d.password === d.password_confirm, {
    path: ['password_confirm'],
    message: 'Паролі не співпадають',
  });

// Експортуємо input типи (дозволяють undefined для полів з .default()).
// Output (`z.output`) використовуйте для серверних payload-ів.
export type CategoryFormValues = z.input<typeof categorySchema>;
export type ProductFormValues = z.input<typeof productSchema>;
export type PriceListFormValues = z.input<typeof priceListSchema>;
export type LoginFormValues = z.input<typeof loginSchema>;
export type RegisterFormValues = z.input<typeof registerSchema>;
