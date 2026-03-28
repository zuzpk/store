import { actionQueue, contextCache } from "./registry";
import { DispatchQueueItem, dynamic } from "./types";

// Per-key flag — prevents cross-store blocking and allows
// independent flush scheduling per store instance.
const isProcessing: Record<string, boolean> = {};

const flushQueue = (key: string, dispatch: (payload: dynamic) => void) => {
    const queue = actionQueue[key];
    if (!queue || queue.length === 0) {
        isProcessing[key] = false;
        return;
    }

    // Drain the entire queue and merge all deltas into a single
    // state object. This collapses N burst dispatches into 1 re-render.
    const base = contextCache.get(key) || {};
    const batch = queue.splice(0);
    const merged: dynamic = Object.assign({}, base, ...batch.map(item => item.payload));

    // Skip dispatch entirely if no key actually changed value.
    const changed = Object.keys(merged).some(k => base[k] !== merged[k]);
    if (changed) {
        contextCache.set(key, merged);
        dispatch(merged);
    }

    // Resolve all callers that contributed to this flush.
    batch.forEach(item => item.resolve());

    isProcessing[key] = false;
};

// Plain function — no longer a hook. Caller (useStore) is responsible
// for providing the stable dispatch reference from context.
const createDispatcher = (key: string, dispatch: (payload: dynamic) => void) => {
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
        queueMicrotask(() => flushQueue(key, dispatch));

        return done;
    };
};

export default createDispatcher;