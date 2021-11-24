import { ExtHostStatusBar } from '../../../../src/hosted/api/vscode/ext.host.statusbar';
import { Emitter, ILoggerManagerClient, uuid } from '@ide-framework/ide-core-common';
import { MainThreadAPIIdentifier, ExtHostAPIIdentifier } from '../../../../src/common/vscode';
import { RPCProtocol, WSChannelHandler } from '@ide-framework/ide-connection';
import { MainThreadStatusBar } from '../../../../src/browser/vscode/api/main.thread.statusbar';
import { createBrowserInjector } from '../../../../../../tools/dev-tool/src/injector-helper';
import { mockService } from '../../../../../../tools/dev-tool/src/mock-injector';
import { MockLoggerManagerClient } from '../../../../__mocks__/loggermanager';
import { IContextKeyService, IStatusBarService } from '@ide-framework/ide-core-browser';
import { StatusBarService } from '@ide-framework/ide-status-bar/lib/browser/status-bar.service';
import { ThemeColor } from '../../../../src/common/vscode/ext-types';
import { mockExtensionDescription } from '../../../../__mocks__/extensions';
import { MockContextKeyService } from '@ide-framework/ide-core-browser/__mocks__/context-key';

const emitterA = new Emitter<any>();
const emitterB = new Emitter<any>();

const mockClientA = {
  send: (msg) => emitterB.fire(msg),
  onMessage: emitterA.event,
};
const mockClientB = {
  send: (msg) => emitterA.fire(msg),
  onMessage: emitterB.event,
};

const rpcProtocolExt = new RPCProtocol(mockClientA);
const rpcProtocolMain = new RPCProtocol(mockClientB);

let extHost: ExtHostStatusBar;
let mainThread: MainThreadStatusBar;

describe('vscode MainThreadStatusBar Test', () => {
  let injector;

  beforeEach(() => {
    injector = createBrowserInjector([]);
    injector.addProviders({
      token: ILoggerManagerClient,
      useClass: MockLoggerManagerClient,
    }, {
      token: WSChannelHandler,
      useValue: mockService({
        clientId: uuid(),
      }),
    }, {
      token: IStatusBarService,
      useClass: StatusBarService,
    }, {
      token: IContextKeyService,
      useClass: MockContextKeyService,
    });
    extHost = new ExtHostStatusBar(rpcProtocolExt);
    rpcProtocolExt.set(ExtHostAPIIdentifier.ExtHostStatusBar, extHost);

    mainThread = rpcProtocolMain.set(MainThreadAPIIdentifier.MainThreadStatusBar, injector.get(MainThreadStatusBar, [rpcProtocolMain]));
  });

  afterEach(() => {
    injector.disposeAll();
    jest.resetAllMocks();
  });

  it('support id', (done) => {
    // mock mainThread.$setMessage
    const $setMessage = jest.spyOn(mainThread, '$setMessage');

    const statusbar = extHost.createStatusBarItem(mockExtensionDescription, 'test');
    statusbar.show();
    // statusbar host 调用 main 有一个 定时器
    setTimeout(() => {
      expect($setMessage.mock.calls[0][1]).toBe('test.kaitian-extension.test');
      done();
    }, 100);
  });

  it('support name', (done) => {
    // mock mainThread.$setMessage
    const $setMessage = jest.spyOn(mainThread, '$setMessage');

    const statusbar = extHost.createStatusBarItem(mockExtensionDescription, 'test');

    statusbar.name = 'test name';
    statusbar.show();
    // statusbar host 调用 main 有一个 定时器
    setTimeout(() => {
      expect($setMessage.mock.calls[0][2]).toBe('test name');
      done();
    }, 100);
  });

  it('support command', (done) => {
    // mock mainThread.$setMessage
    const $setMessage = jest.spyOn(mainThread, '$setMessage');

    const statusbar = extHost.createStatusBarItem(mockExtensionDescription);
    statusbar.command = 'test';
    statusbar.show();
    // statusbar host 调用 main 有一个 定时器
    setTimeout(() => {
      expect($setMessage.mock.calls[0][10]).toBe('test');
      expect($setMessage.mock.calls[0][11]).toBe(undefined);
      done();
    }, 100);
  });

  it('support command arguments', (done) => {
    // mock mainThread.$setMessage
    const $setMessage = jest.spyOn(mainThread, '$setMessage');

    const statusbar = extHost.createStatusBarItem(mockExtensionDescription);
    statusbar.command = {
      title: 'test',
      command: 'test',
      arguments: ['test2'],
    };
    statusbar.show();
    // statusbar host 调用 main 有一个 定时器
    setTimeout(() => {
      expect($setMessage.mock.calls[0][10]).toBe('test');
      expect($setMessage.mock.calls[0][11]).toStrictEqual(['test2']);
      done();
    }, 100);
  });

  it('support accessibilityInformation', (done) => {
    // mock mainThread.$setMessage
    const $setMessage = jest.spyOn(mainThread, '$setMessage');

    const statusbar = extHost.createStatusBarItem(mockExtensionDescription);
    statusbar.accessibilityInformation = {
      label: '蛋总',
      role: 'danzong',
    };
    statusbar.show();
    // statusbar host 调用 main 有一个 定时器
    setTimeout(() => {
      expect($setMessage.mock.calls[0][9]).toStrictEqual({'label': '蛋总', 'role': 'danzong'});
      done();
    }, 100);
  });

  it('support backgroundColor', (done) => {
    // mock mainThread.$setMessage
    const $setMessage = jest.spyOn(mainThread, '$setMessage');

    const statusbar = extHost.createStatusBarItem(mockExtensionDescription);
    statusbar.backgroundColor = new ThemeColor('statusBarItem.errorBackground');
    statusbar.color = 'red';
    statusbar.show();
    // statusbar host 调用 main 有一个 定时器
    setTimeout(() => {
      expect(($setMessage.mock.calls[0][6] as ThemeColor).id).toStrictEqual('statusBarItem.errorForeground');
      expect(($setMessage.mock.calls[0][7] as ThemeColor).id).toStrictEqual('statusBarItem.errorBackground');
      done();
    }, 100);
  });

});