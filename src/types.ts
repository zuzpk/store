import { Context as C, Dispatch, FC, ReactNode } from "react"
import createDispatcher from "./dispatch"

export type dynamicObject = { 
    [x: string] : any 
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