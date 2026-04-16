/**
 * Типи доменних моделей API.
 * Поля відображають серіалізатори Django REST Framework з backend/.
 */

export type ID = number | string;

export interface User {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company_name?: string;
  avatar?: string | null;
  telegram_username?: string;
  telegram_chat_id?: string;
  instagram_username?: string;
  email_notifications?: boolean;
  telegram_notifications?: boolean;
  is_subscribed?: boolean;
  subscription_plan?: 'free' | 'basic' | 'premium';
  balance?: number | string;
  monthly_spending?: number | string;
  total_spent?: number | string;
  date_joined?: string;
  stores?: Pick<Store, 'id' | 'name' | 'slug'>[];
}

export interface Store {
  id: number;
  name: string;
  slug: string;
  description?: string;
  status?: string;
  is_active: boolean;
  logo?: string | null;
  banner_image?: string | null;
  phone?: string;
  email?: string;
  address?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  meta_title?: string;
  meta_description?: string;
  show_telegram_button?: boolean;
  show_instagram_feed?: boolean;
  social_links?: SocialLink[];
  blocks?: ContentBlock[];
  products_count?: number;
  orders_count?: number;
  revenue?: number;
  created_at: string;
  updated_at?: string;
}

export interface SocialLink {
  id: number;
  social_type: string;
  url: string;
  title?: string;
  is_active: boolean;
}

export interface ContentBlock {
  id: number;
  title: string;
  content: string;
  order: number;
  is_active: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  slug: string;
  image?: string | null;
  order?: number;
  is_active: boolean;
  products_count?: number;
  meta_title?: string;
  meta_description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductImage {
  id: number;
  image: string;
  alt_text?: string;
  is_primary: boolean;
  order: number;
}

export interface ProductVariant {
  id: number;
  name: string;
  value: string;
  price_adjustment: string | number;
  cost_adjustment?: string | number;
  sku_suffix?: string;
  is_active: boolean;
}

export interface Product {
  id: number;
  store?: number | Store;
  category?: number | Category | null;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price: string | number;
  sale_price?: string | number | null;
  currency?: string;
  is_featured?: boolean;
  is_active: boolean;
  weight?: string | number;
  dimensions?: string;
  sku?: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  barcode?: string;
  qr_code?: string;
  minimum_order_quantity?: string | number;
  maximum_order_quantity?: string | number;
  order_increment?: string | number;
  current_price?: string | number;
  discount_percentage?: number;
  is_on_sale?: boolean;
  created_at: string;
  updated_at?: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: number;
  product: number | Product;
  variant?: number | ProductVariant | null;
  quantity: number | string;
  unit_price: number | string;
}

export interface Order {
  id: number;
  order_number: string;
  store?: number | Store;
  status: OrderStatus;
  payment_status?: PaymentStatus;
  source?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount: number;
  subtotal?: number;
  shipping_cost?: number;
  tax_amount?: number;
  items?: OrderItem[];
  items_count?: number;
  created_at: string;
  updated_at?: string;
}

export type CouponDiscountType = 'percentage' | 'fixed';

export interface Coupon {
  id: number;
  code: string;
  description?: string;
  discount_type: CouponDiscountType;
  discount_value: string | number;
  min_order_amount?: string | number;
  max_uses?: number | null;
  uses_count: number;
  valid_from?: string | null;
  valid_until?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  max_stores: number;
  max_products: number;
  max_monthly_orders: number;
  commission_percentage: number;
  has_analytics: boolean;
  has_email_support: boolean;
  has_priority_support: boolean;
  has_custom_domain: boolean;
  has_api_access: boolean;
  has_integrations: boolean;
  is_featured: boolean;
}

export interface UserSubscription {
  id: number;
  plan: number;
  plan_name: string;
  plan_details: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'expired';
  is_active: boolean;
  started_at: string;
  expires_at: string;
  cancelled_at?: string | null;
  next_billing_date?: string | null;
  days_remaining?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
