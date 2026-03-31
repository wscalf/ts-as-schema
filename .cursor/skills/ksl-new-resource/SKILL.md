---
name: ksl-new-resource
description: >-
  Author a new KSL resource type in the schema directory. Use when adding a new
  resource, creating a new schema file, defining a new namespace with resources,
  relations, and fields, or onboarding a new service to Kessel authorization.
---

# Author a New KSL Resource Type

## Quick Reference

For DSL primitives (DataType, Cardinality, relation combinators, runtime helpers), see [dsl-reference.md](dsl-reference.md).

## When to Create a New File vs Add to Existing

- **New file** when the resource belongs to a new application/service namespace (e.g., `compliance`, `patch`).
- **Add to existing** when the resource belongs to a namespace that already has a file (e.g., adding a second resource type inside `hbi`).

Each file in `schema/` is a TypeScript namespace. One namespace per file.

## Resource Skeleton

```typescript
namespace myapp {
    export class my_resource extends Resource {
        // 1. Workspace relation (required for workspace-scoped resources)
        private workspace = new Relation<rbac.workspace>(
            () => assignable(Cardinality.ExactlyOne, rbac.workspace, uuid())
        );

        // 2. Data fields (reported in JSON Schema, not in SpiceDB)
        some_id = new Field(false, uuid());

        // 3. Permission declarations (assigned in applyExtensions)
        private myapp_resource_view!: rbac.workspace_permission;
        private myapp_resource_update!: rbac.workspace_permission;

        // 4. Computed permission relations
        view = new Relation(
            () => rbac.has_permission_on_workspace(this.workspace, this.myapp_resource_view)
        );
        update = new Relation(
            () => rbac.has_permission_on_workspace(this.workspace, this.myapp_resource_update)
        );

        // 5. Wire V1 permissions via extensions
        override applyExtensions(): void {
            this.myapp_resource_view = rbac.create_v1_based_workspace_permission(
                "myapp", "my_resources", "read", "myapp_resource_view"
            );
            this.myapp_resource_update = rbac.create_v1_based_workspace_permission(
                "myapp", "my_resources", "write", "myapp_resource_update"
            );
        }
    }
}
```

## Key Rules

1. **Namespace wrapping is mandatory.** The namespace name becomes the SpiceDB namespace prefix (e.g., `myapp/my_resource`).
2. **`extends Resource`** -- every resource type must extend `Resource`.
3. **`export`** the class if other namespaces need to reference it. Non-exported types require the `@resource_type` decorator (see `rbac.ts` for the pattern).
4. **Workspace relation** -- workspace-scoped resources need an assignable `Relation<rbac.workspace>` with `Cardinality.ExactlyOne`.
5. **Permission fields use `!:`** (definite assignment assertion) because they are assigned in `applyExtensions()`, not in the constructor.
6. **Cross-namespace calls go in `applyExtensions()`**, never in field initializers. Other namespaces may not be loaded when initializers run.
7. **Relation bodies are lazy** -- the `() => ...` factory is not evaluated until visit time, so forward references are safe inside the factory.

## Non-Exported Types

For types that should not be accessible from other namespaces (like `rbac.principal`):

```typescript
namespace myapp {
    const resource_type = resource_type_for_namespace(myapp);

    @resource_type("internal_thing")
    class internal_thing extends Resource {
        // ...
    }
}
```

This requires `experimentalDecorators` in `schema/tsconfig.json` (already enabled).

## Checklist

1. File created in `schema/` with a `namespace` wrapper
2. Class extends `Resource` and is `export`ed (or uses `@resource_type`)
3. Workspace relation defined with proper cardinality
4. Data fields added with appropriate types
5. Permission fields declared with `!:` type annotation
6. `view`/`update` (and any other) relations use `rbac.has_permission_on_workspace`
7. `applyExtensions()` calls `rbac.create_v1_based_workspace_permission` for each permission
8. Run `make run` and verify SpiceDB schema, JSON Schema, and V1 Permissions output
