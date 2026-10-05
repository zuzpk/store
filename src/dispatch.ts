import { actionQueue, getSchedulerMode, getStoreState, updateStoreState } from "./registry";
import { DispatchQueueItem, dynamic } from "./types";

// Per-key flag — prevents cross-store blocking and allows
// independent flush scheduling per store instance.
const isProcessing: Record<string, boolean> = {};

const flushQueue = (key: string) => {
    const queue = actionQueue[key];
    if (!queue || queue.length === 0) {
        isProcessing[key] = false;
        return;
    }

    // Keep flushing while reentrant dispatches append into the same queue.
    while (actionQueue[key] && actionQueue[key].length > 0) {
        const base = getStoreState(key);
        const batch = actionQueue[key].splice(0);
        const merged: dynamic = Object.assign({}, base, ...batch.map(item => item.payload));

        updateStoreState(key, merged);

        // Resolve all callers that contributed to this flush.
        batch.forEach(item => item.resolve());
    }

    isProcessing[key] = false;
};

const scheduleFlush = (key: string) => {
    const mode = getSchedulerMode(key);
    if (mode === "sync") {
        flushQueue(key);
        return;
    }

    if (mode === "raf") {
        const raf = typeof requestAnimationFrame === "function"
            ? requestAnimationFrame
            : (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16);
        raf(() => flushQueue(key));
        return;
    }

    queueMicrotask(() => flushQueue(key));
};

// Plain function — no longer a hook. Caller (useStore) is responsible
// for providing the stable dispatch reference from context.
const createDispatcher = (key: string) => {
    return (payload: dynamic = {}) => {
        let queueItem: DispatchQueueItem;
        const done = new Promise<void>(resolve => {
            queueItem = { payload, resolve };
        });

        if (!actionQueue[key]) actionQueue[key] = [];
        actionQueue[key].push(queueItem!);

        // If a flush is already scheduled for this key, just accumulate.
        if (isProcessing[key]) return done;
        isProcessing[key] = true;

        // Defer flush so synchronous burst updates all land in the queue
        // before we merge and dispatch once.
        scheduleFlush(key);

        return done;
    };
};

export default createDispatcher;