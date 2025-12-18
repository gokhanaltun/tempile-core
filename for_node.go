package tempilecore

type ForNode struct {
	Loops  []*Attribute
	Childs []Node
	Pos    Pos
}

func (n *ForNode) Type() NodeType {
	return NodeFor
}

func (n *ForNode) GetChilds() *[]Node {
	return &n.Childs
}
