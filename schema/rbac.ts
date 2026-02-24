namespace rbac /* Everything in here has a reporter type of 'rbac' */ {
    //Non-exported types (not available for other modules to reference but still used by rbac)
    //These must be annotated explicitly so the interpreter can find them
    const resource_type = resource_type_for_namespace(rbac); //Creates a local decorator for marking non-exported types as part of this namespace (always pass the current namespace object)
    @resource_type("principal") //This decorator then just needs the type name - it's this name that will be the resource type for reporting/checking purposes (the actual type name may be changed by the compiler)
    class principal extends Resource {}

    @resource_type("role")
    class role extends Resource {
        any_any_any = new Relation<principal>(() => assignable(Cardinality.All, principal, all(principal))); //Equivalent of 'bool' in KSL but more explicit - this relation can be assigned all principals (principal:*) or none when reporting 
    }

    @resource_type("role_binding")
    class role_binding extends Resource {
        granted = new Relation<role>(() => assignable(Cardinality.Any, role, uuid()));
        subject = new Relation<principal>(() => assignable(Cardinality.Any, principal, uuid()));
    }

    //Exported types don't need to be explicitly marked
    export class workspace extends Resource { 
        parent: Relation<workspace> = new Relation<workspace>(() => assignable(Cardinality.ExactlyOne, workspace, uuid()));
        binding: Relation<role_binding> = new Relation<role_binding>(() => assignable(Cardinality.Any, role_binding, uuid()));
    }

    // Syntactic sugar for handling permissions on workspaces - this is meant to look like an object to callers but is actually func that selects a sub-relation from a workspace relation (see usage in HBI)
    export type workspace_permission = (w: Relation<workspace>) => RelationBody<Resource>

    // Is meant to look like backend authz code- the caller provides a workspace as a relation and a permission to check, and this feels like a boolean
    // Actually, it resolves to accessing the sub-relation on the provided workspace that goes with the permission they're checking
    export function has_permission_on_workspace(workspace: Relation<workspace>, perm: workspace_permission): RelationBody<Resource> {
        return perm(workspace);
    }

    // This is the equivalent of an extension, though it's a plain old TypeScript function. It takes in the necessary arguments, updates RBAC types, 
    // and returns a workspace_permission that encapsulates how to access the created permission
    export function create_v1_based_workspace_permission(application: string, resource: string, verb: string, v2_perm: string): workspace_permission {
        // get_relation is part of the runtime and gets a relation object from the given type by name   
        if (get_relation(workspace, v2_perm) != undefined) { //The workspace permission has already been added, so we can short-circuit out. This allows this function to be idempotent.
            return (w: Relation<workspace>) => w.sub(r => (r as any)[v2_perm]);
        }
        
        // Add the V1 permission and all applicable V1 wildcards if they don't exist to the role
        const app_admin = _get_or_add_v1_role_permission(`${application}_any_any`);
        const any_verb = _get_or_add_v1_role_permission(`${application}_${resource}_any`);
        const any_resource = _get_or_add_v1_role_permission(`${application}_any_${verb}`);
        const v1_perm = _get_or_add_v1_role_permission(`${application}_${resource}_${verb}`);
        const global_admin = get_relation(role, "any_any_any");

        // Create the V2 permission to the role as the union of all applicable V1 permissions
        const role_v2_perm = new Relation<Resource>(() => or(global_admin, or(app_admin, or(any_verb, or(any_resource, v1_perm)))));
        //add_relation is part of the runtime and adds a relation to the given type with a name
        add_relation(role, v2_perm, role_v2_perm);

        //get_or_create_singleton unwraps the singleton object that goes with a given type. Used here because we need to reference several relations from role_binding, 
        // but get_relation would also be valid, just more verbose / less readable
        let role_binding_obj = get_or_create_singleton(role_binding);
        // Create and add the permission for the rolebinding that looks like: subject and granted.`v2_perm` in KSL
        const role_binding_v2_perm = new Relation(() => and(role_binding_obj.subject, role_binding_obj.granted.sub(_ => get_relation(role, v2_perm))));
        add_relation(role_binding, v2_perm, role_binding_v2_perm);

        //Same as above, unwraps the workspace singleton object so we can reference relations from it more easily. get_relation is also valid.
        // Though note: we end up using get_relation anyway when referencing dynamically created relations. The type system does not recognize these.
        let workspace_obj = get_or_create_singleton(workspace);
        // Create and add the permission on the workspace. Equivalent to `v2_perm`: binding.`v2_perm` or parent.`v2_perm` in KSL
        const workspace_v2_perm = new Relation(() => or(workspace_obj.binding.sub(r => get_relation(role_binding, v2_perm)), workspace_obj.parent.sub(r => get_relation(workspace, v2_perm))));
        add_relation(workspace, v2_perm, workspace_v2_perm);

        return (w: Relation<workspace>) => w.sub(r => get_relation(workspace, v2_perm)); //Finally, this is what really goes in the permission object - an accessor that finds the v2_perm relation on the workspace
    }

    // Wraps the pattern of adding an assignable, boolean-like relation to the role type
    function _get_or_add_v1_role_permission(name: string): Relation<principal> {
        // get_or_add_relation is part of the runtime and gets a relation from the type it exists or adds it. This is equivalent to the ALLOW_DUPLICATES directive in KSL
        return get_or_add_relation(role, name, () => new Relation<principal>(() => assignable(Cardinality.All, principal, all(principal))));
    }
}
