import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting card usage seed...');

  // 샘플 카드 내역 3건 생성
  const cardUsages = await prisma.cardUsage.createMany({
    data: [
      {
        transDate: new Date('2024-02-15'),
        processStatus: '01',
        approvalDatetime: new Date('2024-02-15T14:30:00'),
        buyDate: new Date('2024-02-15'),
        chargeDate: new Date('2024-03-10'),
        cardNo: '1234-****-****-5678',
        cardOwnerEmpNo: '12345',
        cardOwnerEmpName: '홍길동',
        cardOwnerEmpOrgCode: 'ORG001',
        cardOwnerEmpOrgName: '개발팀',
        cardIssuerCode: 'CARD01',
        cardIssuerName: '신한카드',
        approvalNo: 'APP001',
        currency: 'KRW',
        supplyAmt: 45454.55,
        taxAmt: 4545.45,
        totalAmt: 50000,
        krwAmt: 50000,
        deductibleYn: true,
        abroadUseYn: false,
        supplierNo: 'SUP001',
        supplierName: '스타벅스 강남점',
        industryCode: 'IND1',
        industryName: '커피전문점',
        industryType: '1',
      },
      {
        transDate: new Date('2024-02-16'),
        processStatus: '01',
        approvalDatetime: new Date('2024-02-16T18:20:00'),
        buyDate: new Date('2024-02-16'),
        chargeDate: new Date('2024-03-10'),
        cardNo: '1234-****-****-5678',
        cardOwnerEmpNo: '12345',
        cardOwnerEmpName: '홍길동',
        cardOwnerEmpOrgCode: 'ORG001',
        cardOwnerEmpOrgName: '개발팀',
        cardIssuerCode: 'CARD01',
        cardIssuerName: '신한카드',
        approvalNo: 'APP002',
        currency: 'KRW',
        supplyAmt: 90909.09,
        taxAmt: 9090.91,
        totalAmt: 100000,
        krwAmt: 100000,
        deductibleYn: true,
        abroadUseYn: false,
        supplierNo: 'SUP002',
        supplierName: '올리브영 역삼점',
        industryCode: 'IND2',
        industryName: '화장품소매',
        industryType: '2',
      },
      {
        transDate: new Date('2024-02-17'),
        processStatus: '01',
        approvalDatetime: new Date('2024-02-17T12:10:00'),
        buyDate: new Date('2024-02-17'),
        chargeDate: new Date('2024-03-10'),
        cardNo: '1234-****-****-5678',
        cardOwnerEmpNo: '12345',
        cardOwnerEmpName: '홍길동',
        cardOwnerEmpOrgCode: 'ORG001',
        cardOwnerEmpOrgName: '개발팀',
        cardIssuerCode: 'CARD01',
        cardIssuerName: '신한카드',
        approvalNo: 'APP003',
        currency: 'KRW',
        supplyAmt: 13636.36,
        taxAmt: 1363.64,
        totalAmt: 15000,
        krwAmt: 15000,
        deductibleYn: false,
        abroadUseYn: false,
        supplierNo: 'SUP003',
        supplierName: '카카오택시',
        industryCode: 'IND3',
        industryName: '택시운송',
        industryType: '3',
      },
    ],
    skipDuplicates: true,
  });

  console.log(`✅ ${cardUsages.count} card usages created`);

  // 각 카드 내역에 대한 Detail도 생성 (type='1')
  const cardUsageList = await prisma.cardUsage.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' },
  });

  for (const cardUsage of cardUsageList) {
    await prisma.detail.create({
      data: {
        type: '1', // 카드
        cardUsageId: cardUsage.id,
        settlementAmt: cardUsage.totalAmt,
        supplyAmt: cardUsage.supplyAmt,
        taxAmt: cardUsage.taxAmt,
        deductibleYn: cardUsage.deductibleYn,
      },
    });
  }

  console.log(`✅ ${cardUsageList.length} details created for card usages`);
  console.log('Card usage seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });