// js/core/store.js — estado unico + pub/sub. Sin dependencias de DOM ni storage.

export function createStore(initialState) {
  let state = initialState;
  const subs = new Set();
  return {
    getState: () => state,
    // updater: objeto parcial o funcion (state) => nuevoState
    setState(updater) {
      state = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
      for (const fn of subs) fn(state);
    },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
}
