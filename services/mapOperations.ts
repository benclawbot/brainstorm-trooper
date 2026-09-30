import { MapEdit, MindMapNode } from '../types';

export function applyMapEdits(root: MindMapNode, edits: MapEdit[]): MindMapNode {
  const next: MindMapNode = JSON.parse(JSON.stringify(root));
  const find = (id: string, node = next): MindMapNode | undefined =>
    node.id === id ? node : node.children.map(child => find(id, child)).find(Boolean);
  const parentOf = (id: string, node = next): MindMapNode | undefined =>
    node.children.some(child => child.id === id) ? node : node.children.map(child => parentOf(id, child)).find(Boolean);
  const contains = (node: MindMapNode, id: string): boolean => node.id === id || node.children.some(child => contains(child, id));
  for (const edit of edits) {
    if (!['add','rename','move','remove'].includes(edit.type)) throw new Error('Unsupported map edit.');
    if (edit.type === 'add') {
      const parent = find(edit.parentId || '');
      if (!parent || !edit.text?.trim()) throw new Error('A new branch needs an existing parent and a label.');
      parent.children.push({ id: crypto.randomUUID(), text: edit.text.trim(), children: [], parentId: parent.id });
      parent.isCollapsed = false;
      continue;
    }
    const node = find(edit.nodeId);
    if (!node) throw new Error('This branch no longer exists. Ask for a fresh proposal.');
    if (edit.type === 'rename') {
      if (!edit.text?.trim()) throw new Error('A branch label cannot be empty.');
      node.text = edit.text.trim();
      continue;
    }
    if (node.id === next.id) throw new Error('The root cannot be moved or removed.');
    const parent = parentOf(node.id);
    if (!parent) throw new Error('Branch parent not found.');
    if (edit.type === 'move') {
      const target = find(edit.parentId || '');
      if (!target || contains(node, target.id)) throw new Error('A branch cannot move inside itself or one of its descendants.');
      parent.children = parent.children.filter(child => child.id !== node.id);
      target.children.push(node);
      node.parentId = target.id;
      target.isCollapsed = false;
    } else parent.children = parent.children.filter(child => child.id !== node.id);
  }
  return next;
}
