namespace tasks {
    register_extension_invocation(() => {
        rbac.create_v1_based_workspace_permission("tasks", "tasks", "read", "tasks_task_view");
        rbac.create_v1_based_workspace_permission("tasks", "tasks", "write", "tasks_task_update");
    })
}
