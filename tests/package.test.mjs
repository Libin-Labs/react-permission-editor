import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
const dom = new JSDOM("<!doctype html><div id='root'></div>");
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const api = await import('../dist/esm/index.js');
const cjs = createRequire(import.meta.url)('../dist/cjs/index.js');
test('ESM and CommonJS expose the same runtime API', () =>
  assert.deepEqual(
    Object.keys(cjs)
      .filter((key) => key !== '__esModule')
      .sort(),
    Object.keys(api).sort(),
  ));
test('resolves inheritance and rejects cycles', () => {
  const model = {
    roles: [
      { id: 'base', grants: ['doc:read'] },
      { id: 'child', inherits: ['base'], grants: [] },
    ],
    resources: ['doc'],
    actions: ['read'],
  };
  assert.equal(api.can(model, 'child', 'doc', 'read'), true);
  assert.match(
    api.validatePermissionModel({
      ...model,
      roles: [{ id: 'base', inherits: ['child'], grants: [] }, model.roles[1]],
    })[0].message,
    /cycle/u,
  );
  assert.throws(
    () =>
      api.effectivePermissions(
        { ...model, roles: [{ id: 'base', inherits: ['child'], grants: [] }, model.roles[1]] },
        'base',
      ),
    /cycle/u,
  );
});
test('renders role matrix controls', async () => {
  const root = createRoot(document.getElementById('root'));
  const model = {
    roles: [{ id: 'r', label: 'Reader', grants: [] }],
    resources: ['docs'],
    actions: ['read'],
  };
  let changed;
  await React.act(async () =>
    root.render(
      React.createElement(api.PermissionEditor, {
        model,
        onChange: (next) => {
          changed = next;
        },
      }),
    ),
  );
  const checkbox = document.querySelector('input[aria-label="Reader: docs read"]');
  assert.ok(checkbox);
  await React.act(async () => checkbox.click());
  assert.deepEqual(changed.roles[0].grants, ['docs:read']);
  await React.act(async () => root.unmount());
});
