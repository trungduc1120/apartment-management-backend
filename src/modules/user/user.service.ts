import {BadRequestException, ConflictException, Injectable, NotFoundException, Patch} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from "../../shared/prisma/prisma.service";
import {Actions, HouseHoldStatus, InformationStatus, Prisma, ResidenceStatus, Role, State} from "@prisma/client";
import {UpdateUserRoleDto} from "./dto/update-user-role.dto";
import * as bcrypt from 'bcrypt';
import {randomBytes} from "node:crypto";
import {MailService} from "../../common/mail/mail.service";
import now = jest.now;
import {UpdateAccountDto} from "./dto/update-account";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService,
              private mailService: MailService) {}

  async createUser(dto: CreateUserDto){
    return this.prisma.users.create({
      data:{
        ...dto
      }
    })
  }
  async updateHouseholdId(id: number, householdId: number){
    return this.prisma.users.update({
      where: {id},
      data: {householdId}
    })
  }
  async updateRole(id: number, dto: UpdateUserRoleDto){
    return this.prisma.users.update({
      where: { id },
      data: {role: dto.role}
    })
  }
  async create(dto:CreateUserDto){
    return this.prisma.users.create({
      data: dto
    })
  }

  async createAccounts(num: number) {
    if (num <= 0) {
      throw new Error('num must be > 0');
    }

    const suffix = Date.now(); // đảm bảo không trùng
    const hashedPassword = await bcrypt.hash('123456', 10);

    const users = Array.from({ length: num }).map((_, i) => ({
      username: `user_${suffix}_${i}`,
      email: `user_${suffix}_${i}@sunrise.local`,
      password: hashedPassword,
      role: Role.USER,
    }));

    return this.prisma.users.createMany({
      data: users,
    });
  }


  async getUsers(
    page = 1,
    limit = 10,
    search?: string,
    state?: State,
  ) {
    const where: Prisma.UsersWhereInput = {
      ...(search && search.trim().length > 0 && {
        OR: [
          {
            email: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            HouseHolds: {
              is: {
                head: {
                  fullname: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
            },
          },
        ],
      }),
      ...(state && {
        state,
      }),
    };

    const total = await this.prisma.users.count({ where });

// Điều chỉnh page nếu vượt quá tổng
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.min(page, totalPages || 1); // đảm bảo >= 1
    const skip = (currentPage - 1) * limit;

// Lấy data
    const data = await this.prisma.users.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createtime: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        state: true,
        HouseHolds: {
          select: {
            apartmentNumber: true,
            head: {
              select: {
                fullname: true,
              },
            },
          },
        },
      },
    });

    return {
      data: {
        items: data,
        total,
        page: currentPage,
        limit,
        totalPages,
      },
    };
  }


  async deleteUsers(ids: number[]) {
    return this.prisma.$transaction(async (tx) => {
      // soft delete households liên quan
      await tx.houseHolds.updateMany({
        where: {
          userID: {
            in: ids,
          },
        },
        data: {
          status: HouseHoldStatus.DELETE,
        },
      });

      // soft delete users
      const result = await tx.users.updateMany({
        where: {
          id: {
            in: ids,
          },
        },
        data: {
          state: State.DELETED,
        },
      });

      return {
        deletedUsers: result.count,
      };
    });
  }
  async userDetails(id: number) {
    return this.prisma.users.findFirstOrThrow({
      where: {
        id,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        state: true,
        createtime: true,

        HouseHolds: {
          select: {
            id: true,
            houseHoldCode: true,
            apartmentNumber: true,
            buildingNumber: true,
            street: true,
            ward: true,
            province: true,
            status: true,
            createtime: true,
            informationStatus: true,

            // Chủ hộ
            head: {
              select: {
                id: true,
                fullname: true,
                nationalId: true,
              },
            },

            // ✅ Thành viên trong hộ gia đình
            resident: {
              select: {
                id: true,
                fullname: true,
                nationalId: true,
                phoneNumber: true,
                email: true,
                dateOfBirth: true,
                gender: true,
                relationshipToHead: true,
                residentStatus: true,
                informationStatus: true,
              },
            },
          },
        },
      },
    });
  }
  async resetPassword(id: number) {
    // Tạo token reset
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 giờ

    const user =await this.prisma.users.update({
      where: { id },
      data: { resetToken, resetTokenExpiry },
    });

    // link đến front end
    const resetLink = `http://localhost:3030/auth/reset-password?token=${resetToken}`;

    return await this.mailService.sendMail(
      user.email,
      'Reset your password',
      `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`,
    );
  }
  async getDetailsHouseholdChange(householdId: number){
    return this.prisma.householdChanges.findFirstOrThrow({
      where: {householdId: householdId, informationStatus: InformationStatus.PENDING}
    })
  }

  async approveHouseholdChange(
    userId: number,
    id: number,
    state: InformationStatus,
    reason?: string
  ) {
    if (
      state in [InformationStatus.APPROVED, InformationStatus.REJECTED]
    ) {
      throw new BadRequestException('Invalid approve state');
    }

    if (state === InformationStatus.REJECTED && !reason) {
      throw new BadRequestException('Reject reason is required');
    }

    return this.prisma.$transaction(async (tx) => {
      // update change
      const change = await tx.householdChanges.update({
        where: { id },
        data: {
          reviewAdminId: userId,
          reviewAt: new Date(),
          informationStatus: state,
          rejectReason: reason,
        },
      });

      // update household
      await tx.houseHolds.update({
        where: { id: change.householdId },
        data: {
          informationStatus: state,
        },
      });

      return change;
    });
  }

  async getDetailsResidentChanges(residentId: number) {
    return this.prisma.residentChanges.findFirstOrThrow({
      where: {
        residentId,
        informationStatus: {
          in: [
            InformationStatus.PENDING,
          ],
        },
      },
    });
  }

  async approveResidentChange(
    userId: number,
    id: number,
    state: InformationStatus,
    reason?: string
  ) {
    // reject thì bắt buộc có lý do
    if (state === InformationStatus.REJECTED && !reason) {
      throw new BadRequestException('Reject reason is required');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. update resident change
      const change = await tx.residentChanges.update({
        where: { id },
        data: {
          reviewAdminId: userId,
          reviewAt: new Date(),
          informationStatus: state,
          rejectReason: reason,
        },
      });

      const updateData = {
        informationStatus: state,
        ...(change.action === Actions.DELETE && {
          residentStatus: ResidenceStatus.MOVE_OUT,
        }),
      };


      // 2. update resident
      await tx.resident.update({
        where: { id: change.residentId },
        data: {
          ...updateData
        },
      });

      return change;
    });
  }
  async getSetting(userId: number){
    return this.prisma.users.findFirstOrThrow({
      where: {id: userId},
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      }
    })
  }


  async updateAccount(userId: number, dto: UpdateAccountDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // ✅ check email trùng
    if (dto.email) {
      const emailExists = await this.prisma.users.findFirst({
        where: {
          email: dto.email,
          NOT: { id: userId },
        },
      });

      if (emailExists) {
        throw new BadRequestException('Email already exists');
      }
    }

    // ✅ check username trùng
    if (dto.username) {
      const usernameExists = await this.prisma.users.findFirst({
        where: {
          username: dto.username,
          NOT: { id: userId },
        },
      });

      if (usernameExists) {
        throw new BadRequestException('Username already exists');
      }
    }

    const updateData: any = {};

    if (dto.email) updateData.email = dto.email;
    if (dto.username) updateData.username = dto.username;

    // 🔐 XỬ LÝ ĐỔI MẬT KHẨU
    if (dto.newPassword || dto.oldPassword) {
      // ❌ thiếu 1 trong 2
      if (!dto.oldPassword || !dto.newPassword) {
        throw new BadRequestException(
          'Old password and new password are required',
        );
      }

      // ❌ mật khẩu cũ sai
      const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
      if (!isMatch) {
        throw new BadRequestException('Old password is incorrect');
      }

      // ❌ mật khẩu mới trùng mật khẩu cũ
      const isSame = await bcrypt.compare(dto.newPassword, user.password);
      if (isSame) {
        throw new BadRequestException(
          'New password must be different from old password',
        );
      }

      updateData.password = await bcrypt.hash(dto.newPassword, 10);
    }

    return this.prisma.users.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
      },
    });
  }
  async deleteAccount(userId: number){
    const record = await this.prisma.users.update({
      where: {id: userId},
      data: {state: State.DELETED}
    })
    if(record.householdId) {
      await this.prisma.houseHolds.update({
        where: {id: record.householdId},
        data: {status: HouseHoldStatus.DELETE}
      })
    }
    return record
  }
  async setRole(userId: number, role: Role) {
    const updateData: any = { role };

    if (role !== Role.USER) {
      updateData.state = State.ACTIVE;
    }

    return this.prisma.users.update({
      where: { id: userId },
      data: updateData, // ✅ trực tiếp
    });
  }

}
