import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { seedCauses, STUDIO_ORG_ID } from '@/data/seed';
import type { Cause, Contribution, Evidence, InboxItem } from '@/data/types';

type NewContribution = Omit<Contribution, 'id' | 'at' | 'completedCause'>;

export type CauseDraft = Pick<
  Cause,
  'title' | 'summary' | 'category' | 'beneficiary' | 'area' | 'items' | 'consent' | 'coverUri'
>;

type State = {
  onboarded: boolean;
  causes: Cause[];
  contributions: Contribution[];
  inbox: InboxItem[];
  supporter: boolean;
};

type Actions = {
  finishOnboarding: () => void;
  contribute: (c: NewContribution) => { completed: boolean; contribution: Contribution };
  createCause: (draft: CauseDraft) => Cause;
  postProof: (causeId: string, evidence: Evidence) => void;
  markInboxRead: (id?: string) => void;
  setSupporter: (active: boolean) => void;
  resetDemo: () => void;
};

const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const initialState = (): State => ({
  onboarded: false,
  causes: seedCauses(),
  contributions: [],
  inbox: [],
  supporter: false,
});

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initialState(),

      finishOnboarding: () => set({ onboarded: true }),

      contribute: (input) => {
        const now = Date.now();
        const cause = get().causes.find((c) => c.id === input.causeId);
        const remaining = cause ? cause.goal - cause.raised : 0;
        const completed = !!cause && input.amount >= remaining;
        const contribution: Contribution = { ...input, id: uid('gift'), at: now, completedCause: completed };

        set((s) => ({
          contributions: [contribution, ...s.contributions],
          causes: s.causes.map((c) => {
            if (c.id !== input.causeId) return c;
            const raised = Math.min(c.goal, c.raised + input.amount);
            const donors = c.donors + 1;
            if (!completed) return { ...c, raised, donors };
            return {
              ...c,
              raised,
              donors,
              status: 'funded',
              timeline: [
                ...c.timeline,
                { status: 'funded', at: now, note: `${donors} people funded it — you closed it` },
              ],
            };
          }),
          inbox: completed
            ? [{ id: uid('in'), causeId: input.causeId, kind: 'funded', at: now, read: true }, ...s.inbox]
            : s.inbox,
        }));
        return { completed, contribution };
      },

      createCause: (draft) => {
        const now = Date.now();
        const goal = draft.items.reduce((sum, i) => sum + i.amount, 0);
        const cause: Cause = {
          ...draft,
          id: uid('cause'),
          orgId: STUDIO_ORG_ID,
          createdAt: now,
          goal,
          raised: 0,
          donors: 0,
          status: 'open',
          timeline: [{ status: 'open', at: now, note: 'Published after Privacy Shield review' }],
          isDemo: true,
          createdHere: true,
        };
        set((s) => ({ causes: [cause, ...s.causes] }));
        return cause;
      },

      postProof: (causeId, evidence) => {
        const now = Date.now();
        const spent = evidence.receipt.reduce((sum, r) => sum + r.amount, 0);
        const gave = get().contributions.some((c) => c.causeId === causeId);
        set((s) => ({
          causes: s.causes.map((c) => {
            if (c.id !== causeId) return c;
            const hasPurchase = c.timeline.some((t) => t.status === 'purchased');
            return {
              ...c,
              status: 'delivered',
              evidence,
              timeline: [
                ...c.timeline,
                ...(hasPurchase
                  ? []
                  : [
                      {
                        status: 'purchased' as const,
                        at: now - 90_000,
                        note: `Receipt uploaded · $${spent.toFixed(2)} spent`,
                      },
                    ]),
                { status: 'delivered' as const, at: now, note: 'Delivered · proof posted with Privacy Shield' },
              ],
            };
          }),
          inbox: gave ? [{ id: uid('in'), causeId, kind: 'delivered', at: now, read: false }, ...s.inbox] : s.inbox,
        }));
      },

      markInboxRead: (id) =>
        set((s) => ({ inbox: s.inbox.map((i) => (id === undefined || i.id === id ? { ...i, read: true } : i)) })),

      setSupporter: (active) => set({ supporter: active }),

      resetDemo: () => set({ ...initialState(), onboarded: true }),
    }),
    {
      name: 'handful',
      // Bump when the demo seed changes: older installs restart from the new seed.
      version: 3,
      migrate: (persisted) => ({ ...initialState(), onboarded: (persisted as Partial<State>)?.onboarded ?? false }),
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const useCause = (id: string | undefined) => useStore((s) => s.causes.find((c) => c.id === id));

/** True once persisted state has been read from storage. */
export function useHydrated() {
  return useSyncExternalStore(
    (onChange) => useStore.persist.onFinishHydration(onChange),
    () => useStore.persist.hasHydrated(),
  );
}
