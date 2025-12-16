package tempilecore

type SlotNode struct {
	Name   string
	Childs []Node
}

func (n *SlotNode) Type() NodeType {
	return NodeSlot
}

func (n *SlotNode) GetChilds() *[]Node {
	return &n.Childs
}
