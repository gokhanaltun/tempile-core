package tempilecore

type DocumentTypeNode struct {
	Data string
}

func (n *DocumentTypeNode) Type() NodeType {
	return NodeDocumentType
}

func (n *DocumentTypeNode) GetChilds() *[]Node {
	return nil
}
