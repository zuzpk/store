---
name: zuzjs-store
description: Build React global state with @zuzjs/store using keyed stores, selector-based subscriptions, shallow object dispatches, batching, and configurable flush scheduling.
---

# @zuzjs/store

`@zuzjs/store` is a lightweight React 19 global-state library. Stores are identified by string keys. Components read a complete store or a selected slice through `useStore`, and update it by dispatching shallow object patches.

## Install

```bash
npm install @zuzjs/store
# or
pnpm add @zuzjs/store
```

The package requires React `^19.2.3` and Node.js `>=18.17.0`.

## Core workflow

1. Create each keyed store once, before components call `useStore` for that key.
2. Render the returned `Provider` around the relevant UI.
3. Read state with `useStore`.
4. Call the returned `dispatch` function with an object patch.

```tsx
import createStore, { useStore } from "@zuzjs/store";

type AppState = {
  count: number;
  loading: boolean;
};

const { Provider } = createStore<AppState>("app", {
  count: 0,
  loading: false,
});

function Counter() {
  const { count, dispatch } = useStore<{ count: number }>(
    "app",
    (state) => ({ count: state.count }),
  );

  return (
    <button onClick={() => void dispatch({ count: count + 1 })}>
      Count: {count}
    </button>
  );
}

export default function App() {
  return (
    <Provider>
      <Counter />
    </Provider>
  );
}
```

## Public API

### `createStore(key, initialState, mode?)`

Creates a store if `key` is new and returns an object containing its React `Provider`.

```ts
const { Provider } = createStore("session", {
  token: null as string | null,
  loading: false,
});
```

- `key` is the global identifier for the store.
- `initialState` must be an object.
- `mode` optionally controls flush timing: `"microtask"`, `"raf"`, or `"sync"`.
- Recreating an existing key **does not replace its initial state or Provider**. If a `mode` is supplied on a later call, only the schedule mode changes.

Create stores during module initialization, not conditionally during rendering.

### `useStore(key, selector?, equalityFn?)`

Reads a store and returns the selected fields plus `dispatch`.

```ts
const store = useStore("session");
// store contains all state fields and `dispatch`

const { token, dispatch } = useStore<{ token: string | null }>(
  "session",
  (state) => ({ token: state.token }),
);
```

A store must be created before this hook runs. Otherwise it throws an error listing available store keys.

#### Selectors and equality

Use selectors to subscribe to the smallest useful value. By default, selector output uses `Object.is` equality.

```tsx
type Profile = { id: string; name: string } | null;

const { profile } = useStore<{ profile: Profile }>(
  "user",
  (state) => ({ profile: state.profile }),
  (previous, next) => previous.profile?.id === next.profile?.id,
);
```

When a selector returns a new object or array every time, provide an equality function that preserves the prior selection when its meaningful values have not changed. Otherwise that component will re-render for unrelated store notifications.

> **Typing note:** `useStore<T>` describes the selected state shape. Its result is that shape augmented with `dispatch`. For a full-store read, use the full state type as `T`.

### `dispatch(payload)`

`dispatch` queues a shallow object patch and returns `Promise<void>`. Await it when code must run after the queued flush that includes that dispatch.

```tsx
const { dispatch } = useStore<AppState>("app");

async function load() {
  await dispatch({ loading: true });
  // Perform async work here.
  await dispatch({ loading: false });
}
```

All queued payloads in one flush are merged left-to-right over the current state:

```ts
dispatch({ loading: true });
dispatch({ count: 1 });
// next state includes both patches
```

Dispatch only plain object patches. Function updaters, reducers, and deep merges are not supported. Replace nested objects explicitly:

```ts
await dispatch({
  profile: { ...profile, name: "Ada" },
});
```

A flush notifies subscribers only when at least one top-level property is `!==` its previous value. Re-dispatching only identical top-level values does not notify.

### `batch(callback)`

`batch` groups notifications caused by synchronous work in `callback`. It returns the callback’s value.

```ts
import { batch } from "@zuzjs/store";

batch(() => {
  void dispatch({ loading: true });
  void dispatch({ token: "new-token" });
  void dispatch({ loading: false });
});
```

Use `batch` when the flush happens while the synchronous callback is still active, especially with `"sync"` scheduling. In the default `"microtask"` mode, multiple same-tick dispatches are already coalesced, so `batch` is mainly useful for making synchronous flush behavior notify once. Do not rely on it to span `await`: the batch ends as soon as an async callback returns its promise.

### `setStoreScheduleMode(key, mode)`

Changes flush timing for a key.

```ts
import { setStoreScheduleMode } from "@zuzjs/store";

setStoreScheduleMode("app", "microtask");
setStoreScheduleMode("feed", "raf");
setStoreScheduleMode("critical", "sync");
```

Available modes:

| Mode | Behavior | Use when |
| --- | --- | --- |
| `"microtask"` | Default. Flushes after the current synchronous call stack. | General application state. |
| `"raf"` | Flushes at the next animation frame; falls back to a roughly 16 ms timeout when `requestAnimationFrame` is unavailable. | High-frequency visual updates. |
| `"sync"` | Flushes immediately inside `dispatch`. | Immediate state visibility is necessary. |

## Recommended patterns

- **Use stable, descriptive keys** such as `"session"`, `"cart"`, and `"notifications"`.
- **Select narrowly.** Prefer `state => ({ count: state.count })` over reading a large store if the component needs only `count`.
- **Make immutable updates.** Create a new array or nested object when changing it, because change detection is top-level and reference-based.
- **Expect coalescing.** With the default scheduler, multiple synchronous dispatches combine into one state update and notification per store.
- **Avoid stale event values.** Because dispatch accepts object values rather than updater functions, derive the next value from the latest selected value or consolidate related updates in one payload.

## Constraints and caveats

- State is held in a module-level registry for the lifetime of the JavaScript runtime. There is no public reset, removal, persistence, middleware, or devtools API.
- Store updates are shallow merges. Dispatching `{ settings: { theme: "dark" } }` replaces the entire `settings` object.
- A thrown selector or equality function will propagate during rendering/snapshot reads.
- `Provider` is returned by `createStore` and should wrap the relevant tree, but `useStore` subscribes through the keyed external registry rather than React context. A store still needs to be created before use.
- Do not use `setStoreScheduleMode` with an uninitialized key unless intentionally creating an empty internal store; create it first with `createStore` so the intended initial state is registered.

## Complete example

```tsx
import createStore, {
  batch,
  setStoreScheduleMode,
  useStore,
} from "@zuzjs/store";

type Todo = { id: string; title: string; done: boolean };
type TodoState = { todos: Todo[]; saving: boolean };

const { Provider } = createStore<TodoState>(
  "todos",
  { todos: [], saving: false },
  "microtask",
);

setStoreScheduleMode("todos", "microtask");

function TodoList() {
  const { todos, dispatch } = useStore<{
    todos: Todo[];
  }>("todos", (state) => ({ todos: state.todos }));

  const toggle = (id: string) => {
    const nextTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, done: !todo.done } : todo,
    );

    batch(() => {
      void dispatch({ saving: true });
      void dispatch({ todos: nextTodos });
      void dispatch({ saving: false });
    });
  };

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>
          <button onClick={() => toggle(todo.id)}>
            {todo.done ? "Undo" : "Complete"} {todo.title}
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function App() {
  return (
    <Provider>
      <TodoList />
    </Provider>
  );
}
```
