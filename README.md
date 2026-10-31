# @lp-labs/react-permission-editor

A typed editor and resolver for role/resource/action grants with role inheritance. This is a data-editing and resolution utility only, not an authorization boundary.

## Example

```tsx
import { PermissionEditor, can, type PermissionModel } from "@lp-labs/react-permission-editor";
import "@lp-labs/react-permission-editor/styles.css";

const model: PermissionModel = {
  roles: [
    { id: "reader", label: "Reader", grants: ["documents:read"] },
    { id: "admin", label: "Administrator", inherits: ["reader"], grants: ["documents:delete"] },
  ],
  resources: ["documents"], actions: ["read", "delete"],
};
const allowed = can(model, "admin", "documents", "read");
function Editor() { const [draft, setDraft] = React.useState(model); return <PermissionEditor model={draft} onChange={setDraft} />; }
```

## React API

`PermissionEditor` accepts `PermissionEditorProps`: `model` (required), `onChange` (required immutable model callback), and optional `className` (defaults to `lp-permission-editor`). It displays one checkbox per role/resource/action. Inherited grants are checked and disabled; editing an explicit grant invokes `onChange`. Invalid models remain visible and editable but checkboxes are disabled until `validatePermissionModel` reports no issues. Labels identify role/resource/action. The wide table scrolls horizontally when styled with the included CSS.

`PermissionModel` is `{roles: readonly PermissionRole[]; resources: readonly string[]; actions: readonly string[]}`. Each `PermissionRole` is `{id: string; label?: string; inherits?: readonly string[]; grants: readonly string[]}`. Grant strings use the exact `resource:action` form. `PermissionIssue` is `{roleId, message}` and `PermissionEditorProps` is the component prop type.

## Helpers

- `permissionKey(resource: string, action: string): string` joins the two identifiers with `:`.
- `validatePermissionModel(model: PermissionModel): PermissionIssue[]` reports duplicate/empty role identifiers, missing inherited roles, cycles, and grants that do not reference a listed resource and action. It returns all detected issues. The grant syntax does not support colons inside resource/action names.
- `effectivePermissions(model: PermissionModel, roleId: string): Set<string>` returns the union of direct and inherited grants. Throws `Error` if the model has any validation issue or the role does not exist. Traversal is cycle-safe after validation.
- `can(model: PermissionModel, roleId: string, resource: string, action: string): boolean` checks membership of `permissionKey(resource, action)` in that effective set; same errors as `effectivePermissions`.

## Behavior and limits

Inheritance is additive: there are no deny rules, wildcard grants, attributes, users, policy conditions, or precedence semantics. `validatePermissionModel` may report more than one problem for a malformed draft. This library never authenticates callers, enforces permissions on server operations, or protects data. Always enforce authorization independently at a trusted server boundary; do not make access decisions solely from UI state. Very large role-by-resource-by-action matrices can be expensive to render and should be paginated/virtualized by the host.

Native checkboxes and table headers support keyboard and screen-reader navigation. React is the sole runtime peer; ESM/CommonJS builds ship declarations. CSS is optional.

## License

[MIT](./LICENSE).

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
