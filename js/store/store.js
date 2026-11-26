/**
 * Tiny unidirectional store: set state, notify subscribers, render.
 *
 * @template {Record<string, unknown>} T
 * @param {T} initialState
 */
export function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    getState() {
      return state;
    },

    /**
     * @param {Partial<T> | ((current: T) => T)} update
     */
    setState(update) {
      const next =
        typeof update === 'function' ? update(state) : { ...state, ...update };
      if (Object.is(next, state)) return;
      state = next;
      listeners.forEach((listener) => listener(state));
    },

    /**
     * @param {(state: T) => void} listener
     * @returns {() => void} unsubscribe
     */
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
  };
}
