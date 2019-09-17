import { Autowired, Injector, INJECTOR_TOKEN } from '@ali/common-di';
import { CommandContribution, CommandRegistry, ClientAppContribution, EXPLORER_COMMANDS, URI, Domain, KeybindingContribution, KeybindingRegistry, FILE_COMMANDS, localize } from '@ali/ide-core-browser';
import { ExplorerResourceService } from './explorer-resource.service';
import { FileTreeService, FileUri } from '@ali/ide-file-tree';
import { ComponentContribution, ComponentRegistry } from '@ali/ide-core-browser/lib/layout';
import { ExplorerResourcePanel } from './resource-panel.view';
import { ExplorerOpenEditorPanel } from './open-editor-panel.view';
import { IWorkspaceService, KAITIAN_MUTI_WORKSPACE_EXT } from '@ali/ide-workspace';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@ali/ide-activity-panel/lib/browser/tab-bar-toolbar';
import { IDecorationsService } from '@ali/ide-decoration';
import { SymlinkDecorationsProvider } from './symlink-file-decoration';
import { IMainLayoutService } from '@ali/ide-main-layout';

export const ExplorerResourceViewId = 'file-explorer';
export const ExplorerContainerId = 'explorer';

@Domain(ClientAppContribution, CommandContribution, ComponentContribution, KeybindingContribution, TabBarToolbarContribution, ClientAppContribution)
export class ExplorerContribution implements CommandContribution, ComponentContribution, KeybindingContribution, TabBarToolbarContribution, ClientAppContribution {

  @Autowired()
  private explorerResourceService: ExplorerResourceService;

  @Autowired()
  private filetreeService: FileTreeService;

  @Autowired(IWorkspaceService)
  private workspaceService: IWorkspaceService;

  @Autowired(IDecorationsService)
  private decorationsService: IDecorationsService;

  @Autowired(IMainLayoutService)
  protected readonly mainlayoutService: IMainLayoutService;

  @Autowired(INJECTOR_TOKEN)
  injector: Injector;

  onDidStart() {
    const symlinkDecorationsProvider = this.injector.get(SymlinkDecorationsProvider, [this.explorerResourceService]);
    this.decorationsService.registerDecorationsProvider(symlinkDecorationsProvider);
  }

  registerCommands(commands: CommandRegistry) {
    commands.registerCommand(EXPLORER_COMMANDS.LOCATION, {
      execute: (uri?: URI) => {
        const handler = this.mainlayoutService.getTabbarHandler(ExplorerContainerId);
        if (!handler || !handler.isVisible) {
          return ;
        }
        let locationUri = uri;

        if (!locationUri) {
          locationUri = this.filetreeService.getSelectedFileItem()[0];
        }
        if (locationUri) {
          this.explorerResourceService.location(locationUri);
        }
      },
    });
    commands.registerCommand(FILE_COMMANDS.COLLAPSE_ALL, {
      execute: (uri?: URI) => {
        const handler = this.mainlayoutService.getTabbarHandler(ExplorerContainerId);
        if (!handler || !handler.isVisible) {
          return ;
        }
        if (!uri) {
          uri = this.filetreeService.root;
        }
        this.filetreeService.collapseAll(uri);
      },
    });
    commands.registerCommand(FILE_COMMANDS.REFRESH_ALL, {
      execute: async () => {
        const handler = this.mainlayoutService.getTabbarHandler(ExplorerContainerId);
        if (!handler || !handler.isVisible) {
          return ;
        }
        await this.filetreeService.refresh(this.filetreeService.root);
      },
    });
    commands.registerCommand(FILE_COMMANDS.DELETE_FILE, {
      execute: (data: FileUri) => {
        if (data) {
          const { uris } = data;
          if (uris && uris.length) {
            this.filetreeService.deleteFiles(uris);
          }
        }
      },
      isVisible: () => {
        return this.filetreeService.focusedFiles.length > 0;
      },
    });
    commands.registerCommand(FILE_COMMANDS.RENAME_FILE, {
      execute: (data: FileUri) => {
        // 默认使用uris中下标为0的uri作为创建基础
        if (data) {
          const { uris } = data;
          if (uris && uris.length) {
            this.filetreeService.renameTempFile(uris[0]);
          }
        }
      },
      isVisible: () => {
        return this.filetreeService.focusedFiles.length > 0;
      },
    });
    commands.registerCommand(FILE_COMMANDS.NEW_FILE, {
      execute: async (data?: FileUri) => {
        // 默认获取焦点元素
        const selectedFile = this.filetreeService.getFocuesedFileItem();
        let fromUri: URI;
        // 只处理单选情况下的创建
        if (selectedFile.length === 1) {
          fromUri = selectedFile[0];
        } else {
          if (data) {
            const { uris } = data;
            fromUri = uris[0];
          } else {
            fromUri = this.filetreeService.root;
          }
        }
        const tempFileUri = await this.filetreeService.createTempFile(fromUri.toString());
        if (tempFileUri) {
          await this.explorerResourceService.location(tempFileUri);
        }

      },
    });
    commands.registerCommand(FILE_COMMANDS.NEW_FOLDER, {
      execute: async (data?: FileUri) => {
        const selectedFile = this.filetreeService.getFocuesedFileItem();
        let fromUri: URI;
        // 只处理单选情况下的创建
        if (selectedFile.length === 1) {
          fromUri = selectedFile[0];
        } else {
          if (data) {
            const { uris } = data;
            fromUri = uris[0];
          } else {
            fromUri = this.filetreeService.root;
          }
        }
        const tempFileUri = await this.filetreeService.createTempFolder(fromUri.toString());
        if (tempFileUri) {
          await this.explorerResourceService.location(tempFileUri);
        }
      },
    });
    commands.registerCommand(FILE_COMMANDS.COMPARE_SELECTED, {
      execute: (data: FileUri) => {
        if (data) {
          const { uris } = data;
          if (uris && uris.length) {
            if (uris.length < 2) {
              return;
            }
            this.filetreeService.compare(uris[0], uris[1]);
          }
        }
      },
      isVisible: () => {
        return this.filetreeService.focusedFiles.length === 2;
      },
    });
    commands.registerCommand(FILE_COMMANDS.OPEN_RESOURCES, {
      execute: (data: FileUri) => {
        if (data) {
          const { uris } = data;
          this.filetreeService.openAndFixedFile(uris[0]);
        }
      },
      isVisible: () => {
        return this.filetreeService.focusedFiles.length === 1 && !this.filetreeService.focusedFiles[0].filestat.isDirectory;
      },
    });
  }

  registerKeybindings(bindings: KeybindingRegistry) {
    bindings.registerKeybinding({
      command: EXPLORER_COMMANDS.LOCATION.id,
      keybinding: 'cmd+shift+e',
    });
  }

  registerComponent(registry: ComponentRegistry) {
    const workspace = this.workspaceService.workspace;
    let resourceTitle = 'UNDEFINE';
    if (workspace) {
      const uri = new URI(workspace.uri);
      resourceTitle = uri.displayName;
      if (!workspace.isDirectory &&
        (resourceTitle.endsWith(`.${KAITIAN_MUTI_WORKSPACE_EXT}`))) {
        resourceTitle = resourceTitle.slice(0, resourceTitle.lastIndexOf('.'));
      }
    }
    registry.register('@ali/ide-explorer', [
      {
        component: ExplorerOpenEditorPanel,
        id: 'open-editor-explorer',
        name: 'OPEN EDITORS',
        weight: 1,
        collapsed: true,
      },
      {
        component: ExplorerResourcePanel,
        id: ExplorerResourceViewId,
        name: resourceTitle,
        weight: 3,
      },
    ], {
      iconClass: 'volans_icon code_editor',
      title: localize('explorer.title'),
      weight: 10,
      containerId: ExplorerContainerId,
      activateKeyBinding: 'shift+ctrlcmd+e',
    });
  }

  registerToolbarItems(registry: TabBarToolbarRegistry) {
    registry.registerItem({
      id: FILE_COMMANDS.COLLAPSE_ALL.id,
      command: FILE_COMMANDS.COLLAPSE_ALL.id,
      viewId: ExplorerResourceViewId,
    });
    registry.registerItem({
      id: FILE_COMMANDS.REFRESH_ALL.id,
      command: FILE_COMMANDS.REFRESH_ALL.id,
      viewId: ExplorerResourceViewId,
    });
    registry.registerItem({
      id: FILE_COMMANDS.NEW_FOLDER.id,
      command: FILE_COMMANDS.NEW_FOLDER.id,
      viewId: ExplorerResourceViewId,
    });
    registry.registerItem({
      id: FILE_COMMANDS.NEW_FILE.id,
      command: FILE_COMMANDS.NEW_FILE.id,
      viewId: ExplorerResourceViewId,
    });
  }
}
