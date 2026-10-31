import {
  can,
  effectivePermissions,
  PermissionEditor,
  permissionKey,
  validatePermissionModel,
  type PermissionEditorProps,
  type PermissionModel,
} from '../dist/esm/index.js';
const model: PermissionModel = {
  roles: [{ id: 'reader', grants: ['docs:read'] }],
  resources: ['docs'],
  actions: ['read'],
};
const props: PermissionEditorProps = { model, onChange: (next) => console.log(next) };
void [can, effectivePermissions, PermissionEditor, permissionKey, validatePermissionModel, props];
