import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../../entities/membership.entity';

function mockContext(role?: Role): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ orgContext: role ? { role } : undefined }),
    }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function guardRequiring(min?: Role): RolesGuard {
  const reflector = {
    getAllAndOverride: () => min,
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe('RolesGuard', () => {
  it('allows the request when no minimum role is declared', () => {
    expect(guardRequiring(undefined).canActivate(mockContext(Role.viewer))).toBe(
      true,
    );
  });

  it('allows when the user role meets the minimum', () => {
    expect(guardRequiring(Role.member).canActivate(mockContext(Role.member))).toBe(
      true,
    );
  });

  it('allows when the user role exceeds the minimum', () => {
    expect(guardRequiring(Role.member).canActivate(mockContext(Role.owner))).toBe(
      true,
    );
  });

  it('denies a viewer from a member-only action', () => {
    expect(() =>
      guardRequiring(Role.member).canActivate(mockContext(Role.viewer)),
    ).toThrow(ForbiddenException);
  });

  it('denies when there is no org role context at all', () => {
    expect(() =>
      guardRequiring(Role.viewer).canActivate(mockContext(undefined)),
    ).toThrow(ForbiddenException);
  });
});
