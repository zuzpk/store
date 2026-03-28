import { ContextRegistry, DispatchQueueItem, dynamic } from "./types";

export const contextRegistry: ContextRegistry = {};
export const contextCache = new Map<string, dynamic>();
export const actionQueue : {
    [x: string] : DispatchQueueItem[]
} = {}