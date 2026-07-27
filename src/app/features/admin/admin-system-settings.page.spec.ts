import { describe, expect, it } from 'vitest';
import { normalizeSystemSettings } from '../../core/api/remaining-feature-api.services';
const settings: any = { version:1, schemaVersion:1, general:{}, academy:{}, challenges:{}, learningPacks:{}, enrollment:{}, notifications:{}, security:{}, imports:{}, reports:{}, integrations:{}, maintenance:{} };
describe('system settings contract',()=>{
 it('normalizes direct and wrapped settings',()=>{expect(normalizeSystemSettings(settings)).toBe(settings);expect(normalizeSystemSettings({data:settings})).toBe(settings);expect(normalizeSystemSettings({settings})).toBe(settings);});
 it('rejects placeholders and malformed responses',()=>{expect(()=>normalizeSystemSettings({items:[{title:'Record 1'}]} as any)).toThrow(/malformed|unsupported/);});
 it('contains no secret fields',()=>{expect(JSON.stringify(settings)).not.toMatch(/password|privateKey|authToken|secret/i);});
});
