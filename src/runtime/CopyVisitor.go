package runtime

import "fmt"

type CopyVisitor struct {
	schema *Schema
}

func NewCopyVisitor() *CopyVisitor {
	return &CopyVisitor{
		schema: &Schema{
			Types: []*Type{},
		},
	}
}

func (v *CopyVisitor) VisitAnd(left any, right any) any {
	fmt.Println("Visit And")
	return &Operator{
		Kind:  "and",
		Left:  left,
		Right: right,
	}
}

func (v *CopyVisitor) VisitOr(left any, right any) any {
	fmt.Println("Visit Or")
	return &Operator{
		Kind:  "or",
		Left:  left,
		Right: right,
	}
}

func (v *CopyVisitor) VisitUnless(left any, right any) any {
	fmt.Println("Visit Unless")
	return &Operator{
		Kind:  "unless",
		Left:  left,
		Right: right,
	}
}

func (v *CopyVisitor) VisitRelationExpression(name string) any {
	fmt.Println("Visit Relation Ref")
	return &Ref{Name: name}
}

func (v *CopyVisitor) VisitSubRelationExpression(name string, sub string) any {
	fmt.Printf("Visit Relation %s SubRef %s\n", name, sub)
	return &Ref{Name: name, Sub: sub}
}

func (v *CopyVisitor) VisitAssignableExpression(typeName string, cardinality string) any {
	fmt.Println("Visit Assignable")
	return &Assignable{Type: typeName, Cardinality: cardinality}
}

// Construct relation expression
func (v *CopyVisitor) VisitRelation(name string, body any) any {
	fmt.Println("Visit Relation")
	return &Relation{Name: name, Body: body}
}

// Construct type expression
func (v *CopyVisitor) VisitType(name string, relations []*Relation) any {
	fmt.Println("Visit Type")
	t := &Type{Name: name, Relations: relations}

	v.schema.Types = append(v.schema.Types, t)
	return t
}

type Operator struct {
	Kind  string `json:"kind"`
	Left  any    `json:"left"`
	Right any    `json:"right"`
}

type Ref struct {
	Name string `json:"name"`
	Sub  string `json:"sub,omitempty"`
}

type Assignable struct {
	Type        string `json:"type"`
	Cardinality string `json:"cardinality"`
}

type Relation struct {
	Name string `json:"name"`
	Body any    `json:"body"`
}

type Type struct {
	Name      string      `json:"name"`
	Relations []*Relation `json:"relations"`
}

type Schema struct {
	Types []*Type `json:"types"`
}
