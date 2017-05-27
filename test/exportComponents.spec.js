import {exportComponents} from '../src';
import React from 'react';

describe('exportComponents', () => {
    test('exports an empty object by default', () => {
        const actual = exportComponents();
        expect(actual).toEqual({});
    });

    describe('exports components', () => {
        const componentTypes = {
            Foo() {},
            Bar() {}
        };

        const exported = exportComponents(componentTypes);

        test('for each component type', () => {
            const actual = Object.keys(exported).sort();
            expect(actual).toEqual(['Bar', 'Foo']);
        });

        const { Bar, Foo } = exported;

        test('with a createElement function', () => {
            const createElement = Foo.createElement;
            expect(createElement).toBeInstanceOf(Function);
        });

        test('with a render function', () => {
            const { render } = Foo;
            expect(render).toBeInstanceOf(Function);
        });

        test('with a renderToStaticMarkup function', () => {
            const { renderToStaticMarkup } = Foo;
            expect(renderToStaticMarkup).toBeInstanceOf(Function);
        });
    });
});

describe('exported', () => {
    const NameComponent = ({name}) => (<span id='name-component'>{name}</span>);

    describe('without a Container', () => {
        const exported = exportComponents({NameComponent});

        describe('createElement', () => {
            test('creates a valid React element', () => {
                const element = exported.NameComponent.createElement();
                expect(React.isValidElement(element)).toBe(true);
            });

            test('passes props through to the component', () => {
                const element = exported.NameComponent.createElement({name: 'withProps'});
                expect(element.props.name).toBe('withProps');
            });
        });

        describe('renderToStaticMarkup', () => {
            test('renders the element', () => {
                const markup = exported.NameComponent.renderToStaticMarkup();
                expect(markup).toEqual('<span id="name-component"></span>');
            });

            test('uses props for the component', () => {
                const markup = exported.NameComponent.renderToStaticMarkup({name: 'usesProps'});
                expect(markup).toEqual('<span id="name-component">usesProps</span>');
            });
        });
    });

    describe('with a Container', () => {
        const Container = ({children, containerName}) => (
            <div id='container-component'>
                <span id='container-name'>{containerName}</span>
                {children}
            </div>
        );

        const exported = exportComponents({NameComponent}, Container, {containerName: 'TheContainer'});

        describe('createElement', () => {
            const element = exported.NameComponent.createElement({name: 'inContainer'});

            test('passes the container props through to the container', () => {
                expect(element.props.containerName).toEqual('TheContainer');
            });

            test('uses the component props', () => {
                expect(element.props.children.props.name).toEqual('inContainer');
            });
        });

        describe('renderToStaticMarkup', () => {
            test('renders the component into the Container', () => {
                const markup = exported.NameComponent.renderToStaticMarkup({name: 'inContainer'});
                expect(markup).toEqual(`<div id="container-component"><span id="container-name">TheContainer</span><span id="name-component">inContainer</span></div>`);
            });
        });
    });
});

