class Principal extends Resource {}

class Role extends Resource {
    any_any_any = new Relation<Principal>(() => assignable(Principal, Cardinality.All));
    inventory_hosts_all = new Relation<Principal>(() => assignable(Principal, Cardinality.All));
    inventory_all_read = new Relation<Principal>(() => assignable(Principal, Cardinality.All));
    inventory_all_all = new Relation<Principal>(() => assignable(Principal, Cardinality.All));
    inventory_hosts_read = new Relation<Principal>(() => assignable(Principal, Cardinality.All));
    inventory_hosts_view = new Relation(() => or(this.inventory_hosts_read, or(this.inventory_hosts_all, or(this.inventory_all_read, this.inventory_all_all))));
    inventory_hosts_write = new Relation<Principal>(() => assignable(Principal, Cardinality.All));
    inventory_all_write = new Relation<Principal>(() => assignable(Principal, Cardinality.All));
    inventory_hosts_update = new Relation(() => or(this.inventory_hosts_write, or(this.inventory_hosts_all, or(this.inventory_all_write, this.inventory_all_all))));
}

class RoleBinding extends Resource {
    granted = new Relation<Role>(() => assignable(Role, Cardinality.Any));
    subject = new Relation<Principal>(() => assignable(Principal, Cardinality.Any));

    inventory_hosts_view = new Relation(() => and(this.granted.sub((r) => r.inventory_hosts_view), this.subject));
    inventory_hosts_update = new Relation(() => and(this.granted.sub((r) => r.inventory_hosts_update), this.subject));
}


class Workspace extends Resource {
    parent: Relation<Workspace> = new Relation<Workspace>(() => assignable(Workspace, Cardinality.ExactlyOne));
    binding: Relation<RoleBinding> = new Relation<RoleBinding>(() => assignable(RoleBinding, Cardinality.Any));

    inventory_hosts_view : Relation<Resource> = new Relation(() => or(this.binding.sub((r) => r.inventory_hosts_view), this.parent.sub((r) => r.inventory_hosts_view)));
    inventory_hosts_update : Relation<Resource> = new Relation(() => or(this.binding.sub((r) => r.inventory_hosts_update), this.parent.sub((r) => r["inventory_hosts_update"])));
}