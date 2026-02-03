
class host extends Resource {
    
    workspace = new Relation<workspace>(() => assignable(workspace, Cardinality.ExactlyOne))
    
    view = new Relation(() => this.inventory_host_view(this.workspace));
    update = new Relation(() => this.inventory_host_update(this.workspace));
    
    inventory_host_view!: workspace_permission
    inventory_host_update!: workspace_permission

    override applyExtensions(): void {
        this.inventory_host_view = add_v1_based_workspace_permission("inventory", "hosts", "read", "inventory_host_view");
        this.inventory_host_update = add_v1_based_workspace_permission("inventory", "hosts", "write", "inventory_host_update");
    }
}