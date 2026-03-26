TypeScript as Schema Language Prototype
=======================================

This prototype uses TypeScript as a schema DSL. The idea is that schema authors write plain TypeScript classes to define resource types, relationships, data fields, and authorization logic. A Go interpreter runs the compiled JavaScript in an embedded JS engine (goja) and projects the schema into multiple output formats via a visitor pattern.

There are two layers of TypeScript:

- **Model** (`src/model/`): Defines the type system -- `Resource`, `Relation`, `Field`, `DataType`, cardinality, relation body combinators (`and`, `or`, `unless`, `sub`), and the `SchemaVisitor` interface. This compiles to `model.js`, which is embedded into the Go binary.

- **Schema** (`schema/`): The actual domain schema written by service authors. Each namespace (rbac, hbi, remediations) is a separate `.ts` file using TypeScript `namespace` blocks. These compile to a single `schema.js` that the interpreter loads at runtime.

The Go runtime (`src/runtime/`) hosts the JS engine and implements output visitors. After loading the model and schema JS, it finalizes all types and then walks the type graph with different visitors to produce each output format.

Building and Running
--------------------

Prerequisites: Node.js, Go 1.25+

```
npm install           # Install TypeScript locally
make build            # Build everything (model, schema, interpreter)
make run              # Build + run the interpreter, prints all outputs
```

Individual build targets if needed:

- `make build-model` -- compiles `src/model/*.ts` to `build/js/model.js` and copies it into `src/runtime/` for Go embedding
- `make build-schema` -- compiles `schema/*.ts` to `build/js/schema.js`
- `make build-interpreter` -- builds the Go binary (depends on `build-model`)
