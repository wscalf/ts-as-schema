import { workspace,has_permission_on_workspace, create_v1_based_workspace_permission, principal } from "./rbac";

export class cluster extends Resource {
    private workspace = new Relation<workspace>(assignable(Cardinality.ExactlyOne, workspace, uuid()))

    cluster_id = new Field(false, uuid())
    name = new Field(false, text({maxLength: 255}))
    status = new Field(false, text({maxLength: 255}))
    created_at = new Field(false, text())
    updated_at = new Field(false, text())

    private ready = new Relation<principal>(dynamic("status == 'ready'", Cardinality.All, principal));
    private pending = new Relation<principal>(dynamic("status == 'pending'", Cardinality.All, principal));
    private deleting = new Relation<principal>(dynamic("status == 'deleting'", Cardinality.All, principal));

    private ocm_cluster_view = create_v1_based_workspace_permission("ocm", "clusters", "read", "ocm_cluster_view");
    private ocm_cluster_update = create_v1_based_workspace_permission("ocm", "clusters", "write", "ocm_cluster_update");

    view = new Relation(has_permission_on_workspace(this.workspace, this.ocm_cluster_view));
    update = new Relation(has_permission_on_workspace(this.workspace, this.ocm_cluster_update));
    delete = new Relation(and(this.ready, has_permission_on_workspace(this.workspace, this.ocm_cluster_update)));
}