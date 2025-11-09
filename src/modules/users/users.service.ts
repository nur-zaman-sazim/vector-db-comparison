import { BadRequestException, Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { EntityManager } from "@mikro-orm/core";

import * as argon2 from "argon2";

import { ARGON2_OPTIONS } from "@/common/config/argon2.config";
import { Role } from "@/common/entities/roles.entity";
import { EUserRole } from "@/common/enums/roles.enums";
import { EOAuthProvider } from "@/common/enums/shared.enums";
import { EVerificationRequestType } from "@/common/enums/verification-requests.enums";
import { computePaginationMetadata } from "@/utils/pagination";

import { ISignInWithGoogleParams } from "../auth/auth.interfaces";
import { IEmailService } from "../emails/email-service.interface";
import { EMAIL_SERVICE_TOKEN } from "../emails/emails.constants";
import { RolesRepository } from "../roles/roles.repository";
import { VerificationRequestsService } from "../verification-requests/verification-requests.service";
import { EMAIL_VERIFICATION_EMAIL_EXPIRATION_IN_MINUTES } from "./users.constants";
import {
  UpdateUserAsSuperuserDto,
  RegisterUserDto,
  SelfRegisterUserDto,
  SuperuserFindAllUsersParams,
} from "./users.dtos";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly entityManager: EntityManager,
    private readonly usersRepository: UsersRepository,
    private readonly rolesRepository: RolesRepository,
    private readonly verificationRequestsService: VerificationRequestsService,
    @Inject(EMAIL_SERVICE_TOKEN)
    private readonly emailsService: IEmailService,
    private readonly configService: ConfigService,
  ) {}

  private hashPassword(password: string) {
    return argon2.hash(password, ARGON2_OPTIONS);
  }

  async findByIdOrThrow(id: number) {
    const user = await this.usersRepository.findOneOrFail(id, {
      populate: ["userProfile", "userProfile.role"],
    });
    return user;
  }

  findByEmail(email: string) {
    return this.usersRepository.findOne({ email });
  }

  async findByEmailOrThrow(email: string) {
    const user = await this.usersRepository.findOneOrFail(
      {
        email,
      },
      {
        populate: ["userProfile", "userProfile.role"],
      },
    );
    return user;
  }

  async createOne(registerUserDto: RegisterUserDto) {
    const existingUser = await this.usersRepository.findOne({
      email: registerUserDto.email,
    });

    if (existingUser) {
      throw new BadRequestException("User already exists");
    }

    const role = await this.rolesRepository.findOneOrFail({
      id: registerUserDto.userProfile.roleId,
    });

    const newUser = this.usersRepository.createOne(
      {
        ...registerUserDto,
        password: await this.hashPassword(registerUserDto.password),
      },
      role,
    );

    await this.entityManager.flush();

    this.emailsService.sendEmailByTextOrHtml({
      to: newUser.email,
      subject: "Welcome",
      text: "Welcome to our platform",
      html: `
        <h1>Welcome to our platform</h1>
        <p>Your user credentials are:</p>
        <p>Email: ${newUser.email}</p>
        <p>Temporary Password: ${registerUserDto.password}</p>

        <p>Visit ${new URL(
          "/sign-in",
          this.configService.getOrThrow("WEB_CLIENT_BASE_URL"),
        )} to login</p>
      `,
    });

    return newUser;
  }

  async selfRegister(selfRegisterUserDto: SelfRegisterUserDto, roleName = EUserRole.ADMIN) {
    const existingUser = await this.usersRepository.findOne({
      email: selfRegisterUserDto.email,
    });

    if (existingUser) {
      throw new BadRequestException("User already exists");
    }

    const role = await this.rolesRepository.findOneOrFail({
      name: roleName,
    });

    const newUser = this.usersRepository.createOne(
      {
        ...selfRegisterUserDto,
        password: await this.hashPassword(selfRegisterUserDto.password),
      },
      role,
    );

    const verificationRequest =
      this.verificationRequestsService.createAndPersistNewVerificationRequest(
        newUser,
        EVerificationRequestType.EMAIL_VERIFICATION,
        EMAIL_VERIFICATION_EMAIL_EXPIRATION_IN_MINUTES,
      );

    await this.entityManager.flush();

    const emailVerificationLink = new URL(
      `/verify?token=${verificationRequest.token}&type=${EVerificationRequestType.EMAIL_VERIFICATION}`,
      this.configService.getOrThrow("WEB_CLIENT_BASE_URL"),
    );

    this.emailsService.sendEmailByTextOrHtml({
      to: newUser.email,
      subject: "Email Verification",
      text: `Click the link to verify your email: ${emailVerificationLink}`,
      html: `Click the link to verify your email: <a href="${emailVerificationLink}">${emailVerificationLink}</a>`,
    });

    return newUser;
  }

  async updatePassword(userId: number, password: string, role: Role) {
    const user = await this.usersRepository.findOneOrFail({
      id: userId,
      userProfile: { role },
    });

    return this.usersRepository.update(user, { password: await this.hashPassword(password) });
  }

  async updateUserAsSuperuser(userId: number, updateUserAsSuperuserDto: UpdateUserAsSuperuserDto) {
    const user = await this.findByIdOrThrow(userId);

    if (updateUserAsSuperuserDto.password) {
      updateUserAsSuperuserDto.password = await this.hashPassword(
        updateUserAsSuperuserDto.password,
      );
    }

    let updatedRole: Role | undefined;

    if (updateUserAsSuperuserDto.roleId) {
      updatedRole = await this.rolesRepository.findOneOrFail({
        id: updateUserAsSuperuserDto.roleId,
      });
    }

    const updatedUser = this.usersRepository.updateAsSuperuser(
      user,
      updateUserAsSuperuserDto,
      updatedRole,
    );

    await this.entityManager.flush();

    return updatedUser;
  }

  async findAll(params: SuperuserFindAllUsersParams, currentUserId: number) {
    const { page, limit } = params;
    const [users, total] = await this.usersRepository.findAllPaginated(params, currentUserId);

    return {
      data: users,
      meta: computePaginationMetadata({
        page,
        limit,
        totalItems: total,
      }),
    };
  }

  async createWithOAuthProvider(input: ISignInWithGoogleParams, provider: EOAuthProvider) {
    const role = await this.rolesRepository.findOneOrFail({ name: input.roleName });

    const entityManager = this.usersRepository.getEntityManager().fork();

    await entityManager.begin();

    try {
      const newUser = this.usersRepository.createWithOAuthProvider(input, provider, role);

      await entityManager.commit();

      return newUser;
    } catch (error) {
      this.logger.error("Create user with oauth transaction failed", error);
      await entityManager.rollback();
      throw error;
    }
  }
}
