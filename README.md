# @zuzjs/store

High-performance global state manager for React.

## Install

```bash
npm install @zuzjs/store
```

or

```bash
pnpm add @zuzjs/store
```

## Quick Start

```tsx
import createStore, { useStore } from "@zuzjs/store";

const { Provider } = createStore("app", {
	count: 0,
	loading: false,
	token: null,
});

function Counter() {
	const { count, dispatch } = useStore<{ count: number }>("app", s => ({ count: s.count }));

	return (
		<button onClick={() => dispatch({ count: count + 1 })}>
			{count}
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

## API

### `createStore(key, initialState, mode?)`

Creates (or returns) a store and its Provider.

```ts
const { Provider } = createStore("user", {
	uid: null,
	name: null,
	email: null,
	loading: true,
});
```

You can pass scheduler mode directly at creation time:

```ts
const { Provider } = createStore(
	"app",
	{ count: 0, loading: false },
	"microtask",
);
```

Available modes:

- `"microtask"` (default)
- `"raf"`
- `"sync"`

### `useStore(key, selector?, equalityFn?)`

- `key`: store key created with `createStore`
- `selector`: optional selector for slice subscriptions
- `equalityFn`: optional comparison function for selector output

```ts
const state = useStore("app");
const tokenState = useStore("app", s => ({ token: s.token }));
const profile = useStore("user", s => s.profile, (a, b) => a?.id === b?.id);
```

### `dispatch(payload)` returns `Promise<void>`

Dispatch is async and awaitable.

```ts
const { dispatch } = useStore("app");

await dispatch({ loading: true });

dispatch({ token: "abc" }).then(() => {
	// runs after the queued flush that included this dispatch
});
```

## Performance Features

### 1) Burst Coalescing (built-in)

Synchronous burst updates are merged into a single flush per store key.

```ts
const { dispatch } = useStore("app");

dispatch({ a: 1 });
dispatch({ b: 2 });
dispatch({ c: 3 });
// internally coalesced before notify
```

### 2) `batch(callback)`

Group updates and notify once at batch end.

```ts
import { batch } from "@zuzjs/store";

batch(() => {
	dispatch({ loading: true });
	dispatch({ token: "new-token" });
	dispatch({ loading: false });
});
```

### 3) `setStoreScheduleMode(key, mode)`

Control flush timing strategy per store:

- `"microtask"` (default): fastest general-purpose queueing
- `"raf"`: align updates with animation frame
- `"sync"`: flush immediately

```ts
import { setStoreScheduleMode } from "@zuzjs/store";

setStoreScheduleMode("app", "microtask");
setStoreScheduleMode("feed", "raf");
setStoreScheduleMode("critical", "sync");
```

## Compatibility Notes

Existing syntax remains valid:

```ts
useStore("app");
useStore("app", selector);
dispatch({ x: 1 });
createStore("app", { x: 1 });
```

New capabilities are additive:

```ts
useStore("app", selector, equalityFn);
await dispatch({ x: 1 });
createStore("app", { x: 1 }, "raf");
```

## Recommended Patterns

1. Use selectors to minimize renders in large trees.
2. Use `equalityFn` for derived objects that would otherwise be recreated.
3. Keep payloads shallow and targeted for better merge/bailout behavior.
4. Use `raf` mode for UI animation-heavy streams.
5. Use `batch` for chained updates that should notify once.

## Full Example

```tsx
import createStore, { batch, setStoreScheduleMode, useStore } from "@zuzjs/store";

const { Provider } = createStore("app", { count: 0, loading: false }, "microtask");
setStoreScheduleMode("app", "microtask");

function Controls() {
	const { count, dispatch } = useStore<{ count: number }>("app", s => ({ count: s.count }));

	const burst = async () => {
		batch(() => {
			dispatch({ loading: true });
			dispatch({ count: count + 1 });
			dispatch({ count: count + 2 });
			dispatch({ loading: false });
		});

		await dispatch({ count: count + 3 });
	};

	return <button onClick={burst}>Count: {count}</button>;
}

export default function App() {
	return (
		<Provider>
			<Controls />
		</Provider>
	);
}
```
