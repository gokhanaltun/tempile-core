package tempilecore

type ElseNode struct {
	Childs []Node
}

func (n *ElseNode) Type() NodeType {
	return NodeElse
}

func (n *ElseNode) GetChilds() *[]Node {
	return &n.Childs
}
