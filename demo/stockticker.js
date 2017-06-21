// Run webpack over this entry point to produce a JS file
// that provides the exported components via react-interop
// For this example, output will be 'stockticker-packed.js'

/* eslint-disable react/no-multi-comp */

import PropTypes from 'prop-types';
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

// StockPrice is a sample React component that we want to export
// symbol comes from props, price come from state
const StockPrice = ({symbol, price}) => (
    <div>
        <strong>{symbol}</strong>: {price.toFixed(2)}
    </div>
);

StockPrice.propTypes = {
    price: PropTypes.number.isRequired,
    symbol: PropTypes.string.isRequired
};

const mapStockPriceStateToProps = (state, {symbol}) => ({
    symbol,
    price: state[symbol]
});

const ConnectedStockPrice = connect(mapStockPriceStateToProps)(StockPrice);

const StockPrices = ({symbols}) => (
    <div>
        { symbols.map((symbol) => (<ConnectedStockPrice key={symbol} symbol={symbol} />)) }
    </div>
);

StockPrices.propTypes = {
    symbols: PropTypes.arrayOf(PropTypes.string).isRequired
};

const mapStockPricesStateToProps = (state) => ({
    symbols: Object.keys(state)
});

const ConnectedStockPrices = connect(mapStockPricesStateToProps)(StockPrices);

// Create a callback pub/sub instance
const onPriceChanged = createCallback();

// Using redux middleware, watch for price changes
// and dispatch out to any subscribers that a price was changed
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
    {
        SAP: 104
    },
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
        StockPrice: ConnectedStockPrice,
        StockPrices: ConnectedStockPrices
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
