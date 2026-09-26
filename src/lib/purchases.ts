/**
 * RevenueCat integration.
 *
 * In this prototype every gift is a consumable purchase processed by RevenueCat's
 * Test Store: the SDK, the purchase sheet, the transaction and CustomerInfo are all
 * real, but no real money moves. In production, gifts to nonprofits would go through
 * Apple Pay / Stripe (App Store Review Guideline 3.2.1(vi)), and RevenueCat would keep
 * powering the Handful Supporter subscription — see README → "Production architecture".
 */
import Purchases, {
  LOG_LEVEL,
  PRODUCT_CATEGORY,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';

import { Platform, Settings } from 'react-native';

import type { Contribution } from '@/data/types';

const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY?.trim() || undefined;

export const SUPPORTER_ENTITLEMENT = 'supporter';
export const SUPPORTER_OFFERING = 'supporter';

/** One consumable per whole-dollar amount: handful_gift_1 … handful_gift_20. */
export const MAX_GIFT = 20;
export const giftProductId = (amount: number) => `handful_gift_${amount}`;

let configured = false;

export const revenueCatEnabled = () => !!API_KEY;
export const isTestStoreKey = () => !!API_KEY?.startsWith('test_');

export function configurePurchases(): boolean {
  if (!API_KEY) return false;
  if (configured) return true;
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.INFO : LOG_LEVEL.WARN);
  Purchases.configure({ apiKey: API_KEY });
  configured = true;
  return true;
}

export type GiftResult =
  | { ok: true; productId: string; transactionId: string; rail: Contribution['rail'] }
  | { ok: false; cancelled: boolean; message: string };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function readError(e: unknown): { cancelled: boolean; message: string } {
  const err = e as { userCancelled?: boolean | null; code?: string; message?: string };
  const cancelled = !!err?.userCancelled || err?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
  return { cancelled, message: err?.message ?? 'Something went wrong. Nothing was charged.' };
}

/** Dev/QA only (`-handfulOffline 1` launch argument): skip the SDK to test navigation without taps. */
const devOffline = () => __DEV__ && Platform.OS === 'ios' && Settings.get('handfulOffline') === '1';

export async function purchaseGift(amount: number): Promise<GiftResult> {
  const productId = giftProductId(amount);

  if (devOffline() || !configurePurchases()) {
    // No RevenueCat key in .env: keep the app usable for anyone cloning the repo,
    // and label the contribution as an offline demo everywhere it appears.
    await wait(700);
    return { ok: true, productId, transactionId: `offline_${Date.now().toString(36)}`, rail: 'offline-demo' };
  }

  try {
    const [product] = await Purchases.getProducts([productId], PRODUCT_CATEGORY.NON_SUBSCRIPTION);
    if (!product) {
      return { ok: false, cancelled: false, message: `“${productId}” isn’t set up in RevenueCat yet.` };
    }
    const { transaction } = await Purchases.purchaseStoreProduct(product);
    return { ok: true, productId, transactionId: transaction.transactionIdentifier, rail: 'revenuecat-test-store' };
  } catch (e) {
    return { ok: false, ...readError(e) };
  }
}

export async function getSupporterPackage(): Promise<PurchasesPackage | null> {
  if (!configurePurchases()) return null;
  try {
    const offerings = await Purchases.getOfferings();
    const offering = offerings.all[SUPPORTER_OFFERING] ?? offerings.current;
    return offering?.monthly ?? offering?.availablePackages[0] ?? null;
  } catch {
    return null;
  }
}

export const hasSupporter = (info: CustomerInfo) => !!info.entitlements.active[SUPPORTER_ENTITLEMENT];

export async function purchaseSupporter(
  pkg: PurchasesPackage,
): Promise<{ ok: true; active: boolean } | { ok: false; cancelled: boolean; message: string }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { ok: true, active: hasSupporter(customerInfo) };
  } catch (e) {
    return { ok: false, ...readError(e) };
  }
}

/** App Review requires a way to restore a subscription bought on another install. */
export async function restoreSupporter(): Promise<{ ok: true; active: boolean } | { ok: false; message: string }> {
  if (!configurePurchases()) return { ok: false, message: 'RevenueCat is not configured in this build.' };
  try {
    return { ok: true, active: hasSupporter(await Purchases.restorePurchases()) };
  } catch (e) {
    return { ok: false, message: readError(e).message };
  }
}

export async function refreshSupporter(): Promise<boolean | null> {
  if (!configurePurchases()) return null;
  try {
    return hasSupporter(await Purchases.getCustomerInfo());
  } catch {
    return null;
  }
}

export async function getRevenueCatUserId(): Promise<string | null> {
  if (!configurePurchases()) return null;
  try {
    return await Purchases.getAppUserID();
  } catch {
    return null;
  }
}

export function listenToCustomerInfo(onChange: (supporter: boolean) => void): () => void {
  if (!configurePurchases()) return () => {};
  const listener = (info: CustomerInfo) => onChange(hasSupporter(info));
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}
