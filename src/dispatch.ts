import { Context, useContext } from "react";
import { contextCache } from "./registry";
import { dynamicObject } from "./types";

interface Props {
    key: string,
    context: Context<any>
}

let queue : dynamicObject[] = [];
let isProcessing = false;

const processQueue = async (key: string, dispatch: any) => {
    if (isProcessing) return;

    isProcessing = true;

    while (queue.length > 0) {
        const action = queue.shift();
        await dispatch(action);
        contextCache[key] = action
    }

    isProcessing = false;
};

const _prepareState = (prevState: { [x: string]: any; }, nextState: { [x: string]: any; }) => {
    const nextKeys = Object.keys(nextState)
    nextKeys.map(k => {
        if(prevState[k] !== nextState[k]){
            prevState[k] = nextState[k]
        }
    });
    return {
        ...prevState,
        ...nextState
    }
}

const prepareState = (prevState: dynamicObject, nextState: dynamicObject) => {

    // let changed = false;
    const newState = { ...prevState, ...nextState };

    const changed = Object.keys(nextState).some(
        (key) => prevState[key] !== nextState[key]
    );

    // Object.keys(nextState).forEach((k) => {
    //     if (prevState[k] !== nextState[k]) {
    //         newState[k] = nextState[k];
    //         changed = true;
    //     }
    // });

    return changed ? newState : prevState;
};

const createDispatcher = (props: Props) => {

    const { key, context } = props;

    const state : dynamicObject = useContext(context)
    const dispatch = state['dispatch'];

   

    return async (payload = {}) => {
        queue.push({ ...prepareState( contextCache[key], payload) })
        processQueue(key, dispatch)
    }
    // return async (payload = {}) => dispatch({ ...prepareState(state, payload) });
    

}

export default createDispatcher