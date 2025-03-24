import { Context, ReactNode, useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { dynamicObject } from "./types";

interface Props {
    children: ReactNode,
}

const rootReducer = (state: any, action: { payload: any; } ) => ({
    ...state,
    ...action.payload
})

const createProvider = <T extends dynamicObject>(InContext: Context<{ state: T; dispatch: (args: dynamicObject) => void}>, initialState: T) => {
    
    const Provider = (props: Props) => {

        const isMounted = useRef<boolean>(false)

        useEffect(() => {
            isMounted.current = true;
            return () => {
                isMounted.current = false;
            }
        }, [])

        const { children } = props

        const rootState = useMemo(() => ({ 
            ...initialState
        }), [initialState])

        const [state, _dispatch] = useReducer(rootReducer, rootState);

        const dispatch = useCallback(
            (args: dynamicObject) => {
                if (isMounted) {
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
            [state]
        )

        return <InContext.Provider value={providedValue}>{children}</InContext.Provider>

    }

    return Provider

}

export default createProvider