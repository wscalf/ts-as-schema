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
	vm            *goja.Runtime
	tsGetInstance goja.Callable
}

func NewRuntime() *Runtime {
	return &Runtime{
		vm:            goja.New(),
		tsGetInstance: nil,
	}
}

func (r *Runtime) Initialize() error {
	_, err := r.vm.RunString(bootstrapCode)
	return err
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
			data, err := object.MarshalJSON()
			if err != nil {
				return err
			}
			fmt.Println(string(data))

			for _, name := range object.GetOwnPropertyNames() {
				fmt.Println("\t", name)
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
