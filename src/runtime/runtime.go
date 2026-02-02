package runtime

import (
	_ "embed"
	"fmt"
	"os"

	"github.com/dop251/goja"
)

//go:embed model.js
var bootstrapCode string

type Runtime struct {
	vm                          *goja.Runtime
	tsGetInstance               goja.Callable
	finalize_all_resource_types goja.Callable
}

func NewRuntime() *Runtime {
	return &Runtime{
		vm:            goja.New(),
		tsGetInstance: nil,
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
		return err
	}

	for _, name := range r.vm.GlobalObject().GetOwnPropertyNames() {
		candidate := r.vm.Get(name)
		if _, ok := goja.AssertConstructor(candidate); ok {
			if name == "__extends" { //Not sure what this is about, but suppress for now
				continue
			}
			fmt.Println(name)
			object, err := r.getInstance(name)
			if err != nil {
				fmt.Println(err)
				continue
			}
			fmt.Println("class:", object.ClassName()) // should be "Object" (or your class name), NOT "Function"

			for _, name := range object.GetOwnPropertyNames() {
				fmt.Println("\t", name) //Might make sense to switch to a visitor pattern here, inject a golang object into some code on the TS side that will walk through the object graph
			}
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
