/**
 * Export callbacks' subscribe functions
 * @param {object} callbacks Each property is a callback from createCallback() with a subscribe() function
 * @return {object} An object with properties for each callback exported, each being the subscribe() function from the callback
 */
export default function exportCallbacks(callbacks) {
    const exported = {};

    function exportCallback(key, callback) {
        if (callback && typeof callback.subscribe === 'function') {
            exported[key] = callback.subscribe;
        }
    }

    if (callbacks) {
        Object.keys(callbacks).forEach((key) => exportCallback(key, callbacks[key]));
    }

    return exported;
}
