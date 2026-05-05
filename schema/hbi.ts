import { workspace, has_permission_on_workspace, create_v1_based_workspace_permission } from "./rbac";

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
    view = new Relation(has_permission_on_workspace(this.workspace, this.inventory_host_view));
    update = new Relation(has_permission_on_workspace(this.workspace, this.inventory_host_update));
}

// KSL equivalent:
//   public extension expose_host_permission(v2_perm, host_perm) {
//       type host { public relation `${host_perm}`: view and workspace.`${v2_perm}` }
//   }
//
// Adds a relation to the host type that gates a workspace permission behind host view access.
// Other services (e.g. advisor) call this to surface their workspace-level permissions on individual hosts.
export function expose_host_permission(v2_perm: string, host_perm: string): void {
    const view_rel: Relation<Resource> = get_relation(host, "view");
    const workspace_rel: Relation<Resource> = get_relation(host, "workspace");

    // relation `${host_perm}`: view and workspace.`${v2_perm}`
    const perm = new Relation(and(view_rel, workspace_rel.sub(_ => get_relation(workspace, v2_perm))));
    add_relation(host, host_perm, perm);
}