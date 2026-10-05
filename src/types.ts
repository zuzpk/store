import { Context as C, Dispatch, FC, ReactNode } from "react"
import createDispatcher from "./dispatch"
import type { SchedulerMode } from "./registry"

export type dynamic = { 
    [x: string] : any 
}

export type DispatchQueueItem = {
    payload: dynamic;
    resolve: () => void;
}

export type stringObject = { 
    [x: string] : string
}

export type Provider = FC<{ children: ReactNode }>

export type Context = { state: any; dispatch: Dispatch<any>} | undefined

export type ContextRegistry = {
    [key: string]: {
        context: C<any>;
        Provider: Provider;
    }
};

export type Store<T> = T & {
    dispatch: ReturnType<typeof createDispatcher>
}

export type StorePerformanceAPI = {
    batch: <T>(callback: () => T) => T;
    setScheduleMode: (key: string, mode: SchedulerMode) => void;
}