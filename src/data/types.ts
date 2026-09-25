export type CategoryId =
  | 'food'
  | 'shelter'
  | 'health'
  | 'hygiene'
  | 'transport'
  | 'clothing'
  | 'families'
  | 'animals'
  | 'education'
  | 'emergency';

export type Beneficiary = 'individual' | 'family' | 'community';

/** open → funded → purchased → delivered. Delivered always carries proof. */
export type CauseStatus = 'open' | 'funded' | 'purchased' | 'delivered';

export type Organization = {
  id: string;
  name: string;
  focus: string;
  city: string;
  initials: string;
  tint: string;
  /** What Handful checked before letting this nonprofit publish causes. */
  checks: string[];
  isDemo: true;
};

export type CauseItem = {
  id: string;
  label: string;
  amount: number;
  symbol: string;
};

export type PrivacyReport = {
  facesBlurred: number;
  textBlurred: number;
  locationRemoved: boolean;
};

export type Evidence = {
  photoUri?: string;
  /** Bundled demo photo key, used by seed data. */
  photoAsset?: 'groceries';
  privacy: PrivacyReport;
  store: string;
  receipt: { label: string; amount: number }[];
  note: string;
};

export type TimelineEvent = {
  status: CauseStatus;
  at: number;
  note: string;
};

export type Cause = {
  id: string;
  orgId: string;
  title: string;
  summary: string;
  category: CategoryId;
  beneficiary: Beneficiary;
  area: string;
  createdAt: number;
  goal: number;
  raised: number;
  donors: number;
  status: CauseStatus;
  items: CauseItem[];
  timeline: TimelineEvent[];
  evidence?: Evidence;
  coverUri?: string;
  consent: { consentObtained: boolean; noExactLocation: boolean; imagesReviewed: boolean };
  isDemo: boolean;
  /** Created in this session from the nonprofit studio. */
  createdHere?: boolean;
};

export type Contribution = {
  id: string;
  causeId: string;
  amount: number;
  at: number;
  completedCause: boolean;
  productId: string;
  transactionId: string;
  /** 'revenuecat-test-store' when the RevenueCat SDK processed it. */
  rail: 'revenuecat-test-store' | 'offline-demo';
};

export type InboxItem = {
  id: string;
  causeId: string;
  kind: 'funded' | 'delivered';
  at: number;
  read: boolean;
};
