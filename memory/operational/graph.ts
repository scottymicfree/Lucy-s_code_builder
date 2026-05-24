export const memoryGraph = {
  nodes: new Map(),

  add(node: any) {
    this.nodes.set(node.id, node);
  },

  link(a: string, relation: string, b: string) {
    const nodeA = this.nodes.get(a);
    if (nodeA) {
      if (!nodeA.relations) nodeA.relations = [];
      nodeA.relations.push(`${relation}:${b}`);
    }
  },

  get(id: string) {
    return this.nodes.get(id);
  },

  export() {
    return Array.from(this.nodes.values());
  }
};
