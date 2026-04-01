---
name: ksl-register-v1-permissions
description: >-
  Register V1 RBAC permissions for a new application namespace. Use when
  onboarding a new application to Kessel authorization, adding V1 permission
  mappings, wiring legacy RBAC app/resource/verb triples, or calling
  create_v1_based_workspace_permission.
---

# Register V1 Permissions

## The App/Resource/Verb Triple

V1 RBAC permissions are identified by three strings:

| Argument | Meaning | Example |
|----------|---------|---------|
| `application` | The application namespace | `"inventory"`, `"remediations"` |
| `resource` | The resource type within the app | `"hosts"`, `"remediations"` |
| `verb` | The action | `"read"`, `"write"` |

The fourth argument, `v2_perm`, is the V2 relation name that will be created on `role`, `role_binding`, and `workspace` (e.g., `"inventory_host_view"`).

## What `create_v1_based_workspace_permission` Does

Calling `rbac.create_v1_based_workspace_permission(app, resource, verb, v2_perm)`:

1. Registers the V1 triple in the V1 permissions output
2. Auto-registers wildcard entries (`*:read`, `*:*`, `resource:*`)
3. Creates/reuses boolean-like relations on `role` for the permission and all applicable wildcards
4. Creates a `v2_perm` permission on `role` as the union of: `any_any_any + {app}_any_any + {app}_{resource}_any + {app}_any_{verb} + {app}_{resource}_{verb}`
5. Creates a `v2_perm` permission on `role_binding`: `subject & granted->{v2_perm}`
6. Creates a `v2_perm` permission on `workspace`: `binding->{v2_perm} + parent->{v2_perm}`
7. If `verb` is `"read"`, auto-wires the permission into `workspace.view_metadata`
8. Returns a `workspace_permission` accessor for use in resource relations

**Idempotent:** Calling with the same `v2_perm` twice is safe; it short-circuits on the second call.

## Two Patterns

### Pattern 1: Standalone (no resource type)

Use when the application only needs V1 permission registration without defining a resource type. The permissions still get wired into `role`, `role_binding`, and `workspace`.

```typescript
namespace remediations {
    register_extension_invocation(() => {
        rbac.create_v1_based_workspace_permission(
            "remediations", "remediations", "read", "remediations_remediation_view"
        );
        rbac.create_v1_based_workspace_permission(
            "remediations", "remediations", "write", "remediations_remediation_update"
        );
    });
}
```

### Pattern 2: Attached to a Resource

Use when the application defines a resource type that needs workspace-scoped permissions. The `workspace_permission` return value is stored and used in computed relations.

```typescript
namespace hbi {
    export class host extends Resource {
        private workspace = new Relation<rbac.workspace>(
            () => assignable(Cardinality.ExactlyOne, rbac.workspace, uuid())
        );

        private inventory_host_view!: rbac.workspace_permission;
        private inventory_host_update!: rbac.workspace_permission;

        view = new Relation(
            () => rbac.has_permission_on_workspace(this.workspace, this.inventory_host_view)
        );
        update = new Relation(
            () => rbac.has_permission_on_workspace(this.workspace, this.inventory_host_update)
        );

        override applyExtensions(): void {
            this.inventory_host_view = rbac.create_v1_based_workspace_permission(
                "inventory", "hosts", "read", "inventory_host_view"
            );
            this.inventory_host_update = rbac.create_v1_based_workspace_permission(
                "inventory", "hosts", "write", "inventory_host_update"
            );
        }
    }
}
```

### When to Use Which

- **Standalone** (`register_extension_invocation`): The app has no resource types in this schema but needs V1 permissions registered and wired into RBAC.
- **Resource-attached** (`applyExtensions`): The app defines resource types that use the permissions in their own `view`/`update` relations.

## Naming Convention for `v2_perm`

Follow the pattern `{app}_{resource_singular}_{action}`:
- `inventory_host_view` (not `inventory_hosts_read`)
- `remediations_remediation_update` (not `remediations_remediations_write`)

The `v2_perm` name appears in SpiceDB schema on `role`, `role_binding`, and `workspace`.

## Verification

After adding permissions, run `make run` and check:

1. **V1 Permissions JSON** -- the app should appear with correct resource/verb entries
2. **SpiceDB schema** -- `role` should have new `t_` relations and the `v2_perm` permission; `role_binding` and `workspace` should have matching permissions
3. If `verb` is `"read"`, confirm the permission appears in `workspace.view_metadata`
