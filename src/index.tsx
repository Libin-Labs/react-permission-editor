import * as React from 'react';

export interface PermissionRole {
  id: string;
  label?: string;
  inherits?: readonly string[];
  grants: readonly string[];
}
export interface PermissionModel {
  roles: readonly PermissionRole[];
  resources: readonly string[];
  actions: readonly string[];
}
export interface PermissionIssue {
  roleId: string;
  message: string;
}
export function permissionKey(resource: string, action: string): string {
  return `${resource}:${action}`;
}
export function validatePermissionModel(model: PermissionModel): PermissionIssue[] {
  const issues: PermissionIssue[] = [];
  const roles = new Map<string, PermissionRole>();
  for (const role of model.roles) {
    if (!role.id || roles.has(role.id))
      issues.push({ roleId: role.id, message: 'Role identifiers must be unique and non-empty.' });
    roles.set(role.id, role);
  }
  for (const role of model.roles)
    for (const parent of role.inherits ?? [])
      if (!roles.has(parent))
        issues.push({ roleId: role.id, message: `Unknown inherited role: ${parent}` });
  const done = new Set<string>();
  const active = new Set<string>();
  const visit = (id: string): void => {
    if (active.has(id)) {
      issues.push({ roleId: id, message: 'Role inheritance cycle detected.' });
      return;
    }
    if (done.has(id)) return;
    active.add(id);
    for (const parent of roles.get(id)?.inherits ?? []) if (roles.has(parent)) visit(parent);
    active.delete(id);
    done.add(id);
  };
  for (const role of model.roles) visit(role.id);
  for (const role of model.roles)
    for (const grant of role.grants) {
      const [resource, action, ...extra] = grant.split(':');
      if (extra.length || !model.resources.includes(resource) || !model.actions.includes(action))
        issues.push({ roleId: role.id, message: `Unknown permission grant: ${grant}` });
    }
  return issues;
}
export function effectivePermissions(model: PermissionModel, roleId: string): Set<string> {
  const issues = validatePermissionModel(model);
  if (issues.length) throw new Error(issues[0].message);
  const roles = new Map(model.roles.map((role) => [role.id, role]));
  if (!roles.has(roleId)) throw new Error(`Unknown role: ${roleId}`);
  const result = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): void => {
    if (visited.has(id)) return;
    visited.add(id);
    const role = roles.get(id);
    if (!role) return;
    for (const grant of role.grants) result.add(grant);
    for (const parent of role.inherits ?? []) visit(parent);
  };
  visit(roleId);
  return result;
}
export function can(
  roleModel: PermissionModel,
  roleId: string,
  resource: string,
  action: string,
): boolean {
  return effectivePermissions(roleModel, roleId).has(permissionKey(resource, action));
}
export interface PermissionEditorProps {
  model: PermissionModel;
  onChange: (model: PermissionModel) => void;
  className?: string;
}
export function PermissionEditor({
  model,
  onChange,
  className,
}: PermissionEditorProps): React.ReactElement {
  const issues = validatePermissionModel(model);
  return (
    <section className={className ?? 'lp-permission-editor'} aria-label="Permission editor">
      <table>
        <caption>Role permissions</caption>
        <thead>
          <tr>
            <th scope="col">Role</th>
            {model.resources.flatMap((resource) =>
              model.actions.map((action) => (
                <th scope="col" key={`${resource}:${action}`}>
                  {resource} / {action}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {model.roles.map((role) => {
            let inherited = new Set<string>();
            try {
              inherited = effectivePermissions(model, role.id);
            } catch {
              /* Invalid drafts remain editable. */
            }
            return (
              <tr key={role.id}>
                <th scope="row">{role.label}</th>
                {model.resources.flatMap((resource) =>
                  model.actions.map((action) => {
                    const key = permissionKey(resource, action);
                    const explicit = role.grants.includes(key);
                    const inheritedOnly = inherited.has(key) && !explicit;
                    return (
                      <td key={key}>
                        <input
                          type="checkbox"
                          aria-label={`${role.label}: ${resource} ${action}`}
                          checked={explicit || inheritedOnly}
                          disabled={inheritedOnly || issues.length > 0}
                          onChange={(event) =>
                            onChange({
                              ...model,
                              roles: model.roles.map((candidate) =>
                                candidate.id === role.id
                                  ? {
                                      ...candidate,
                                      grants: event.target.checked
                                        ? [...candidate.grants, key]
                                        : candidate.grants.filter((grant) => grant !== key),
                                    }
                                  : candidate,
                              ),
                            })
                          }
                        />
                      </td>
                    );
                  }),
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {issues.map((issue, index) => (
        <p role="alert" key={`${issue.roleId}-${index}`}>
          {issue.message}
        </p>
      ))}
    </section>
  );
}
