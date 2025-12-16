package tempilecore

type TextNode struct {
	Data string
}

func (n *TextNode) Type() NodeType {
	return NodeText
}

func (n *TextNode) GetChilds() *[]Node {
	return nil
}
