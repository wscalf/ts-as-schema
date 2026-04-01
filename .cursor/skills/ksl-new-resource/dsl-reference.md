# KSL DSL Reference

## Relation Body Combinators

| Function | SpiceDB Equivalent | Description |
|----------|-------------------|-------------|
| `assignable(cardinality, TargetType, dataType)` | `relation t_name: ns/type` | Directly assignable relation; appears in JSON Schema |
| `or(left, right)` | `+` (union) | Either left or right grants access |
| `and(left, right)` | `&` (intersection) | Both left and right must grant access |
| `unless(left, right)` | `-` (exclusion) | Left grants access unless right denies |
| `relation.sub(r => r.field)` | `->` (arrow) | Follow relation then check sub-relation |

A `Relation` used directly in a body acts as a computed userset (reference to another relation on the same type).

## Data Types

```typescript
uuid()                              // JSON Schema: { "type": "string", "format": "uuid" }
text({maxLength?, minLength?, regex?}) // JSON Schema: { "type": "string", ... }
numeric_id({min?, max?})            // JSON Schema: numeric with range
dataType.or(otherType)              // JSON Schema: { "oneOf": [...] }
all(ResourceType)                   // SpiceDB wildcard pattern: ns/name:\*
```

## Cardinality

| Value | JSON Schema Effect | SpiceDB Effect |
|-------|-------------------|----------------|
| `AtMostOne` | Single value, optional | Normal `AllowedRelation` |
| `ExactlyOne` | Single value, required | Normal `AllowedRelation` |
| `AtLeastOne` | Array with `minItems: 1` | Normal `AllowedRelation` |
| `Any` | Array, optional | Normal `AllowedRelation` |
| `All` | Wildcard pattern string | Public namespace wildcard (`type:*`) |

## Field

```typescript
new Field(required: boolean, dataType: DataType)
```

Fields appear in JSON Schema output only (ignored by SpiceDB visitor).

## Runtime Helpers

```typescript
get_or_create_singleton(Type)                    // Get singleton instance of a Resource subclass
get_relation(Type, name)                         // Get a named relation from a type (undefined if missing)
add_relation(Type, name, relation)               // Add a relation to a type (throws on duplicate)
get_or_add_relation(Type, name, () => relation)  // Get existing or add new (idempotent)
register_extension_invocation(() => { ... })      // Register a deferred extension callback
register_v1_permission(app, resource, verb)       // Register a V1 permission triple
resource_type_for_namespace(ns)                   // Create a @resource_type decorator for non-exported types
```
