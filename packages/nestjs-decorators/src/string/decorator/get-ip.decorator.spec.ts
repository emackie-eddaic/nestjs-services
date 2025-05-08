import { getIpFromRequest } from './get-ip.decorator';

describe('getIpFromRequest', () => {
  it('it should params.device_id if present', () => {
    expect(getIpFromRequest({ headers: {} } as never)).toEqual(undefined);
    expect(
      getIpFromRequest({ headers: {}, ip: '192.168.0.2' } as never),
    ).toEqual('192.168.0.2');
    expect(
      getIpFromRequest({
        headers: { 'x-forwarded-for': '192.168.0.2' },
      } as never),
    ).toEqual('192.168.0.2');
    expect(
      getIpFromRequest({
        headers: { 'x-forwarded-for': '192.168.0.2' },
        ip: '192.168.0.3',
      } as never),
    ).toEqual('192.168.0.2');
    expect(
      getIpFromRequest({
        headers: { 'x-forwarded-for': '192.168.0.2,192.168.0.3' },
      } as never),
    ).toEqual('192.168.0.2');
  });
});
