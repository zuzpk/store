import {
    createContext
} from "react";
import createProvider from "./provider";
import type { SchedulerMode } from "./registry";
import { batchUpdates, contextCache, contextRegistry, ensureStore, setSchedulerMode } from "./registry";
import { dynamic } from "./types";

const createStore = <T extends dynamic>(
    key: string,
    initialState: T,
    mode?: SchedulerMode,
) => {

    const resolvedMode: SchedulerMode = mode ?? "microtask";

    if (contextRegistry[key]) {
        if (mode) {
            setSchedulerMode(key, mode);
        }
        return contextRegistry[key];
    }

    const InContext = createContext<{ state: T; dispatch: (args: dynamic) => void}>({
        state:  initialState,
        dispatch: () => {}
    })

    contextRegistry[key] = {
        context: InContext, 
        Provider: createProvider(InContext, initialState),
    }

    contextCache.set(key, initialState)
    ensureStore(key, initialState)
    setSchedulerMode(key, resolvedMode)

    return contextRegistry[key]

}

export default createStore

export type { SchedulerMode } from "./registry";
export { default as useStore } from "./useStore";

export const batch = batchUpdates;
export const setStoreScheduleMode = (key: string, mode: SchedulerMode) => {
    setSchedulerMode(key, mode);
};
