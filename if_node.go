package tempilecore

type IfNode struct {
	Conds       []*Attribute
	Then        []Node
	ElseIfNodes []*ElseIfNode
	Else        *ElseNode
	Pos         Pos
}

func (n *IfNode) Type() NodeType {
	return NodeIf
}

func (n *IfNode) GetChilds() *[]Node {
	return &n.Then
}
