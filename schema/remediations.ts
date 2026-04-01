namespace remediations {
    register_extension_invocation(() => {
        rbac.create_v1_based_workspace_permission("remediations", "remediations", "read", "remediations_remediation_view");
        rbac.create_v1_based_workspace_permission("remediations", "remediations", "write", "remediations_remediation_update");
        rbac.create_v1_based_workspace_permission("remediations", "remediations", "delete", "remediations_remediation_delete");
    })
}