import { create_v1_based_workspace_permission } from "./rbac";

create_v1_based_workspace_permission("remediations", "remediations", "read", "remediations_remediation_view");
create_v1_based_workspace_permission("remediations", "remediations", "write", "remediations_remediation_update");
create_v1_based_workspace_permission("remediations", "remediations", "delete", "remediations_remediation_delete");