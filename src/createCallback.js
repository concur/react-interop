/*

The MIT License (MIT)

Copyright (c) 2015-present Dan Abramov

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * Create a pub/sub callback object
 * @return {object} Exposes dispatch and subscribe functions. The subscribe function returns the corresponding unsubscribe function.
 */
export default function createCallback() {
    // We will snapshot the listeners before dispatching
    // so subscription changes happen on nextListeners
    let currentListeners = [];
    let nextListeners = currentListeners;

    function ensureCanMutateNextListeners() {
        if (nextListeners === currentListeners) {
            nextListeners = currentListeners.slice();
        }
    }

    function subscribe(listener) {
        if (typeof listener !== 'function') {
            throw new Error('Expected listener to be a function');
        }

        let isSubscribed = true;

        ensureCanMutateNextListeners();
        nextListeners.push(listener);

        return function unsubscribe() {
            if (!isSubscribed) {
                return;
            }

            isSubscribed = false;

            ensureCanMutateNextListeners();
            const index = nextListeners.indexOf(listener);
            nextListeners.splice(index, 1);
        };
    }

    function dispatch(...params) {
        // snapshot the next listeners into current listeners
        currentListeners = nextListeners;

        const listeners = currentListeners;

        listeners.forEach((listener) => {
            listener(...params);
        });
    }

    return {
        subscribe,
        dispatch
    };
}
