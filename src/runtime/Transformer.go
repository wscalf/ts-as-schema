package runtime

import (
	"encoding/json"
	"fmt"
)

type Transformer struct {
	config map[string]map[string][]RelationTransformer
}

func NewTransformer() *Transformer {
	return &Transformer{
		config: map[string]map[string][]RelationTransformer{},
	}
}

func (t *Transformer) AddTransformer(namespace, name string, transformer RelationTransformer) {
	if _, ok := t.config[namespace]; !ok {
		t.config[namespace] = map[string][]RelationTransformer{}
	}
	if _, ok := t.config[namespace][name]; !ok {
		t.config[namespace][name] = []RelationTransformer{}
	}

	t.config[namespace][name] = append(t.config[namespace][name], transformer)
}

func (t *Transformer) Transform(namespace, name, instance_id string, rawData []byte) []string {
	output := []string{}
	data := map[string]any{}
	json.Unmarshal(rawData, &data)

	for _, transformer := range t.config[namespace][name] {
		output = append(output, transformer.Transform(instance_id, data)...)
	}

	return output
}

type RelationTransformer interface {
	Transform(instance_id string, data map[string]any) []string
}

type RelationData struct {
	resourceNamespace string
	resourceType      string
	relationName      string
	objectNamespace   string
	objectType        string
}

type AssignableTransformer struct {
	RelationData
}

func NewAssignableTransformer(resourceNamespace, resourceType, relationName, objectNamespace, objectType string) *AssignableTransformer {
	return &AssignableTransformer{
		RelationData: RelationData{
			resourceNamespace: resourceNamespace,
			resourceType:      resourceType,
			relationName:      relationName,
			objectNamespace:   objectNamespace,
			objectType:        objectType,
		},
	}
}

func (t *AssignableTransformer) Transform(instance_id string, data map[string]any) []string {
	raw, ok := data[t.relationName]
	if !ok {
		return nil
	}

	switch v := raw.(type) {
	case []any:
		out := make([]string, 0, len(v))
		for _, elem := range v {
			out = append(out, t.transformValue(instance_id, elem))
		}
		return out
	default:
		return []string{t.transformValue(instance_id, raw)}
	}
}

func (t *RelationData) transformValue(instance_id string, value any) string {
	return fmt.Sprintf("%s/%s:%s#%s@%s/%s:%s", t.resourceNamespace, t.resourceType, instance_id, t.relationName, t.objectNamespace, t.objectType, value)
}

type BooleanDynamicTransformer struct {
	RelationData
	expression string
}

func NewBooleanDynamicTransformer(resourceNamespace, resourceType, relationName, objectNamespace, objectType, expression string) *BooleanDynamicTransformer {
	return &BooleanDynamicTransformer{
		RelationData: RelationData{
			resourceNamespace: resourceNamespace,
			resourceType:      resourceType,
			relationName:      relationName,
			objectNamespace:   objectNamespace,
			objectType:        objectType,
		},
		expression: expression,
	}
}
