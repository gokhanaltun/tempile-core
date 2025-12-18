package tempilecore

type RawCodeNode struct {
	Lang string
	Code string
	Pos  Pos
}

func (n *RawCodeNode) Type() NodeType {
	return NodeRawCode
}

func (n *RawCodeNode) GetChilds() *[]Node {
	return nil
}
