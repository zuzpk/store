import { Context, ReactNode, useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { dynamic } from "./types";

interface Props {
    children: ReactNode,
}

// Bail out if no key actually changed — React will skip re-render when the
// same state reference is returned from the reducer.
const rootReducer = (state: any, action: { payload: any }) => {
    const next = action.payload;
    const changed = Object.keys(next).some(k => state[k] !== next[k]);
    return changed ? { ...state, ...next } : state;
};

const createProvider = <T extends dynamic>(InContext: Context<{ state: T; dispatch: (args: dynamic) => void}>, initialState: T) => {
    
    const Provider = (props: Props) => {

        const isMounted = useRef<boolean>(false)

        useEffect(() => {
            isMounted.current = true;
            return () => {
                isMounted.current = false;
            }
        }, [])

        const { children } = props

        // initialState is a stable reference captured in closure — no useMemo needed.
        const [state, _dispatch] = useReducer(rootReducer, initialState);

        const dispatch = useCallback(
            (args: dynamic) => {
                if (isMounted.current) {  // FIX: was `isMounted` (ref object → always truthy)
                    _dispatch({ payload: { ...args } });
                }
            }, 
            [_dispatch]
        );

        const providedValue = useMemo(
            () => ({
                ...state,
                dispatch
            }),
            [state, dispatch]  // FIX: dispatch was missing from deps
        )

        return <InContext.Provider value={providedValue}>{children}</InContext.Provider>

    }

    return Provider

}

export default createProvider