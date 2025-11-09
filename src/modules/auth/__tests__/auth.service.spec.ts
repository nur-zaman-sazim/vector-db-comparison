import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";

import { EntityManager } from "@mikro-orm/core";

import { mockDeep } from "vitest-mock-extended";

import { AuthService } from "@/modules/auth/auth.service";
import { IEmailService } from "@/modules/emails/email-service.interface";
import { EMAIL_SERVICE_TOKEN } from "@/modules/emails/emails.constants";
import { RolesService } from "@/modules/roles/roles.service";
import { UsersService } from "@/modules/users/users.service";
import { VerificationRequestsService } from "@/modules/verification-requests/verification-requests.service";

import { MOCK_JWT_TOKEN, MOCK_USER_PASSWORD } from "./auth.mocks";
import { MOCK_USER } from "./users.mocks";

describe("AuthService", () => {
  let service: AuthService;

  const mockJwtService = mockDeep<JwtService>({ funcPropSupport: true });
  const mockUsersService = mockDeep<UsersService>({ funcPropSupport: true });
  const mockRolesService = mockDeep<RolesService>({ funcPropSupport: true });
  const mockVerificationRequestsService = mockDeep<VerificationRequestsService>({
    funcPropSupport: true,
  });
  const mockConfigService = mockDeep<ConfigService>({ funcPropSupport: true });
  const mockEmailsService = mockDeep<IEmailService>({ funcPropSupport: true });
  const mockEntityManager = mockDeep<EntityManager>({ funcPropSupport: true });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
        {
          provide: VerificationRequestsService,
          useValue: mockVerificationRequestsService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EMAIL_SERVICE_TOKEN,
          useValue: mockEmailsService,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should validate an user", async () => {
    mockUsersService.findByEmailOrThrow.mockResolvedValue(MOCK_USER);

    const response = await service.validateUser(MOCK_USER.email, MOCK_USER_PASSWORD);
    expect(response).toEqual(MOCK_USER);
  });

  it("should return access token", async () => {
    mockUsersService.findByEmailOrThrow.mockResolvedValue(MOCK_USER);
    mockJwtService.signAsync.mockResolvedValue(MOCK_JWT_TOKEN);

    const response = await service.createAccessToken(MOCK_USER);
    expect(response).toEqual(MOCK_JWT_TOKEN);
  });
});
