package tempilecore

type DocumentTypeNode struct {
	Data string
	Pos  Pos
}

func (n *DocumentTypeNode) Type() NodeType {
	return NodeDocumentType
}

func (n *DocumentTypeNode) GetChilds() *[]Node {
	return nil
}
