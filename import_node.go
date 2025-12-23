package tempilecore

type ImportNode struct {
	Data string
	Pos  Pos
}

func (n *ImportNode) Type() NodeType {
	return NodeImport
}

func (n *ImportNode) GetChilds() *[]Node {
	return nil
}
