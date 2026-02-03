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
    let role_obj = get_or_create_singleton(role) as any;
    
    function _get_or_add_v1_role_permission(name: string): Relation<principal> {
        let perm = role_obj[name];
        if (perm != undefined) return perm;

        perm = new Relation<principal>(() => assignable(principal, Cardinality.All));
        role_obj[name] = perm;

        return perm;
    }

    let workspace_obj = get_or_create_singleton(workspace);
    if ((workspace_obj as any)[v2_perm] != undefined) {
        return (w: Relation<workspace>) => w.sub(r => (r as any)[v2_perm]);
    }

    const app_admin = _get_or_add_v1_role_permission(`${application}_any_any`);
    const any_verb = _get_or_add_v1_role_permission(`${application}_${resource}_any`);
    const any_resource = _get_or_add_v1_role_permission(`${application}_any_${verb}`);
    const v1_perm = _get_or_add_v1_role_permission(`${application}_${resource}_${verb}`);
    const role_v2_perm = new Relation<Resource>(() => or(app_admin, or(any_verb, or(any_resource, v1_perm))));

    role_obj[v2_perm] = role_v2_perm;

    let role_binding_obj = get_or_create_singleton(role_binding);
    const role_binding_v2_perm = new Relation(() => and(role_binding_obj.subject, role_binding_obj.granted.sub(r => (r as any)[v2_perm])));
    (role_binding_obj as any)[v2_perm] = role_binding_v2_perm;

    const workspace_v2_perm = new Relation(() => or(workspace_obj.binding.sub(r => (r as any)[v2_perm]), workspace_obj.parent.sub(r => (r as any)[v2_perm])));
    (workspace_obj as any)[v2_perm] = workspace_v2_perm;

    return (w: Relation<workspace>) => w.sub(r => workspace_v2_perm); //TODO: why does this work but not r => (r as any)[v2_perm] when the -exact- expression works on line 50?
}
