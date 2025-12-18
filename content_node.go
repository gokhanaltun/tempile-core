package tempilecore

type ContentNode struct {
	Name   string
	Childs []Node
	Pos    Pos
}

func (n *ContentNode) Type() NodeType {
	return NodeContent
}

func (n *ContentNode) GetChilds() *[]Node {
	return &n.Childs
}
