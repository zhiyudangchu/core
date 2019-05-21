import * as React from 'react';
import * as ReactDom from 'react-dom';
import { App, SlotLocation, SlotMap, BrowserModule, AppProps, RootApp, IRootAppOpts, createClientConnection } from '@ali/ide-core-browser';
import {StubClient} from '@ali/ide-connection';
import { Injector, ConstructorOf, Provider } from '@ali/common-di';

export function renderApp(main: BrowserModule, modules?: BrowserModule[]): void;
export function renderApp(opts: IRootAppOpts): void;
export function renderApp(arg1: BrowserModule | IRootAppOpts, arg2: BrowserModule[] = []) {
  let opts: IRootAppOpts;
  let modules: BrowserModule[];
  const slotMap: SlotMap = new Map();
  const injector = new Injector();
  if (arg1 instanceof BrowserModule) {
    modules = [arg1, ...arg2];
    opts = { modules: [], modulesInstances: modules, slotMap };
  } else {
    opts = arg1;
  }
  opts.injector = injector;

  const app = new RootApp(opts);
  const firstModule = app.browserModules.values().next().value;
  if (firstModule) {
    const { value: component } = firstModule.slotMap.values().next();
    slotMap.set(SlotLocation.main, component);
  }

  createClientConnection(injector, opts.modules, 'ws://127.0.0.1:8000/service', () => {
    ReactDom.render((
      <App app={ app } />
    ), document.getElementById('main'));
  });
}
