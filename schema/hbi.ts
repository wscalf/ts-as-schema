namespace hbi /* Everything inside this has reporter = hbi for report and check*/ {
    export class host /* resource type for report and check */ extends Resource {
        // Assign-only relation, 'workspace' field in report, type uuid, not especially useful in but compatible with check/lookup
        private workspace = new Relation<rbac.workspace>(() => assignable(Cardinality.ExactlyOne, rbac.workspace, uuid()))

        // Data fields, also reported
        subscription_manager_id = new Field(false, uuid())
        satellite_id = new Field(false, uuid().or(text({regex: "^\\d{10}$"})))
        insights_id = new Field(false, uuid())
        ansible_host = new Field(false, text({maxLength: 255}))
        
        // Permission objects. Note the !-symbols - these tell TypeScript that they will be assigned before use, so we don't have to give them in initial value
        // It might be tempting to do something like: private inventory_host_view = rbac.create_v1_based_workspace_permission("inventory", "hosts", "read", "inventory_host_view");, but this is wrong
        // RBAC may not be loaded yet, so we can't call functions from it yet. Any code from other modules should be called in the applyExtensions() function.
        private inventory_host_view!: rbac.workspace_permission
        private inventory_host_update!: rbac.workspace_permission

        // Non-assignable relations so NOT reported, but used in the relation field for check/lookup These are meant to look like authz code one might write in an application.
        view = new Relation(() => rbac.has_permission_on_workspace(this.workspace, this.inventory_host_view) /* Actually syntactic sugar for this.workspace.sub(w => w.inventory_host_view) */);
        update = new Relation(() => rbac.has_permission_on_workspace(this.workspace, this.inventory_host_update));
        

        // applyExtensions is where we call code from other modules to expand their schemas
        override applyExtensions(): void {
            //Maps inventory:hosts:read in V1 RBAC to inventory_host_view on the workspace and returns a permission object that represents it (see how to use above)
            this.inventory_host_view = rbac.create_v1_based_workspace_permission("inventory", "hosts", "read", "inventory_host_view"); // Note: when listing or checking workspaces, use inventory_host_view
            this.inventory_host_update = rbac.create_v1_based_workspace_permission("inventory", "hosts", "write", "inventory_host_update");
        }
    }
}