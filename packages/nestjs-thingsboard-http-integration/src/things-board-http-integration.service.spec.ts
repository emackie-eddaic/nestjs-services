import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { of, Subject, throwError } from 'rxjs';
import { MODULE_OPTIONS_TOKEN } from './things-board-http-integration.module-definition';
import { ThingsBoardHttpIntegrationService } from './things-board-http-integration.service';
import type {
  ThingsBoardHttpIntegrationBody,
  ThingsBoardHttpIntegrationConfiguration,
} from './type';

describe('ThingsBoardHttpIntegrationService', () => {
  let module: TestingModule;
  let service: ThingsBoardHttpIntegrationService;
  let configuration: ThingsBoardHttpIntegrationConfiguration;
  const post = jest.fn();
  const body: ThingsBoardHttpIntegrationBody = {
    deviceName: 'sensor-1',
    deviceType: 'temperature',
    telemetry: { ts: 1234, values: { temperature: 21 } },
  };

  beforeEach(async () => {
    post.mockReset();
    configuration = { integrationId: 'integration-id' };
    module = await Test.createTestingModule({
      providers: [
        ThingsBoardHttpIntegrationService,
        { provide: HttpService, useValue: { post } },
        { provide: MODULE_OPTIONS_TOKEN, useValue: configuration },
      ],
    }).compile();
    service = module.get(ThingsBoardHttpIntegrationService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('posts telemetry to the default ThingsBoard Cloud URL', async () => {
    post.mockReturnValue(of(undefined));

    await expect(service.upload(body)).resolves.toBeUndefined();

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(
      'https://thingsboard.cloud/api/v1/integrations/http/integration-id',
      body,
    );
  });

  it('uses the configured base URL and integration ID', async () => {
    configuration.baseUrl = 'https://thingsboard.example';
    configuration.integrationId = 'custom-id';
    post.mockReturnValue(of(undefined));

    await service.upload(body);

    expect(post).toHaveBeenCalledWith(
      'https://thingsboard.example/api/v1/integrations/http/custom-id',
      body,
    );
  });

  it.each([undefined, ''])(
    'rejects an integration ID of %p before making a request',
    async (integrationId) => {
      configuration.integrationId = integrationId;

      await expect(service.upload(body)).rejects.toThrow(
        '`integrationId` not set.',
      );

      expect(post).not.toHaveBeenCalled();
    },
  );

  it('propagates HTTP failures', async () => {
    const failure = new Error('Connection failed');
    post.mockReturnValue(throwError(() => failure));

    await expect(service.upload(body)).rejects.toBe(failure);
  });

  it('waits for an HTTP response before resolving', async () => {
    const response = new Subject<unknown>();
    post.mockReturnValue(response);
    let resolved = false;
    const upload = service.upload(body).then(() => {
      resolved = true;
    });

    await Promise.resolve();
    expect(resolved).toBe(false);

    response.next(undefined);
    await upload;
    expect(resolved).toBe(true);
    response.complete();
  });
});
