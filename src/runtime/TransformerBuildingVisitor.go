package runtime

type TransformerBuildingVisitor struct {
	transformer          *Transformer
	currentTypeNamespace string
	currentTypeName      string
	currentRelationName  string
}

func NewTransformerBuildingVisitor() *TransformerBuildingVisitor {
	return &TransformerBuildingVisitor{
		transformer: NewTransformer(),
	}
}

func (t *TransformerBuildingVisitor) VisitAnd(left any, right any) any {
	if left != nil {
		return left
	}

	return right
}

func (t *TransformerBuildingVisitor) VisitOr(left any, right any) any {
	if left != nil {
		return left
	}

	return right
}

func (t *TransformerBuildingVisitor) VisitUnless(left any, right any) any {
	if left != nil {
		return left
	}

	return right
}

func (t *TransformerBuildingVisitor) VisitRelationExpression(name string) any {
	return nil
}

func (t *TransformerBuildingVisitor) VisitSubRelationExpression(name string, sub string) any {
	return nil
}

func (t *TransformerBuildingVisitor) VisitAssignableExpression(typeNamespace string, typeName string, cardinality string, data_type any) any {
	transformer := NewAssignableTransformer(t.currentTypeNamespace, t.currentTypeName, t.currentRelationName, typeNamespace, typeName)
	t.transformer.AddTransformer(t.currentTypeNamespace, t.currentTypeName, transformer)
	return transformer
}

func (t *TransformerBuildingVisitor) VisitDynamicExpression(typeNamespace string, typeName string, cardinality string, expression string) any {
	return nil
}

func (t *TransformerBuildingVisitor) BeginRelation(name string) {
	t.currentRelationName = name
}

// Construct relation expression
func (t *TransformerBuildingVisitor) VisitRelation(name string, body RelationTransformer) any {
	return nil
}

func (t *TransformerBuildingVisitor) BeginType(namespace string, name string) {
	t.currentTypeNamespace = namespace
	t.currentTypeName = name
}

// Construct type expression
func (t *TransformerBuildingVisitor) VisitType(namespace string, name string, relations []any, data_fields []any) any {
	return nil
}

func (t *TransformerBuildingVisitor) BeginDataField(name string) {
}

func (t *TransformerBuildingVisitor) VisitDataField(name string, required bool, data_type any) any {
	return nil
}

func (t *TransformerBuildingVisitor) VisitCompositeDataType(data_types []any) any {
	return nil
}

func (t *TransformerBuildingVisitor) VisitUUIDDataType() any {
	return nil
}

func (t *TransformerBuildingVisitor) VisitNumericIDDataType(min *int, max *int) any {
	return nil
}

func (t *TransformerBuildingVisitor) VisitTextDataType(minLength *int, maxLength *int, regex *string) any {
	return nil
}
