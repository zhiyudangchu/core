import { Injectable } from '@opensumi/di';
import { AINativeSettingSectionsId, ECodeEditsSourceTyping, IDisposable } from '@opensumi/ide-core-common';
import { IModelContentChangedEvent, Position } from '@opensumi/ide-monaco';

import { BaseCodeEditsSource } from './base';

@Injectable({ multiple: true })
export class TypingCodeEditsSource extends BaseCodeEditsSource {
  public priority = 0;

  public mount(): IDisposable {
    this.addDispose(
      this.monacoEditor.onDidChangeModelContent((event: IModelContentChangedEvent) => {
        const position = this.monacoEditor.getPosition();
        if (position) {
          this.doTrigger(position, event);
        }
      }),
    );
    return this;
  }

  protected async doTrigger(position: Position, data: IModelContentChangedEvent) {
    const isTypingEnabled = this.preferenceService.getValid(AINativeSettingSectionsId.CodeEditsTyping, false);

    if (!isTypingEnabled || !this.model) {
      return;
    }

    this.setBean({
      typing: ECodeEditsSourceTyping.Typing,
      position,
      data,
    });
  }
}