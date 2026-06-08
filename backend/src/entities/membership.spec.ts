import { Role, ROLE_RANK } from './membership.entity';

describe('ROLE_RANK', () => {
  it('orders roles from viewer (lowest) to owner (highest)', () => {
    expect(ROLE_RANK[Role.viewer]).toBeLessThan(ROLE_RANK[Role.member]);
    expect(ROLE_RANK[Role.member]).toBeLessThan(ROLE_RANK[Role.admin]);
    expect(ROLE_RANK[Role.admin]).toBeLessThan(ROLE_RANK[Role.owner]);
  });

  it('assigns a distinct rank to every role', () => {
    const ranks = Object.values(ROLE_RANK);
    expect(new Set(ranks).size).toBe(ranks.length);
  });
});
