import { workspace,has_permission_on_workspace, create_v1_based_workspace_permission } from "./rbac";
export class host /* resource type for report and check */ extends Resource {
    // Assign-only relation, 'workspace' field in report, type uuid, not especially useful in but compatible with check/lookup
    private workspace = new Relation<workspace>(assignable(Cardinality.ExactlyOne, workspace, uuid()))

    // Data fields, also reported
    subscription_manager_id = new Field(false, uuid())
    satellite_id = new Field(false, uuid().or(text({regex: "^\\d{10}$"})))
    insights_id = new Field(false, uuid())
    ansible_host = new Field(false, text({maxLength: 255}))
    
    // Permission objects - each represents a workspace permission added to RBAC and later checked with has_permission_on_workspace
    private inventory_host_view = create_v1_based_workspace_permission("inventory", "hosts", "read", "inventory_host_view");
    private inventory_host_update = create_v1_based_workspace_permission("inventory", "hosts", "write", "inventory_host_update");

    // Non-assignable relations so NOT reported, but used in the relation field for check/lookup These are meant to look like authz code one might write in an application.
    view = new Relation(has_permission_on_workspace(this.workspace, this.inventory_host_view) /* Actually syntactic sugar for this.workspace.sub(w => w.inventory_host_view) */);
    update = new Relation(has_permission_on_workspace(this.workspace, this.inventory_host_update));
}