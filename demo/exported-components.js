// Run webpack over this entry point to produce a JS file
// that provides the exported components via react-interop
// For this example, output would be 'exported-components.js'

import PropTypes from 'prop-types';
import React from 'react';
import {connect, Provider} from 'react-redux';
import {applyMiddleware, bindActionCreators, createStore} from 'redux';
import {createCallback, exportCallbacks, exportComponents} from '../src';

function reducer(state = {}, action) {
    let age;

    switch (action.type) {
        case 'SET_AGE':
            age = action.age;

            return {
                ...state,
                age
            };

        case 'INCREMENT_AGE':
            age = state.age + 1;

            return {
                ...state,
                age
            };

        default:
            return state;
    }
}

function setAge(age) {
    return {
        type: 'SET_AGE',
        age
    };
}

function incrementAge() {
    return {
        type: 'INCREMENT_AGE'
    };
}

// NameAndAge is a sample React component that we want to export
// name comes in through props, age will come from the store
const NameAndAge = ({age, name}) => (
    <div>
        <div>Name: {name}</div>
        <div>Age: {age}</div>
    </div>
);

NameAndAge.propTypes = {
    age: PropTypes.number,
    name: PropTypes.string
};

const mapStateToProps = ({age}) => ({age});
const ConnectedNameAndAge = connect(mapStateToProps)(NameAndAge);

// Create a callback pub/sub instance
const onAgeChanged = createCallback();

// Using redux middleware, watch for the age value to change
// and dispatch out to any subscribers that the age was updated
const ageNotificationMiddleware = store => next => action => {
    const {age: oldAge} = store.getState();

    next(action);

    const {age: newAge} = store.getState();

    if (oldAge !== newAge) {
        onAgeChanged.dispatch(newAge);
    }
};

const store = createStore(
    reducer,
    {age: 42},
    applyMiddleware(ageNotificationMiddleware)
);

// Every 10 seconds, increment the age by a year
function dispatchIncrementAge() {
    store.dispatch(incrementAge());
}

window.setInterval(dispatchIncrementAge, 10000);

// Generate the exported components
const exportedComponents = exportComponents(
    {
        DisplayName: ConnectedNameAndAge
    },
    Provider,
    {store}
);

// Use bindActionCreators to be ready to export the action creators
const exportedActions = bindActionCreators({setAge}, store.dispatch);

// Generate the exported callbacks
const exportedCallbacks = exportCallbacks({onAgeChanged});

// The exported components, actions, and callbacks can
// be made available globally for consumers to reference
window.ExportedComponents = {
    ...exportedComponents,
    ...exportedActions,
    ...exportedCallbacks
};
