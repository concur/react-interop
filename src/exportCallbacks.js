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
