build-schema:
	tsc --project schema/tsconfig.json

build-model:
	tsc --project src/tsconfig.json
	cp build/js/model.js src/runtime/model.js

build-interpreter: build-model
	cd src && \
	go build -o ../build/interpreter main.go