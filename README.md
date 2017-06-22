# react-interop
Interop layer for consuming React components with other JavaScript libraries.

Do you want to render React components into a legacy application that uses a different framework?  Do you want your legacy code to be ignorant of the fact that React is being used?

Are you delivering a component for someone else to render in their application?  Do you need your component to work regardless of the framework their application is built in?

react-interop enables these scenarios by delivering your components in an API that can be used by virtually any other JavaScript framework.

## Demo

This repository includes a basic Stock Ticker style demo.  To run the demo:

``` sh
npm install
npm run demo
```

This demo will open a static HTML page demonstrates embedding exported components in a consuming application. This is a vanilla HTML page that consumes components exported through react-interop.

## Exporting Components

Exporting React components through react-interop makes them available for legacy or third-party integration.  To export them, create a webpack entry point to produce a JavaScript bundle to be referenced by the consumer (legacy or third-party).  The entry point will have code like the following.

``` jsx
// Run webpack over this entry point to produce a JS file
// that provides the exported components via react-interop
// For this example, output would be 'stockticker.js'

import {exportComponents} from 'react-interop';
import React from 'react';

// StockPrice is a sample React component that we want to export
const StockPrice = ({symbol, price}) => (
    <div>
        <strong>{symbol}</strong>: {price.toFixed(2)}
    </div>
);

// exportComponents provides an API over all specified components
// that allows them to be rendered either as static markup or
// with live React rendering
const exported = exportComponents({
    StockPrice
});

// The exported components can be made available globally
// for consumers to reference
window.StockTicker = exported;
```

## Consuming Exported Components as HTML (Static Markup)

Exported components integrate into legacy or third-party applications using vanilla JavaScript to get the HTML of the rendered components.

``` html
<script src="stockticker.js"></script>
<script>

    var stockHTML = window.StockTicker.StockPrice.renderToStaticMarkup({
        symbol: 'SAP',
        price: 104
    });

</script>
```

## Consuming Exported Components for Live Rendering

Exported components also provide live rendering for "durable" containers where the component becomes the owner of the container element.

``` html
<!-- The DIV that the display name component will be rendered into -->
<div id="stockprice-sap"></div>

<script src="stockticker.js"></script>
<script>

    window.StockTicker.StockPrice.render(
        {symbol: 'SAP', price: 104},
        // Supply either an element or and element id string
        // (for document.getElementById to be used by default)
        document.getElementById('stockprice-sap')
    );

</script>
```

## Backing Components with redux

react-interop also supports backing components with redux or other container components to enable state-driven components.  This works with both static markup and live rendering.

To accomplish this, the webpack entry point will create the redux store, and pass the `Provider` component and its props to `exportComponents`.

``` jsx
// Run webpack over this entry point to produce a JS file
// that provides the exported components via react-interop
// For this example, output would be 'stockticker.js'

import {createStore} from 'redux';
import {exportComponents} from 'react-interop';
import React from 'react';
import {connect, Provider} from 'react-redux';

function reducer(state = {}, action) {
    switch (action.type) {
        case 'SET_STOCK_PRICE':
            const {price, symbol} = action;

            return {
                ...state,
                [symbol]: price
            };

        default:
            return state;
    }
}

// StockPrice is a sample React component that we want to export
// symbol comes from props, price come from state
const StockPrice = ({symbol, price}) => (
    <div>
        <strong>{symbol}</strong>: {price.toFixed(2)}
    </div>
);

const mapStateToProps = (state, {symbol}) => ({
    symbol,
    price: state[symbol]
});

const ConnectedStockPrice = connect(mapStateToProps)(StockPrice);

const store = createStore(reducer, {SAP: 104});

// The second parameter is the container type that every
// component instance should be rendered within.
// The third parameter is an object that represents the
// props to provide to the container elements themselves
// In this example, we supply react-redux Provider and
// the store instance to be used for every Provider
const exported = exportComponents(
    {
        StockPrice: ConnectedStockPrice
    },
    Provider,
    {store}
);

// The exported components can be made available globally
// for consumers to reference
window.StockTicker = exported;
```

Consumers of exported components do not need to do anything differently when the components are wrapped in a container.  But in this example, the consumer can now render a `StockPrice` using only the symbol and the price will be pulled from the store.

``` html
<!-- The DIV that the display name component will be rendered into -->
<div id="stockprice-sap"></div>

<script src="stockticker.js"></script>
<script>

    window.StockTicker.StockPrice.render({symbol: 'SAP'}, 'stockprice-sap');

</script>
```

_Note that react-interop does not depend on redux or react-redux.  You can use any container element to wrap around exported components._

## Exporting Redux Action Creators

Alongside React components, you can also use a small bit of code to export action creators to the consuming application.  This relies on redux's `bindActionCreators` function to expose pure JavaScript functions that will dispatch actions on the store.

_Nothing is needed beyond `bindActionCreators` and a simple convention, so there are not any helpers from react-interop involved in exporting action creators._

``` jsx
// Run webpack over this entry point to produce a JS file
// that provides the exported components via react-interop
// For this example, output would be 'stockticker.js'

import {createStore} from 'redux';
import {exportComponents} from 'react-interop';
import React from 'react';
import {connect, Provider} from 'react-redux';

function reducer(state = {}, action) {
    switch (action.type) {
        case 'SET_STOCK_PRICE':
            const {price, symbol} = action;

            return {
                ...state,
                [symbol]: price
            };

        default:
            return state;
    }
}

function setStockPrice(symbol, price) {
    return {
        type: 'SET_STOCK_PRICE',
        symbol,
        price
    };
}

const StockPrice = ({symbol, price}) => (
    <div>
        <strong>{symbol}</strong>: {price.toFixed(2)}
    </div>
);

const mapStateToProps = (state, {symbol}) => ({
    symbol,
    price: state[symbol]
});

const ConnectedStockPrice = connect(mapStateToProps)(StockPrice);

const store = createStore(reducer, {SAP: 104});

const exported = exportComponents(
    {
        StockPrice: ConnectedStockPrice
    },
    Provider,
    {store}
);

// Use bindActionCreators to be ready to export the action creators
const exportedActions = bindActionCreators({setStockPrice}, store.dispatch);

// The exported components and actions can be made
// available globally for consumers to reference
window.StockTicker = {
    ...exportedComponents,
    ...exportedActions
};
```

With this approach, consumers can now invoke vanilla JavaScript functions that will dispatch redux actions, update the store, and cause any exported components rendered through the `render` method to update.  Subsequent calls to `renderToStaticMarkup` will also respect store updates.

``` html
<!-- The DIV that the display name component will be rendered into -->
<div id="stockprice-sap"></div>

<script src="stockticker.js"></script>
<script>

    window.StockTicker.StockPrice.render({symbol: 'SAP'}, 'stockprice-sap');

    // This results in dispatching the setStockPrice action
    // and the store will be updated with {SAP: 105}.
    // Because live rendering is used, the rendered stock
    // price will automatically be re-rendered.
    window.StockTicker.setStockPrice('SAP', 105);

</script>
```

_Note that react-interop does not depend on redux.  This same approach can be used with other state management implementations._

## Making Callbacks to Consumers

If the consumer uses the `renderToStaticMarkup` rendering approach, there may be times when you need to invoke a callback to inform the consuming application that components need to be re-rendered or that other notable events have occurred.

To fulfill this requirement, react-interop supplies a pub/sub model based on redux's `subscribe` implementation.  The webpack entry point will define callbacks that the consumer can subscribe to.

``` jsx
// Run webpack over this entry point to produce a JS file
// that provides the exported components via react-interop
// For this example, output would be 'stockticker.js'

import React from 'react';
import {connect, Provider} from 'react-redux';
import {applyMiddleware, bindActionCreators, createStore} from 'redux';
import {createCallback, exportCallbacks, exportComponents} from '../src';

function applyFluctuation(stocks) {
    const newStocks = {};

    Object.keys(stocks).forEach((symbol) => {
        // Apply a fluctuation of +/- 10%
        const fluctuation = (Math.random() - 0.5) * 0.1;

        newStocks[symbol] = stocks[symbol] + (stocks[symbol] * fluctuation);
    });

    return newStocks;
}

function reducer(state = {}, action) {
    switch (action.type) {
        case 'SET_STOCK_PRICE':
            const {price, symbol} = action;

            return {
                ...state,
                [symbol]: price
            };

        case 'FLUCTUATE_STOCKS':
            return applyFluctuation(state);

        default:
            return state;
    }
}

function setStockPrice(symbol, price) {
    return {
        type: 'SET_STOCK_PRICE',
        symbol,
        price
    };
}

function fluctuateStockPrices() {
    return {
        type: 'FLUCTUATE_STOCKS'
    };
}

const StockPrice = ({symbol, price}) => (
    <div>
        <strong>{symbol}</strong>: {price.toFixed(2)}
    </div>
);

const mapStateToProps = (state, {symbol}) => ({
    symbol,
    price: state[symbol]
});

const ConnectedStockPrice = connect(mapStateToProps)(StockPrice);

// Create a callback pub/sub instance
const onPriceChanged = createCallback();

// Using redux middleware, watch for price changes
// and notify subscribers that a price was changed
const priceChangeMiddleware = store => next => action => {
    const oldPrices = store.getState();

    next(action);

    const newPrices = store.getState();

    Object.keys(newPrices).forEach((symbol) => {
        if (newPrices[symbol] !== oldPrices[symbol]) {
            onPriceChanged.dispatch({
                symbol,
                price: newPrices[symbol]
            });
        }
    });
};

const store = createStore(
    reducer,
    {SAP: 104},
    applyMiddleware(priceChangeMiddleware)
);

// Fluctuate stock prices every 5 seconds
function dispatchFluctuation() {
    store.dispatch(fluctuateStockPrices());
}

window.setInterval(dispatchFluctuation, 5000);

// Generate the exported components
const exportedComponents = exportComponents(
    {
        StockPrice: ConnectedStockPrice
    },
    Provider,
    {store}
);

// Use bindActionCreators to be ready to export the action creators
const exportedActions = bindActionCreators({setStockPrice}, store.dispatch);

// Generate the exported callbacks
const exportedCallbacks = exportCallbacks({onPriceChanged});

// The exported components, actions, and callbacks can
// be made available globally for consumers to reference
window.StockTicker = {
    ...exportedComponents,
    ...exportedActions,
    ...exportedCallbacks
};
```

With the `onPriceChanged` callback exported, consumers can now subscribe and receive the callback parameters.

``` html
<!-- The DIV that the display name component will be rendered into -->
<div id="stockprice-sap"></div>

<script src="stockticker.js"></script>
<script>

    function renderSAPStockPrice() {
        var stockHTML = window.StockTicker.StockPrice.renderToStaticMarkup(
            {symbol: 'SAP'}
        );

        document.getElementById('stockprice-sap').innerHTML = stockHTML;
    }

    // When the StockTicker notifies that a price has changed,
    // log a status message and re-render the SAP stock price
    // if it was the price that changed
    function notifyOnStockChange(stock) {
        console.log('A stock price changed', stock.symbol, stock.price);

        if (stock.symbol === 'SAP') {
            renderSAPStockPrice();
        }
    }

    renderSAPStockPrice();

    // The corresponding unsubscribe function is returned
    var unsubscribe = window.StockTicker.onPriceChanged(notifyOnStockChange);

</script>
```

_Note that react-interop does not depend on redux.  These callbacks can be used for any scenario where the consuming application needs to be notified._

## Wrap-Up

react-interop provides `exportComponents` and `exportCallbacks` utilities to make it easy to provide an interop layer over your React components.  This interop layer allows your components to be rendered in legacy application or third-party applications where React might not be in direct use.  Consumers use vanilla JavaScript functions to render components, invoke actions, and subscribe to callbacks.

The two rendering scenarios are:

1. `render` components into "durable" containers (where the component then becomes the owner of the container)
2. `renderToStaticMarkup` gets the static HTML markup from components for rendering controlled by the consumer

react-interop prescribes the use of redux's `bindActionCreators` (or analogous methods from other flux implementations) to expose functions for invoking actions without the consuming being aware of the flux implementation.

Using `exportCallbacks` (along with `createCallback`), consumers subscribe to events and receive vanilla JavaScript callbacks with parameters.

To provide your components to the consumer, create a webpack entry point that constructs your store and exports your components, actions, and callbacks.  Your consumers will reference your bundle as a vanilla JavaScript file.
