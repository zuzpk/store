import { ContextRegistry, DispatchQueueItem, dynamic } from "./types";

export const contextRegistry: ContextRegistry = {};
export const contextCache = new Map<string, dynamic>();
export const actionQueue : {
    [x: string] : DispatchQueueItem[]
} = {}

type Listener = () => void;

export type SchedulerMode = "microtask" | "raf" | "sync";

type InternalStore = {
    state: dynamic;
    listeners: Set<Listener>;
    scheduler: SchedulerMode;
};

const stores: Record<string, InternalStore> = {};
let batchDepth = 0;
const pendingNotifyKeys = new Set<string>();

export const ensureStore = (key: string, initialState: dynamic = {}) => {
    if (!stores[key]) {
        stores[key] = {
            state: initialState,
            listeners: new Set(),
            scheduler: "microtask",
        };
    }

    return stores[key];
};

export const getStoreState = (key: string): dynamic => {
    return ensureStore(key).state;
};

export const getSchedulerMode = (key: string): SchedulerMode => {
    return ensureStore(key).scheduler;
};

export const setSchedulerMode = (key: string, mode: SchedulerMode) => {
    ensureStore(key).scheduler = mode;
};

const notifyListeners = (key: string) => {
    const store = ensureStore(key);
    store.listeners.forEach(listener => listener());
};

export const updateStoreState = (key: string, nextState: dynamic) => {
    const store = ensureStore(key);
    const prev = store.state;
    const changed = Object.keys(nextState).some(k => prev[k] !== nextState[k]);
    if (!changed) return false;

    store.state = nextState;
    contextCache.set(key, nextState);

    if (batchDepth > 0) {
        pendingNotifyKeys.add(key);
    } else {
        notifyListeners(key);
    }

    return true;
};

export const subscribeStore = (key: string, listener: Listener) => {
    const store = ensureStore(key);
    store.listeners.add(listener);
    return () => {
        store.listeners.delete(listener);
    };
};

export const batchUpdates = <T>(callback: () => T): T => {
    batchDepth += 1;
    try {
        return callback();
    } finally {
        batchDepth -= 1;
        if (batchDepth === 0 && pendingNotifyKeys.size > 0) {
            const keys = Array.from(pendingNotifyKeys);
            pendingNotifyKeys.clear();
            keys.forEach(notifyListeners);
        }
    }
};