/**
 * Development-only: act on a launch argument so QA and screenshots can be driven
 * from the command line without the "Open in Handful?" deep-link prompt.
 *
 *   xcrun simctl launch --terminate-running-process booted app.handful.demo -handfulDev "go:/cause/hot-meal-tonight"
 *   … -handfulDev reset | onboarding | shield | shield:1200 | gift:hot-meal-tonight:4 | history | rcfresh
 *
 * iOS puts `-key value` launch arguments into NSUserDefaults, which React Native's
 * Settings API reads.
 */
import { router } from 'expo-router';
import { Platform, Settings } from 'react-native';

import { useStore } from '@/store/useStore';

export function runDevLaunchAction() {
  if (!__DEV__ || Platform.OS !== 'ios') return;
  const raw = Settings.get('handfulDev') as string | undefined;
  if (!raw) return;
  const [cmd, ...rest] = raw.split(':');
  const arg = rest.join(':');
  const s = useStore.getState();
  setTimeout(() => {
    if (cmd === 'reset') {
      s.resetDemo();
      router.replace('/');
    } else if (cmd === 'onboarding') {
      s.resetDemo();
      useStore.setState({ onboarded: false });
      router.replace('/onboarding');
    } else if (cmd === 'go') {
      s.finishOnboarding();
      router.push(arg as never);
    } else if (cmd === 'gift') {
      // gift:<causeId>:<amount> — offline-labelled gift to review the success screen
      const [causeId, amount] = arg.split(':');
      s.finishOnboarding();
      const { completed, contribution } = s.contribute({
        causeId,
        amount: Number(amount),
        productId: `handful_gift_${amount}`,
        transactionId: `dev_${Date.now().toString(36)}`,
        rail: 'offline-demo',
      });
      router.push({
        pathname: '/success/[id]',
        params: { id: causeId, gift: contribution.id, completed: completed ? '1' : '0' },
      });
    } else if (cmd === 'history') {
      // history — a few offline-labelled gifts (one to an already-delivered cause) to review Your impact
      s.resetDemo();
      s.finishOnboarding();
      const g = useStore.getState();
      g.contribute({
        causeId: 'hot-meal-tonight',
        amount: 4,
        productId: 'handful_gift_4',
        transactionId: 'dev_a1',
        rail: 'offline-demo',
      });
      g.contribute({
        causeId: 'shelter-hygiene',
        amount: 5,
        productId: 'handful_gift_5',
        transactionId: 'dev_a2',
        rail: 'offline-demo',
      });
      const day = 86_400_000;
      useStore.setState((st) => ({
        contributions: [
          ...st.contributions,
          {
            id: 'gift_dev_old',
            causeId: 'family-groceries',
            amount: 5,
            at: Date.now() - 6 * day,
            completedCause: false,
            productId: 'handful_gift_5',
            transactionId: 'dev_a0',
            rail: 'offline-demo',
          },
        ],
      }));
      router.navigate('/impact');
    } else if (cmd === 'rc') {
      // rc — log what RevenueCat returns for the gift products and the supporter offering
      import('react-native-purchases').then(async ({ default: Purchases, PRODUCT_CATEGORY }) => {
        const ids = Array.from({ length: 20 }, (_, i) => `handful_gift_${i + 1}`);
        const products = await Purchases.getProducts(ids, PRODUCT_CATEGORY.NON_SUBSCRIPTION);
        const offerings = await Purchases.getOfferings();
        const info = await Purchases.getCustomerInfo();
        console.log(
          '[dev:rc]',
          JSON.stringify({
            products: products.map((p) => `${p.identifier}=${p.priceString}`),
            offerings: Object.keys(offerings.all),
            supporterPackages: offerings.all.supporter?.availablePackages.map(
              (p) => `${p.identifier}:${p.product.identifier}:${p.product.priceString}`,
            ),
            appUserID: info.originalAppUserId,
            activeEntitlements: Object.keys(info.entitlements.active),
          }),
        );
      });
    } else if (cmd === 'rcfresh') {
      // rcfresh — switch to a brand-new RevenueCat customer (no purchases) to review the paywall
      import('react-native-purchases').then(async ({ default: Purchases }) => {
        // logIn from an anonymous user carries its purchases over; logging out then starts a clean anonymous customer.
        if (await Purchases.isAnonymous()) await Purchases.logIn(`handful_demo_${Date.now().toString(36)}`);
        const customerInfo = await Purchases.logOut();
        s.setSupporter(!!customerInfo.entitlements.active.supporter);
        s.finishOnboarding();
        router.push('/supporter');
      });
    } else if (cmd === 'shield') {
      s.finishOnboarding();
      router.push({ pathname: '/dev', params: { action: 'shield', ...(arg ? { auto: arg } : {}) } });
    }
  }, 350);
}
