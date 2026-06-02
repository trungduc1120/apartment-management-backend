import {
  PrismaClient,
  Gender,
  RelationshipToHead,
  ResidenceStatus,
} from '@prisma/client';
import {en, Faker, vi} from '@faker-js/faker';
import * as bcrypt from "bcrypt";

const faker = new Faker({
  locale: [vi, en],
});

const prisma = new PrismaClient();

const provinces = ['Nghệ An', 'Hà Nội', 'Vĩnh Phúc'];
const numCars = faker.number.int({ min: 0, max: 2 });
const numMotorbike = faker.number.int({ min: 1, max: 2 });
const nghe = [
  'Kỹ sư',
  'Công nhân',
  'Giáo viên',
  'Nhân viên văn phòng',
  'Kinh doanh tự do',
  'Nông dân',
]
const age = {
  min: 25,
  max: 65,
  mode: 'age',
}
const phonePost = [
  '03',
  '05',
  '07',
  '08',
  '09',
]

const relations = [
  RelationshipToHead.WIFE,
  RelationshipToHead.HUSBAND,
  RelationshipToHead.SON,
  RelationshipToHead.DAUGHTER,
  RelationshipToHead.FATHER,
  RelationshipToHead.MOTHER,
  RelationshipToHead.OTHER,
];


async function main() {
  // 🔥 RESET (đúng thứ tự FK)
  await prisma.payment.deleteMany();
  await prisma.feeAssignment.deleteMany();
  await prisma.temporaryResident.deleteMany();
  await prisma.temporaryAbsence.deleteMany();
  await prisma.residentChanges.deleteMany();
  await prisma.householdChanges.deleteMany();
  await prisma.resident.deleteMany({
    where: {relationshipToHead: {not: RelationshipToHead.HEAD}}
  });
  await prisma.houseHolds.deleteMany();
  await prisma.resident.deleteMany({
    where: {relationshipToHead: RelationshipToHead.HEAD}
  });
  await prisma.users.deleteMany(); //giu tai khoan admin

  const password = await bcrypt.hash('123456', 10)

  await prisma.users.create({
    data: {
      username: 'admin',
      email: 'admin@gmail.com',
      password, // demo
      role: 'ADMIN',
      state: "ACTIVE",
    },
  });

  await prisma.users.create({
    data: {
      username: 'user',
      email: 'user@gmail.com',
      password, // demo
      role: 'USER',
    },
  });

  await prisma.users.create({
    data: {
      username: 'accountant',
      email: 'accountant@gmail.com',
      password, // demo
      role: 'ACCOUNTANT',
      state: "ACTIVE",
    },
  });


  for (let i = 0; i < 40; i++) {
    // 1️⃣ USER
    const user = await prisma.users.create({
      data: {
        username: faker.internet.username(),
        email: faker.internet.email(),
        password, // demo
        role: 'USER',
        state: "ACTIVE",
      },
    });

    const head = await prisma.resident.create({
      data: {
        // CCCD 12 số (VN)
        nationalId: faker.number
          .int({min: 100000000000, max: 999999999999})
          .toString(),

        // SĐT VN
        phoneNumber: faker.helpers.arrayElement(phonePost)
          + faker.number.int({min: 10000000, max: 99999999}),

        email: faker.internet.email(),

        fullname: faker.person.fullName(),

        // Tuổi 25–65 (hợp lý cho chủ hộ)
        dateOfBirth: faker.date.birthdate({
          min: 25,
          max: 65,
          mode: 'age',
        }),

        gender: faker.helpers.arrayElement([Gender.MALE, Gender.FEMALE]),

        relationshipToHead: RelationshipToHead.HEAD,

        placeOfOrigin: faker.helpers.arrayElement(provinces),

        occupation: faker.helpers.arrayElement(nghe),

        workingAdress: faker.location.streetAddress(),
      },
    });

    // 2️⃣ HOUSEHOLD (1–1 với user)
    const household = await prisma.houseHolds.create({
      data: {
        houseHoldCode: 1000 + i,
        apartmentNumber: `A-${100 + i}`,
        buildingNumber: `Tòa ${faker.number.int({min: 1, max: 10})}`,
        street: faker.location.street(),
        ward: `Phường ${faker.location.city()}`,
        province: faker.helpers.arrayElement(provinces),
        numCars,
        numMotorbike,
        headID: head.id,
        userID: user.id,
      },
    });

    await prisma.resident.update({
      where: {id: head.id},
      data: {houseHoldId: household.id}
    })

    // 3️⃣ RESIDENT (2–4 người)
    const residentCount = faker.number.int({min: 2, max: 4});

    for (let r = 1; r < residentCount; r++) {
      await prisma.resident.create({
        data: {
          // CCCD 12 số
          nationalId: faker.number
            .int({min: 100000000000, max: 999999999999})
            .toString(),

          // SĐT VN
          phoneNumber:
            faker.helpers.arrayElement(['03', '05', '07', '08', '09']) +
            faker.number.int({min: 10000000, max: 99999999}),

          email: faker.internet.email(),

          fullname: faker.person.fullName(),

          dateOfBirth: faker.date.birthdate({
            min: 1,
            max: 70,
            mode: 'age',
          }),

          gender: faker.helpers.arrayElement([Gender.MALE, Gender.FEMALE]),

          relationshipToHead: faker.helpers.arrayElement(relations),

          placeOfOrigin: faker.helpers.arrayElement(provinces),

          occupation: faker.helpers.arrayElement([
            'Học sinh',
            'Sinh viên',
            'Công nhân',
            'Nhân viên văn phòng',
            'Kinh doanh tự do',
            'Nội trợ',
          ]),

          workingAdress: faker.location.streetAddress(),
          houseHoldId: household.id, // 🔗 gắn vào hộ
        },
      });
    }
  }
  console.log('Seed xong 40 user + hộ gia đình demo');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
