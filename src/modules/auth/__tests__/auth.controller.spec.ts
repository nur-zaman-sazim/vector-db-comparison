import { Test, TestingModule } from "@nestjs/testing";

import { mockDeep } from "vitest-mock-extended";

import { AuthController } from "@/modules/auth/auth.controller";
import { AuthService } from "@/modules/auth/auth.service";
import { UsersSerializer } from "@/modules/users/users.serializer";
import { UsersService } from "@/modules/users/users.service";

import { MOCK_JWT_TOKEN, getMockSignInResponse } from "./auth.mocks";
import { MOCK_USER } from "./users.mocks";

describe("AuthController", () => {
  let controller: AuthController;

  const mockAuthService = mockDeep<AuthService>({ funcPropSupport: true });
  const mockUsersService = mockDeep<UsersService>({ funcPropSupport: true });
  const mockUsersSerializer = mockDeep<UsersSerializer>({ funcPropSupport: true });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: UsersSerializer,
          useValue: mockUsersSerializer,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should sign in a user", async () => {
    mockAuthService.createAccessToken.mockResolvedValue(MOCK_JWT_TOKEN);

    const response = await controller.signIn(MOCK_USER);
    expect(mockAuthService.createAccessToken).toHaveBeenCalledWith(MOCK_USER);
    expect(response).toEqual(getMockSignInResponse(MOCK_USER));
  });
});
