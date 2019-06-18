import { Provider, Injectable } from '@ali/common-di';
import { SlotMap, SlotLocation, BrowserModule } from '@ali/ide-core-browser';
import { MainLayout } from './main-layout.view';
import { MainLayoutContribution } from './main-layout.contribution';

@Injectable()
export class MainLayoutModule extends BrowserModule {
  providers: Provider[] = [
    MainLayoutContribution,
  ];
  component: React.FunctionComponent = MainLayout;
}
