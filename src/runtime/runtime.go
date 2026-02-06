package runtime

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/dop251/goja"
)

//go:embed model.js
var bootstrapCode string

type Runtime struct {
	vm                          *goja.Runtime
	finalize_all_resource_types goja.Callable
	visit_all_resource_types    goja.Callable
}

func NewRuntime() *Runtime {
	return &Runtime{
		vm: goja.New(),
	}
}

func (r *Runtime) Initialize() error {
	_, err := r.vm.RunString(bootstrapCode)
	if err != nil {
		return err
	}

	r.finalize_all_resource_types, err = r.getFunction("finalize_all_resource_types")
	if err != nil {
		return err
	}

	r.visit_all_resource_types, err = r.getFunction("visit_all_resource_types")
	if err != nil {
		return err
	}

	r.vm.Set("log", func(call goja.FunctionCall) goja.Value {
		parts := make([]string, 0, len(call.Arguments))
		for _, a := range call.Arguments {
			// Goja's String() is reasonable for debugging.
			parts = append(parts, a.String())
		}
		fmt.Fprintln(os.Stdout, strings.Join(parts, " "))
		return goja.Undefined()
	})

	return nil
}

func (r *Runtime) getFunction(name string) (goja.Callable, error) {
	v := r.vm.Get(name)
	if goja.IsUndefined(v) {
		return nil, fmt.Errorf("%s not found in the global namespace.", name)
	}
	if method, ok := goja.AssertFunction(v); ok {
		return method, nil
	} else {
		return nil, fmt.Errorf("%s is not a function", name)
	}
}

func (r *Runtime) call(this *goja.Object, name string, args ...goja.Value) (goja.Value, error) {
	if fn, ok := goja.AssertFunction(this.Get(name)); ok {
		return fn(this, args...)
	} else {
		return nil, fmt.Errorf("object contains no method %s", name)
	}
}

func (r *Runtime) LoadFile(path string) error {
	content, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	_, err = r.vm.RunString(string(content))
	return err
}

func (r *Runtime) PrintTypes() error {
	_, err := r.finalize_all_resource_types(goja.Undefined())
	if err != nil {
		return fmt.Errorf("error in finalizing process: %w", err)
	}

	//spiceDbVisitor := NewCopyVisitor()
	spiceDbVisitor := NewSpiceDBSchemaGeneratingVisitor()
	_, err = r.visit_all_resource_types(goja.Undefined(), r.vm.ToValue(spiceDbVisitor))
	if err != nil {
		return fmt.Errorf("error in schema evaluation process: %w", err)
	}

	//output, err := json.MarshalIndent(visitor.schema, "  ", "    ")
	output, err := spiceDbVisitor.Generate()
	if err != nil {
		return err
	}

	fmt.Println("SpiceDB Schema:")
	fmt.Println(output)

	jsonSchemaVisitor := NewJSONSchemaVisitor()
	_, err = r.visit_all_resource_types(goja.Undefined(), r.vm.ToValue(jsonSchemaVisitor))
	if err != nil {
		return fmt.Errorf("error in second schema evaluation (for JSONSchema): %w", err)
	}

	for key, schema := range jsonSchemaVisitor.schemas {
		data, err := json.MarshalIndent(schema, "", "  ")
		if err != nil {
			return err
		}

		fmt.Println(key, ":")
		fmt.Println(string(data))
	}

	return nil
}

func (r *Runtime) getInstance(typeName string) (*goja.Object, error) {
	if get_or_create_singleton, ok := goja.AssertFunction(r.vm.GlobalObject().Get("get_or_create_singleton")); ok {
		_ = get_or_create_singleton
		t := r.vm.GlobalObject().Get(typeName)
		if _, ok := goja.AssertConstructor(t); ok {
			v, err := get_or_create_singleton(goja.Undefined(), t) //This produces an empty object
			if err != nil {
				return nil, err
			}

			obj := v.ToObject(r.vm)

			return obj, nil
		} else {
			return nil, fmt.Errorf("Type %s is not a constructor.", typeName)
		}
	} else {
		return nil, fmt.Errorf("%s method not found in global namespace", "get_or_create_singleton")
	}
}
