package runtime

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/dop251/goja"
	"github.com/dop251/goja_nodejs/require"
)

//go:embed model.js
var bootstrapCode string

type Runtime struct {
	vm                                  *goja.Runtime
	requireModule                       *require.RequireModule
	modules                             map[string]goja.Value
	finalize_resource_types_in_module   goja.Callable
	initialize_resource_types_in_module goja.Callable
	visit_resource_types_in_module      goja.Callable
	get_v1_permissions                  goja.Callable
}

func NewRuntime(schemaPath string) *Runtime {
	registry := require.NewRegistry(
		require.WithPathResolver(func(base, path string) string {
			return path
		}),
		require.WithLoader(func(path string) ([]byte, error) {
			return os.ReadFile(filepath.Join(schemaPath, path) + ".js")
		}),
	)

	runtime := &Runtime{
		vm:      goja.New(),
		modules: make(map[string]goja.Value),
	}

	runtime.requireModule = registry.Enable(runtime.vm)
	return runtime
}

func (r *Runtime) Initialize() error {
	_, err := r.vm.RunString(bootstrapCode)
	if err != nil {
		return err
	}

	r.finalize_resource_types_in_module, err = r.getFunction("finalize_resource_types_in_module")
	if err != nil {
		return err
	}

	r.initialize_resource_types_in_module, err = r.getFunction("initialize_resource_types_in_module")
	if err != nil {
		return err
	}

	r.visit_resource_types_in_module, err = r.getFunction("visit_resource_types_in_module")
	if err != nil {
		return err
	}

	r.get_v1_permissions, err = r.getFunction("get_v1_permissions")
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

func (r *Runtime) LoadModulesFromDirectory(path string) error {
	files, err := os.ReadDir(path)
	if err != nil {
		return err
	}
	for _, file := range files {
		if file.IsDir() {
			err = r.LoadModulesFromDirectory(filepath.Join(path, file.Name()))
			if err != nil {
				return err
			}
		} else {
			moduleName := file.Name()[:len(file.Name())-len(filepath.Ext(file.Name()))]
			err = r.LoadModule(moduleName)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func (r *Runtime) LoadModule(name string) error {
	path := "./" + name
	exports, err := r.requireModule.Require(path)
	if err != nil {
		return err
	}

	r.modules[name] = exports

	return nil
}

func (r *Runtime) initializeTypes() error {
	for name, exports := range r.modules {
		_, err := r.initialize_resource_types_in_module(goja.Undefined(), r.vm.ToValue(name), exports)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *Runtime) finalizeTypes() error {
	for name, exports := range r.modules {
		_, err := r.finalize_resource_types_in_module(goja.Undefined(), r.vm.ToValue(name), exports)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *Runtime) visitTypes(visitor any) error {
	for _, exports := range r.modules {
		_, err := r.visit_resource_types_in_module(goja.Undefined(), exports, r.vm.ToValue(visitor))
		if err != nil {
			return err
		}
	}

	return nil
}

func (r *Runtime) PrintTypes() error {
	err := r.initializeTypes()
	if err != nil {
		return fmt.Errorf("error in initializing process: %w", err)
	}

	err = r.finalizeTypes()
	if err != nil {
		return fmt.Errorf("error in finalizing process: %w", err)
	}

	spiceDbVisitor := NewSpiceDBSchemaGeneratingVisitor()
	err = r.visitTypes(spiceDbVisitor)
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
	err = r.visitTypes(jsonSchemaVisitor)
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

	permsValue, err := r.get_v1_permissions(goja.Undefined())
	if err != nil {
		return fmt.Errorf("error getting V1 permissions: %w", err)
	}

	if permsMap, ok := permsValue.Export().(map[string]interface{}); ok {
		for appName, appPerms := range permsMap {
			data, err := json.MarshalIndent(appPerms, "", "    ")
			if err != nil {
				return err
			}
			fmt.Printf("\nV1 Permissions for %s:\n", appName)
			fmt.Println(string(data))
		}
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
