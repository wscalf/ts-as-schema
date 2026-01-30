package main

import (
	"fmt"
	"os"

	"example.com/runtime"
)

func main() {
	schema_js_path := os.Getenv("SCHEMA_JS")
	r := runtime.NewRuntime()
	err := r.Initialize()
	if err != nil {
		fmt.Println("Error initializing runtime:", err)
		return
	}
	err = r.LoadFile(schema_js_path)
	if err != nil {
		fmt.Println("Error loading schema:", err)
		return
	}

	err = r.PrintTypes()
	if err != nil {
		fmt.Println("Error printing types:", err)
		return
	}
}
