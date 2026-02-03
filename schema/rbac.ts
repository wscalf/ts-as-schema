class principal extends Resource {}

class role extends Resource {
    any_any_any = new Relation<principal>(() => assignable(principal, Cardinality.All));
}

class role_binding extends Resource {
    granted = new Relation<role>(() => assignable(role, Cardinality.Any));
    subject = new Relation<principal>(() => assignable(principal, Cardinality.Any));
}


class workspace extends Resource {
    parent: Relation<workspace> = new Relation<workspace>(() => assignable(workspace, Cardinality.ExactlyOne));
    binding: Relation<role_binding> = new Relation<role_binding>(() => assignable(role_binding, Cardinality.Any));
}

type workspace_permission = (w: Relation<workspace>) => RelationBody<Resource>

function add_v1_based_workspace_permission(application: string, resource: string, verb: string, v2_perm: string): workspace_permission {   
    if (get_relation(workspace, v2_perm) != undefined) { //This permission has already been added, so we can short-circuit out
        return (w: Relation<workspace>) => w.sub(r => (r as any)[v2_perm]);
    }
    
    function _get_or_add_v1_role_permission(name: string): Relation<principal> {
        return get_or_add_relation(role, name, () => new Relation<principal>(() => assignable(principal, Cardinality.All)));
    }

    const app_admin = _get_or_add_v1_role_permission(`${application}_any_any`);
    const any_verb = _get_or_add_v1_role_permission(`${application}_${resource}_any`);
    const any_resource = _get_or_add_v1_role_permission(`${application}_any_${verb}`);
    const v1_perm = _get_or_add_v1_role_permission(`${application}_${resource}_${verb}`);
    const global_admin = get_relation(role, "any_any_any");
    const role_v2_perm = new Relation<Resource>(() => or(global_admin, or(app_admin, or(any_verb, or(any_resource, v1_perm)))));

    add_relation(role, v2_perm, role_v2_perm);

    let role_binding_obj = get_or_create_singleton(role_binding);
    const role_binding_v2_perm = new Relation(() => and(role_binding_obj.subject, role_binding_obj.granted.sub(_ => get_relation(role, v2_perm))));
    add_relation(role_binding, v2_perm, role_binding_v2_perm);

    let workspace_obj = get_or_create_singleton(workspace);
    const workspace_v2_perm = new Relation(() => or(workspace_obj.binding.sub(r => get_relation(role_binding, v2_perm)), workspace_obj.parent.sub(r => get_relation(workspace, v2_perm))));
    add_relation(workspace, v2_perm, workspace_v2_perm);

    return (w: Relation<workspace>) => w.sub(r => get_relation(workspace, v2_perm));
}
