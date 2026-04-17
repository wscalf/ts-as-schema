import { create_v1_based_workspace_permission } from "./rbac";

create_v1_based_workspace_permission("tasks", "tasks", "read", "tasks_task_view");
create_v1_based_workspace_permission("tasks", "tasks", "write", "tasks_task_update");
