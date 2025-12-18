package tempilecore

type ElseIfNode struct {
	Conds  []*Attribute
	Childs []Node
	Pos    Pos
}

func (n *ElseIfNode) Type() NodeType {
	return NodeElseIf
}

func (n *ElseIfNode) GetChilds() *[]Node {
	return &n.Childs
}
