import { NodeVM } from 'vm2';
import { app } from 'electron';
import Presence from './presence';
import { transpileModule } from 'typescript';
 
export const vm = new NodeVM({
  console: 'inherit',
  sandbox: { Presence, fetch: null },
  require: {
    external: ['lodash']
  }
});
vm.freeze(app.getVersion(), 'STEEMCORD_VERSION');
 
export function getPresenceFromCode(code: string): Presence {
  return vm.run(transpileModule(code, {}).outputText);
}