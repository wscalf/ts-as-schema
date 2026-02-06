namespace hbi {
    export class host extends Resource {
        private workspace = new Relation<rbac.workspace>(() => assignable(Cardinality.ExactlyOne, rbac.workspace, uuid()))

        subscription_manager_id = new Field(false, uuid())
        satellite_id = new Field(false, uuid().or(text({regex: "^\\d{10}$"})))
        insights_id = new Field(false, uuid())
        ansible_host = new Field(false, text({maxLength: 255}))
        
        view = new Relation(() => rbac.has_permission_on_workspace(this.workspace, this.inventory_host_view));
        update = new Relation(() => rbac.has_permission_on_workspace(this.workspace, this.inventory_host_update));
        
        private inventory_host_view!: rbac.workspace_permission
        private inventory_host_update!: rbac.workspace_permission

        override applyExtensions(): void {
            this.inventory_host_view = rbac.v1_based_workspace_permission("inventory", "hosts", "read", "inventory_host_view");
            this.inventory_host_update = rbac.v1_based_workspace_permission("inventory", "hosts", "write", "inventory_host_update");
        }
    }
}