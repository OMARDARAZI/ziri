import { describe,expect,it } from 'vitest';import { extractQrToken } from '../src/utils/qrToken';import { meta } from '../src/features/admin/resourceMeta';import { money } from '../src/utils/format';
const token='a'.repeat(64);
describe('dashboard validation and utility behavior',()=>{
  it('extracts a QR token from raw input',()=>expect(extractQrToken(token)).toBe(token));
  it('extracts a QR token from a public URL',()=>expect(extractQrToken(`https://zeere.test/qr/${token}`)).toBe(token));
  it('rejects an invalid QR token',()=>expect(extractQrToken('invalid')).toBe(''));
  it('requires story time',()=>expect(meta('stories').schema.safeParse({title:'Story',content:'Content'}).success).toBe(false));
  it('requires an event date',()=>expect(meta('events').schema.safeParse({title:'Event',description:'Description'}).success).toBe(false));
  it('rejects negative offering USD values',()=>expect(meta('offerings').schema.safeParse({provider_id:'1',type:'SERVICE',title:'Tour',description:'Text',price_usd:-1,price_lbp:0}).success).toBe(false));
  it('formats USD and LBP independently',()=>{expect(money(12.5,'USD')).toContain('12.50');expect(money(3100000,'LBP')).toContain('3,100,000');});
});
