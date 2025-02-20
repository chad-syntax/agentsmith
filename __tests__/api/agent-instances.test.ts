import { NextRequest, mockJson } from './test-utils';
import { GET as getStatus } from '@/app/api/[apiVersion]/agents/instances/[instanceId]/status/route';
import { GET as getHistory } from '@/app/api/[apiVersion]/agents/instances/[instanceId]/history/route';
import {
  GET as getAction,
  POST as executeAction,
} from '@/app/api/[apiVersion]/agents/instances/[instanceId]/actions/[actionId]/route';
import { GET as getReaction } from '@/app/api/[apiVersion]/agents/instances/[instanceId]/reactions/[reactionId]/route';
import {
  __DUMMY_AGENT_INSTANCES__,
  __DUMMY_AGENT_VERSIONS__,
} from '@/app/constants';

jest.mock('next/server');

const testInstance = Object.values(__DUMMY_AGENT_INSTANCES__)[0];
const testVersion = Object.values(__DUMMY_AGENT_VERSIONS__)[0];
const testAction = testVersion.actions[0];
const testReaction = testVersion.reactions[0];

describe('Agent Instances API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return instance status', async () => {
    const req = NextRequest(
      `http://localhost:3000/api/v1/agents/instances/${testInstance.id}/status`,
      { method: 'GET' }
    );
    const params = Promise.resolve({
      apiVersion: 'v1',
      instanceId: testInstance.id,
    });

    await getStatus(req, { params });
    expect(mockJson).toHaveBeenCalledWith(
      {
        status: testInstance.status,
        lastUpdated: testInstance.updatedAt.toISOString(),
      },
      { status: 200 }
    );
  });

  it('should handle non-existent instance', async () => {
    const req = NextRequest(
      'http://localhost:3000/api/v1/agents/instances/non-existent/status',
      { method: 'GET' }
    );
    const params = Promise.resolve({
      apiVersion: 'v1',
      instanceId: 'non-existent',
    });

    await getStatus(req, { params });
    expect(mockJson).toHaveBeenCalledWith(
      { error: 'Instance not found' },
      { status: 404 }
    );
  });

  it('should return instance history', async () => {
    const req = NextRequest(
      `http://localhost:3000/api/v1/agents/instances/${testInstance.id}/history`,
      { method: 'GET' }
    );
    const params = Promise.resolve({
      apiVersion: 'v1',
      instanceId: testInstance.id,
    });

    await getHistory(req, { params });
    expect(mockJson).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          type: expect.any(String),
          timestamp: expect.any(String),
          data: expect.any(Object),
        }),
      ]),
      { status: 200 }
    );
  });

  it('should handle non-existent instance for history', async () => {
    const req = NextRequest(
      'http://localhost:3000/api/v1/agents/instances/non-existent/history',
      { method: 'GET' }
    );
    const params = Promise.resolve({
      apiVersion: 'v1',
      instanceId: 'non-existent',
    });

    await getHistory(req, { params });
    expect(mockJson).toHaveBeenCalledWith(
      { error: 'Instance not found' },
      { status: 404 }
    );
  });

  it('should get a specific action', async () => {
    const req = NextRequest(
      `http://localhost:3000/api/v1/agents/instances/${testInstance.id}/actions/${testAction.id}`,
      { method: 'GET' }
    );
    const params = Promise.resolve({
      apiVersion: 'v1',
      instanceId: testInstance.id,
      actionId: testAction.id,
    });

    await getAction(req, { params });
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        id: testAction.id,
        name: testAction.name,
        slug: testAction.slug,
        prompt: expect.objectContaining({
          id: expect.any(String),
        }),
      }),
      { status: 200 }
    );
  });

  it('should handle non-existent action', async () => {
    const req = NextRequest(
      `http://localhost:3000/api/v1/agents/instances/${testInstance.id}/actions/non-existent`,
      { method: 'GET' }
    );
    const params = Promise.resolve({
      apiVersion: 'v1',
      instanceId: testInstance.id,
      actionId: 'non-existent',
    });

    await getAction(req, { params });
    expect(mockJson).toHaveBeenCalledWith(
      { error: 'Action not found' },
      { status: 404 }
    );
  });

  it('should get a specific reaction', async () => {
    const req = NextRequest(
      `http://localhost:3000/api/v1/agents/instances/${testInstance.id}/reactions/${testReaction.id}`,
      { method: 'GET' }
    );
    const params = Promise.resolve({
      apiVersion: 'v1',
      instanceId: testInstance.id,
      reactionId: testReaction.id,
    });

    await getReaction(req, { params });
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        id: testReaction.id,
        name: testReaction.name,
        slug: testReaction.slug,
        prompt: expect.objectContaining({
          id: expect.any(String),
        }),
        triggers: expect.any(Array),
      }),
      { status: 200 }
    );
  });

  it('should handle non-existent reaction', async () => {
    const req = NextRequest(
      `http://localhost:3000/api/v1/agents/instances/${testInstance.id}/reactions/non-existent`,
      { method: 'GET' }
    );
    const params = Promise.resolve({
      apiVersion: 'v1',
      instanceId: testInstance.id,
      reactionId: 'non-existent',
    });

    await getReaction(req, { params });
    expect(mockJson).toHaveBeenCalledWith(
      { error: 'Reaction not found' },
      { status: 404 }
    );
  });

  it('should execute an action', async () => {
    const actionParams = {
      param1: 'value1',
      param2: 'value2',
    };

    const req = NextRequest(
      `http://localhost:3000/api/v1/agents/instances/${testInstance.id}/actions/${testAction.id}`,
      {
        method: 'POST',
        body: JSON.stringify(actionParams),
      }
    );
    const params = Promise.resolve({
      apiVersion: 'v1',
      instanceId: testInstance.id,
      actionId: testAction.id,
    });

    await executeAction(req, { params });
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        actionId: testAction.id,
        timestamp: expect.any(String),
        data: actionParams,
      }),
      { status: 200 }
    );
  });

  it('should handle non-existent instance when executing action', async () => {
    const req = NextRequest(
      `http://localhost:3000/api/v1/agents/instances/non-existent/actions/${testAction.id}`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );
    const params = Promise.resolve({
      apiVersion: 'v1',
      instanceId: 'non-existent',
      actionId: testAction.id,
    });

    await executeAction(req, { params });
    expect(mockJson).toHaveBeenCalledWith(
      { error: 'Instance not found' },
      { status: 404 }
    );
  });

  it('should handle non-existent action when executing', async () => {
    const req = NextRequest(
      `http://localhost:3000/api/v1/agents/instances/${testInstance.id}/actions/non-existent`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );
    const params = Promise.resolve({
      apiVersion: 'v1',
      instanceId: testInstance.id,
      actionId: 'non-existent',
    });

    await executeAction(req, { params });
    expect(mockJson).toHaveBeenCalledWith(
      { error: 'Action not found' },
      { status: 404 }
    );
  });
});
