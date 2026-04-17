package main

import (
	"fmt"
	"os"

	"example.com/runtime"
)

func main() {
	schema_js_path := os.Getenv("SCHEMA_JS")
	r := runtime.NewRuntime(schema_js_path)
	err := r.Initialize()
	if err != nil {
		fmt.Println("Error initializing runtime:", err)
		return
	}

	err = r.LoadModulesFromDirectory(schema_js_path)
	if err != nil {
		fmt.Println("Error loading modules from directory:", err)
		return
	}

	err = r.PrintTypes()
	if err != nil {
		fmt.Println("Error printing types:", err)
		return
	}
}
