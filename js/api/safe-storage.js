import { StorageError } from './errors.js';

/**
 * Wrap a Web Storage backend so quota and security failures become a typed
 * StorageError instead of an unhandled exception.
 *
 * @param {Storage} [backend]
 */
export function createSafeStorage(backend) {
  let storage = backend;

  if (storage === undefined) {
    try {
      storage = globalThis.localStorage;
    } catch (cause) {
      throw new StorageError('Browser storage is unavailable.', cause);
    }
  }

  if (!storage) {
    throw new StorageError('Browser storage is unavailable.');
  }

  /**
   * @template T
   * @param {() => T} action
   * @returns {T}
   */
  function guard(action) {
    try {
      return action();
    } catch (cause) {
      throw new StorageError('Browser storage is unavailable or full.', cause);
    }
  }

  return {
    /**
     * @param {string} key
     * @returns {string | null}
     */
    getItem(key) {
      return guard(() => storage.getItem(key));
    },

    /**
     * @param {string} key
     * @param {string} value
     */
    setItem(key, value) {
      guard(() => storage.setItem(key, value));
    },

    /**
     * @param {string} key
     */
    removeItem(key) {
      guard(() => storage.removeItem(key));
    },

    /**
     * Remove only keys under a namespace, never the whole origin.
     *
     * @param {string} prefix
     */
    clearNamespace(prefix) {
      guard(() => {
        const keys = [];
        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index);
          if (key && key.startsWith(prefix)) keys.push(key);
        }
        keys.forEach((key) => storage.removeItem(key));
      });
    },
  };
}
