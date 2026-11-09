import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AgentesGatewayController } from './agentes-gateway.controller.js';

describe('Agentes gateway', () => {
  const controller = new AgentesGatewayController(new ConfigService({ AGENTES_INTERNAL_TOKEN: 'test-internal-token' }));
  const request = (roles: string[] = ['ADMINISTRADOR']) => ({ session: { user: { email: 'admin@example.test', roles } } }) as unknown as Request;
  const response = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() }) as unknown as Response;
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset().mockResolvedValue({ status: 200, json: async () => ({ ok: true }) });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('requires a real session even in development', async () => {
    await expect(controller.getSummary({} as Request, response())).rejects.toBeInstanceOf(UnauthorizedException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards service token and trusted session identity on reads', async () => {
    await controller.listActions(request(['RECEPCIONISTA']), response());
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/acciones'), expect.objectContaining({
      headers: expect.objectContaining({ 'X-Internal-Token': 'test-internal-token', 'X-Actor-Role': 'LECTOR', 'X-Actor-Id': 'admin@example.test' }),
    }));
  });

  it('prevents readers from changing autonomy and dispatching actions', async () => {
    await expect(controller.configureAgent(request(['RECEPCIONISTA']), response(), 'OPERATIVO', {})).rejects.toBeInstanceOf(ForbiddenException);
    await expect(controller.executeApprovedAction(request(['RECEPCIONISTA']), response(), 'action')).rejects.toBeInstanceOf(ForbiddenException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses the authenticated administrator as approver', async () => {
    await controller.authorizeAction(request(), response(), 'action', { aprobado: true, aprobado_por: 'forged' });
    const options = fetchMock.mock.calls[0][1];
    expect(options.headers['X-Actor-Role']).toBe('ADMINISTRADOR');
    expect(JSON.parse(options.body).aprobado_por).toBe('admin@example.test');
  });

  it('preserves validation errors so the UI can show why dispatch is blocked', async () => {
    fetchMock.mockResolvedValue({ status: 422, json: async () => ({ detail: 'Configura destinatarios' }) });
    const res = response();
    await controller.executeApprovedAction(request(), res, 'action');
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ detail: 'Configura destinatarios' });
  });

  it('forwards agent configuration to the backend', async () => {
    const body = { activo: true, nivel_autonomia_maximo: 2 };
    await controller.configureAgent(request(), response(), 'OPERATIVO', body);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/agentes/OPERATIVO'), expect.objectContaining({
      method: 'PUT', body: JSON.stringify(body), headers: expect.objectContaining({ 'X-Internal-Token': 'test-internal-token' }),
    }));
  });
});
