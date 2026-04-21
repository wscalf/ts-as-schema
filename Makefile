build-schema:
	npx tsc --project schema/tsconfig.json

build-model:
	npx tsc --project src/tsconfig.json
	cp build/js/model.js src/runtime/model.js

build-interpreter: build-model
	cd src && \
	go build -o ../build/interpreter main.go

build: build-interpreter build-schema

run: build
	SCHEMA_JS=build/js/schema ./build/interpreter

.PHONY: build-schema build-model build-interpreter build run
