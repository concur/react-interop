/*

The MIT License (MIT)

Copyright (c) 2015-present Dan Abramov

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
import {createCallback} from '../src';

test('supports multiple subscriptions', () => {
    const callback = createCallback();
    const listenerA = jest.fn();
    const listenerB = jest.fn();

    let unsubscribeA = callback.subscribe(listenerA);
    callback.dispatch();
    expect(listenerA.mock.calls.length).toBe(1);
    expect(listenerB.mock.calls.length).toBe(0);

    callback.dispatch();
    expect(listenerA.mock.calls.length).toBe(2);
    expect(listenerB.mock.calls.length).toBe(0);

    const unsubscribeB = callback.subscribe(listenerB);
    expect(listenerA.mock.calls.length).toBe(2);
    expect(listenerB.mock.calls.length).toBe(0);

    callback.dispatch();
    expect(listenerA.mock.calls.length).toBe(3);
    expect(listenerB.mock.calls.length).toBe(1);

    unsubscribeA();
    expect(listenerA.mock.calls.length).toBe(3);
    expect(listenerB.mock.calls.length).toBe(1);

    callback.dispatch();
    expect(listenerA.mock.calls.length).toBe(3);
    expect(listenerB.mock.calls.length).toBe(2);

    unsubscribeB();
    expect(listenerA.mock.calls.length).toBe(3);
    expect(listenerB.mock.calls.length).toBe(2);

    callback.dispatch();
    expect(listenerA.mock.calls.length).toBe(3);
    expect(listenerB.mock.calls.length).toBe(2);

    unsubscribeA = callback.subscribe(listenerA);
    expect(listenerA.mock.calls.length).toBe(3);
    expect(listenerB.mock.calls.length).toBe(2);

    callback.dispatch();
    expect(listenerA.mock.calls.length).toBe(4);
    expect(listenerB.mock.calls.length).toBe(2);
});

test('only removes listener once when unsubscribe is called', () => {
    const callback = createCallback();
    const listenerA = jest.fn();
    const listenerB = jest.fn();

    const unsubscribeA = callback.subscribe(listenerA);
    callback.subscribe(listenerB);

    unsubscribeA();
    unsubscribeA();

    callback.dispatch();
    expect(listenerA.mock.calls.length).toBe(0);
    expect(listenerB.mock.calls.length).toBe(1);
});

test('only removes relevant listener when unsubscribe is called', () => {
    const callback = createCallback();
    const listener = jest.fn();

    callback.subscribe(listener);
    const unsubscribeSecond = callback.subscribe(listener);

    unsubscribeSecond();
    unsubscribeSecond();

    callback.dispatch();
    expect(listener.mock.calls.length).toBe(1);
});

test('supports removing a subscription within a subscription', () => {
    const callback = createCallback();
    const listenerA = jest.fn();
    const listenerB = jest.fn();
    const listenerC = jest.fn();

    callback.subscribe(listenerA);
    const unSubB = callback.subscribe(() => {
      listenerB();
      unSubB();
    });
    callback.subscribe(listenerC);

    callback.dispatch();
    callback.dispatch();

    expect(listenerA.mock.calls.length).toBe(2);
    expect(listenerB.mock.calls.length).toBe(1);
    expect(listenerC.mock.calls.length).toBe(2);
});

test('delays unsubscribe until the end of current dispatch', () => {
    const callback = createCallback();

    const unsubscribeHandles = [];
    const doUnsubscribeAll = () => unsubscribeHandles.forEach(
      unsubscribe => unsubscribe()
    );

    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const listener3 = jest.fn();

    unsubscribeHandles.push(callback.subscribe(() => listener1()));
    unsubscribeHandles.push(callback.subscribe(() => {
      listener2();
      doUnsubscribeAll();
    }));
    unsubscribeHandles.push(callback.subscribe(() => listener3()));

    callback.dispatch();
    expect(listener1.mock.calls.length).toBe(1);
    expect(listener2.mock.calls.length).toBe(1);
    expect(listener3.mock.calls.length).toBe(1);

    callback.dispatch();
    expect(listener1.mock.calls.length).toBe(1);
    expect(listener2.mock.calls.length).toBe(1);
    expect(listener3.mock.calls.length).toBe(1);
});

test('delays subscribe until the end of current dispatch', () => {
    const callback = createCallback();

    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const listener3 = jest.fn();

    let listener3Added = false;
    const maybeAddThirdListener = () => {
      if (!listener3Added) {
        listener3Added = true;
        callback.subscribe(() => listener3());
      };
    };

    callback.subscribe(() => listener1());
    callback.subscribe(() => {
      listener2();
      maybeAddThirdListener();
    });

    callback.dispatch();
    expect(listener1.mock.calls.length).toBe(1);
    expect(listener2.mock.calls.length).toBe(1);
    expect(listener3.mock.calls.length).toBe(0);

    callback.dispatch();
    expect(listener1.mock.calls.length).toBe(2);
    expect(listener2.mock.calls.length).toBe(2);
    expect(listener3.mock.calls.length).toBe(1);
});

test('uses the last snapshot of subscribers during nested dispatch', () => {
    const callback = createCallback();

    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const listener3 = jest.fn();
    const listener4 = jest.fn();

    let unsubscribe4;
    const unsubscribe1 = callback.subscribe(() => {
      listener1();
      expect(listener1.mock.calls.length).toBe(1);
      expect(listener2.mock.calls.length).toBe(0);
      expect(listener3.mock.calls.length).toBe(0);
      expect(listener4.mock.calls.length).toBe(0);

      unsubscribe1();
      unsubscribe4 = callback.subscribe(listener4);
      callback.dispatch();

      expect(listener1.mock.calls.length).toBe(1);
      expect(listener2.mock.calls.length).toBe(1);
      expect(listener3.mock.calls.length).toBe(1);
      expect(listener4.mock.calls.length).toBe(1);
    });
    callback.subscribe(listener2);
    callback.subscribe(listener3);

    callback.dispatch();
    expect(listener1.mock.calls.length).toBe(1);
    expect(listener2.mock.calls.length).toBe(2);
    expect(listener3.mock.calls.length).toBe(2);
    expect(listener4.mock.calls.length).toBe(1);

    unsubscribe4();
    callback.dispatch();
    expect(listener1.mock.calls.length).toBe(1);
    expect(listener2.mock.calls.length).toBe(3);
    expect(listener3.mock.calls.length).toBe(3);
    expect(listener4.mock.calls.length).toBe(1);
});

test('provides the dispatch params to the subscribers', done => {
    const callback = createCallback();
    callback.subscribe((...params) => {
      expect(params).toEqual([
        {
          id: 1,
          text: 'Hello'
        }
      ]);
      done();
    });
    callback.dispatch({id: 1, text: 'Hello'});
});

test('does not leak private listeners array', done => {
    const callback = createCallback();
    callback.subscribe(function () {
      expect(this).toBe(undefined);
      done();
    });
    callback.dispatch();
});