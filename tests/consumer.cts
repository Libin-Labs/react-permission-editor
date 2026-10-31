import api = require('../dist/cjs/index.js');
const model: api.PermissionModel = {
  roles: [{ id: 'reader', grants: ['docs:read'] }],
  resources: ['docs'],
  actions: ['read'],
};
const props: api.PermissionEditorProps = { model, onChange: (next) => console.log(next) };
void [
  api.can,
  api.effectivePermissions,
  api.PermissionEditor,
  api.permissionKey,
  api.validatePermissionModel,
  props,
];
