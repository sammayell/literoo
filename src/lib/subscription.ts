// Subscription state management (localStorage MVP)
// Phase 2: Replace with Supabase + Stripe webhook verification

export interface SubscriptionState {
  subscribed: boolean;
  stripeSessionId: string | null;
  subscribedAt: string | null;
  childName: string | null;
  childAge: number | null;
}

const STORAGE_KEY = 'literoo_subscription';

function getDefault(): SubscriptionState {
  return {
    subscribed: false,
    stripeSessionId: null,
    subscribedAt: null,
    childName: null,
    childAge: null,
  };
}

export function getSubscription(): SubscriptionState {
  if (typeof window === 'undefined') return getDefault();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefault();
    return JSON.parse(raw) as SubscriptionState;
  } catch {
    return getDefault();
  }
}

function save(state: SubscriptionState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable
  }
}

export function isSubscribed(): boolean {
  return getSubscription().subscribed;
}

export function setSubscribed(sessionId: string): void {
  const state = getSubscription();
  state.subscribed = true;
  state.stripeSessionId = sessionId;
  state.subscribedAt = new Date().toISOString();
  save(state);
}

export function clearSubscription(): void {
  save(getDefault());
}

export function setChildInfo(name: string, age: number): void {
  const state = getSubscription();
  state.childName = name;
  state.childAge = age;
  save(state);
}

export function getChildInfo(): { name: string | null; age: number | null } {
  const state = getSubscription();
  return { name: state.childName, age: state.childAge };
}

// Map child age to AgeTier
export function ageToTier(age: number): string {
  if (age <= 2) return 'baby';
  if (age <= 4) return 'toddler';
  if (age <= 6) return 'early_reader';
  if (age <= 9) return 'reader';
  if (age <= 12) return 'middle_grade';
  return 'young_adult';
}
