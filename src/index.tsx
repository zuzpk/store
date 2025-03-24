import {
    createContext
} from "react";
import createProvider from "./provider";
import { contextCache, contextRegistry } from "./registry";
import { dynamicObject } from "./types";

const createStore = <T extends dynamicObject>(key: string, initialState: T) => {

    if (contextRegistry[key]) {
        return contextRegistry[key];
    }

    const InContext = createContext<{ state: T; dispatch: (args: dynamicObject) => void}>({
        state:  initialState,
        dispatch: () => {}
    })

    contextRegistry[key] = {
        context: InContext, 
        Provider: createProvider(InContext, initialState),
    }

    contextCache[key] = initialState

    return contextRegistry[key]

}

export default createStore

export { default as useStore } from "./useStore";
