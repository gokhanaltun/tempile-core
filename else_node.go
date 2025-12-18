package tempilecore

type ElseNode struct {
	Childs []Node
	Pos    Pos
}

func (n *ElseNode) Type() NodeType {
	return NodeElse
}

func (n *ElseNode) GetChilds() *[]Node {
	return &n.Childs
}
