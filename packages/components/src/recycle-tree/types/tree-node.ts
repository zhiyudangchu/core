export interface ITreeNode {
  /**
   * 唯一标识id
   */
  readonly id: number;
  /**
   * 节点深度
   */
  readonly depth: number;
  /**
   * 节点类型
   */
  readonly type: TreeNodeType;
  /**
   * 节点名称
   */
  readonly name: string;
  /**
   * 节点路径，这里的路径不一定指的是文件路径
   * 一般为${parent.name}/${this.name}拼接而成的绝对路径
   */
  readonly path: string;
  /**
   * 自定义节点icon
   */
  readonly icon?: string;
  /**
   * 节点描述
   */
  readonly description?: string;
  /**
   * 描述节点是否可见，这里的可见表示的是否在展示数据内，并不是代表是否在用户视窗范围内
   */
  readonly visible?: boolean;
  /**
   * 父节点，但为undefined时，表示该节点为根节点
   */
  readonly parent: ICompositeTreeNode | undefined;
  /**
   * 移动函数
   */
  mv: (to: ICompositeTreeNode | null, name?: string) => void;
}

export interface ICompositeTreeNode extends ITreeNode {
  expanded: boolean;
  /**
   * 子节点
   */
  children: ReadonlyArray<ITreeNodeOrCompositeTreeNode> | null;
}

export type ITreeNodeOrCompositeTreeNode = ITreeNode | ICompositeTreeNode;

export enum TreeNodeType {
  TreeNode = 1,
  CompositeTreeNode,
  NewPrompt,
  RenamePrompt,
}

export interface IOptionalMetaData {
  name?: string;
  description?: string;
  [key: string]: any;
}

export type TopDownIteratorCallback =
/**
 * @param node 当前节点
 * @param stepOver 同级的下一个节点
 * @param stepIn 如果当前为可折叠节点，则进入节点，当前的节点变为该节点的第一个子节点
 * @param stepOut 跳出到父节点
 * @param exit 退出当前迭代
 */
(node: ITreeNodeOrCompositeTreeNode, stepOver: () => void, stepIn: () => void, stepOut: () => void, exit: () => void) => void;
