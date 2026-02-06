package runtime

import (
	"github.com/google/jsonschema-go/jsonschema"
)

type JSONSchemaVisitor struct {
	schemas         map[string]*jsonschema.Schema
	required_fields []string
	current_element string
}

func NewJSONSchemaVisitor() *JSONSchemaVisitor {
	return &JSONSchemaVisitor{
		schemas: map[string]*jsonschema.Schema{},
	}
}

// We only care about assignable relations here - all others are readonly and irrelvant for input validation

// For logical operations, coalesce to a non-nil body or nil
func (v *JSONSchemaVisitor) VisitAnd(left any, right any) any {
	if left != nil {
		return left
	}

	return right
}

func (v *JSONSchemaVisitor) VisitOr(left any, right any) any {
	if left != nil {
		return left
	}

	return right
}

func (v *JSONSchemaVisitor) VisitUnless(left any, right any) any {
	if left != nil {
		return left
	}

	return right
}

// Relation references are nil (and coalesce out above)
func (v *JSONSchemaVisitor) VisitRelationExpression(name string) any {
	return nil
}

func (v *JSONSchemaVisitor) VisitSubRelationExpression(name string, sub string) any {
	return nil
}

// Capture details about what's assignable
func (v *JSONSchemaVisitor) VisitAssignableExpression(typeNamespace string, typeName string, cardinality string, data_type *jsonschema.Schema) *jsonschema.Schema {
	switch cardinality {
	case "AtMostOne": //Optional, individual value
		return v.handleIndividualAssignable(false, data_type)
	case "ExactlyOne": //Required, individual value
		return v.handleIndividualAssignable(true, data_type)
	case "All": //Required, individual value. Type should look like: resource_type:*
		return v.handleIndividualAssignable(false, data_type)
	case "AtLeastOne": //Required, array
		return v.handleArrayAssignable(true, data_type)
	case "Any": //Optional, array
		return v.handleArrayAssignable(false, data_type)
	default:
		panic("Cardinality not matched: " + cardinality)
	}
}

func (v *JSONSchemaVisitor) handleIndividualAssignable(required bool, data_type *jsonschema.Schema) *jsonschema.Schema {
	if required {
		v.required_fields = append(v.required_fields, v.current_element)
	}

	return data_type
}

func (v *JSONSchemaVisitor) handleArrayAssignable(required bool, data_type *jsonschema.Schema) *jsonschema.Schema {
	arr := &jsonschema.Schema{
		Type:  "array",
		Items: data_type,
	}

	if required {
		arr.MinItems = IntPtr(1)
	}

	return arr
}

func (v *JSONSchemaVisitor) BeginRelation(name string) {
	v.current_element = name
}

func (v *JSONSchemaVisitor) VisitRelation(name string, body *jsonschema.Schema) *namedSchema { //What type should the body be?
	if body == nil { //If the body coalesced to null, this relation is readonly and can be ignored
		return nil
	}

	return &namedSchema{name: name, schema: body}
}

func (v *JSONSchemaVisitor) BeginType(namespace string, name string) {
	v.required_fields = []string{}
}

// Construct type expression
func (v *JSONSchemaVisitor) VisitType(namespace string, name string, relations []*namedSchema, data_fields []*namedSchema) *namedSchema {
	schema := &jsonschema.Schema{
		Type:       "object",
		Properties: map[string]*jsonschema.Schema{},
		Required:   v.required_fields,
	}

	for _, r := range relations {
		if r == nil {
			continue //Skip relations that coalesced to nil- they're readonly
		}

		schema.Properties[r.name] = r.schema
	}

	for _, f := range data_fields {
		schema.Properties[f.name] = f.schema
	}

	v.schemas[name] = schema

	return &namedSchema{name: name, schema: schema}
}

func (v *JSONSchemaVisitor) BeginDataField(name string) {
	v.current_element = name
}

func (v *JSONSchemaVisitor) VisitDataField(name string, required bool, data_type *jsonschema.Schema) *namedSchema {
	if required {
		v.required_fields = append(v.required_fields, name)
	}

	return &namedSchema{
		name:   name,
		schema: data_type,
	}
}

func (v *JSONSchemaVisitor) VisitCompositeDataType(data_types []*jsonschema.Schema) *jsonschema.Schema {
	return &jsonschema.Schema{
		OneOf: data_types,
	}
}

func (v *JSONSchemaVisitor) VisitUUIDDataType() *jsonschema.Schema {
	return &jsonschema.Schema{
		Type:   "string",
		Format: "uuid",
	}
}

func (v *JSONSchemaVisitor) VisitNumericIDDataType(min *int, max *int) *jsonschema.Schema {
	schema := &jsonschema.Schema{Type: "integer"}

	schema.Minimum = intPtrToFloatPtr(min)
	schema.Maximum = intPtrToFloatPtr(max)

	return schema
}

func (v *JSONSchemaVisitor) VisitTextDataType(minLength *int, maxLength *int, regex *string) *jsonschema.Schema {
	schema := &jsonschema.Schema{Type: "string"}

	schema.MinLength = minLength
	schema.MaxLength = maxLength
	if regex != nil {
		schema.Pattern = *regex
	}

	return schema
}

type namedSchema struct {
	name   string
	schema *jsonschema.Schema
}

func intPtrToFloatPtr(v *int) *float64 {
	if v == nil {
		return nil
	}

	f := float64(*v)

	return &f
}

func IntPtr(v int) *int {
	return &v
}

func boolPtr(v bool) *bool {
	return &v
}
