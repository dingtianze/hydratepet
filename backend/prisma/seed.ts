import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed badge definitions
  const badges = [
    {
      key: 'first_record',
      name: '首次打卡',
      description: '完成第一次饮水记录',
      iconUrl: '🎉',
      rarity: 'common',
      conditionType: 'total_records',
      conditionValue: JSON.stringify({ min: 1 }),
      sortOrder: 1,
    },
    {
      key: 'three_day_streak',
      name: '三日燃',
      description: '连续3天达标',
      iconUrl: '🔥',
      rarity: 'common',
      conditionType: 'streak_days',
      conditionValue: JSON.stringify({ min: 3 }),
      sortOrder: 10,
    },
    {
      key: 'week_streak',
      name: '周周赞',
      description: '连续7天达标',
      iconUrl: '⚡',
      rarity: 'rare',
      conditionType: 'streak_days',
      conditionValue: JSON.stringify({ min: 7 }),
      sortOrder: 20,
    },
    {
      key: 'month_streak',
      name: '月冠军',
      description: '连续30天达标',
      iconUrl: '🏆',
      rarity: 'epic',
      conditionType: 'streak_days',
      conditionValue: JSON.stringify({ min: 30 }),
      sortOrder: 30,
    },
    {
      key: 'water_master',
      name: '喝水王者',
      description: '连续100天达标',
      iconUrl: '👑',
      rarity: 'legendary',
      conditionType: 'streak_days',
      conditionValue: JSON.stringify({ min: 100 }),
      sortOrder: 40,
    },
  ];

  for (const badge of badges) {
    await prisma.badgeDef.upsert({
      where: { key: badge.key },
      update: badge,
      create: badge,
    });
  }

  // Seed title definitions
  const titles = [
    {
      key: 'desert_camel',
      name: '沙漠驼驼',
      description: '连续3天饮水不足500ml',
      icon: '🏜️',
      category: 'volume',
      conditionType: 'low_intake_streak',
      conditionValue: JSON.stringify({ days: 3, maxAmount: 500 }),
      sortOrder: 1,
    },
    {
      key: 'cactus',
      name: '仙人掌',
      description: '偶尔喝水但活得很好',
      icon: '🌵',
      category: 'habit',
      conditionType: 'irregular_pattern',
      conditionValue: JSON.stringify({ minDays: 7 }),
      sortOrder: 2,
    },
    {
      key: 'shallow_fish',
      name: '浅水鱼',
      description: '每天达标但不规律',
      icon: '🐠',
      category: 'volume',
      conditionType: 'goal_reached_irregular',
      conditionValue: JSON.stringify({ minDays: 7 }),
      sortOrder: 5,
    },
    {
      key: 'deep_sea_master',
      name: '深海霸主',
      description: '连续30天达标',
      icon: '🌊',
      category: 'streak',
      conditionType: 'consecutive_goal',
      conditionValue: JSON.stringify({ days: 30 }),
      sortOrder: 30,
    },
    {
      key: 'ice_beauty',
      name: '冰山美人',
      description: '只喝冰水',
      icon: '🧊',
      category: 'habit',
      conditionType: 'cold_water_only',
      conditionValue: JSON.stringify({ minDays: 7 }),
      sortOrder: 10,
    },
    {
      key: 'coffee_addict',
      name: '咖啡续命',
      description: '咖啡计入饮水量的天数>50%',
      icon: '☕',
      category: 'habit',
      conditionType: 'coffee_majority',
      conditionValue: JSON.stringify({ percentage: 50 }),
      sortOrder: 11,
    },
    {
      key: 'water_machine',
      name: '喝水机器',
      description: '连续7天准点喝水',
      icon: '⏰',
      category: 'consistency',
      conditionType: 'consistent_timing',
      conditionValue: JSON.stringify({ days: 7, tolerance: 15 }),
      sortOrder: 20,
    },
    {
      key: 'early_bird',
      name: '早鸟',
      description: '连续7天上午完成50%目标',
      icon: '🌅',
      category: 'consistency',
      conditionType: 'early_completion',
      conditionValue: JSON.stringify({ days: 7, percentage: 50 }),
      sortOrder: 21,
    },
    {
      key: 'night_owl',
      name: '夜猫子',
      description: '连续3天晚上22点后喝水',
      icon: '🦉',
      category: 'habit',
      conditionType: 'night_drinking',
      conditionValue: JSON.stringify({ days: 3, afterHour: 22 }),
      sortOrder: 12,
    },
    {
      key: 'sniper',
      name: '狙击手',
      description: '单次饮水恰好达到目标值',
      icon: '🎯',
      category: 'special',
      conditionType: 'exact_amount',
      conditionValue: JSON.stringify({}),
      sortOrder: 50,
    },
  ];

  for (const title of titles) {
    await prisma.titleDef.upsert({
      where: { key: title.key },
      update: title,
      create: title,
    });
  }

  console.log('✅ Badge & Title seeding completed!');

  // Seed admin/demo user for testing
  console.log('👤 Creating admin test user...');
  
  const adminPhone = '13800138000';
  const existingAdmin = await prisma.user.findUnique({
    where: { phone: adminPhone },
  });

  if (!existingAdmin) {
    const adminResult = await prisma.$transaction(async (tx) => {
      // Create admin user
      const user = await tx.user.create({
        data: {
          authType: 'phone',
          phone: adminPhone,
          nickname: '测试管理员',
          weight: 70,
          gender: 'male',
          workStart: '09:00',
          workEnd: '18:00',
          dailyGoal: 2500,
        },
      });

      // Create pet for admin
      const pet = await tx.pet.create({
        data: {
          userId: user.id,
          name: '小水滴',
          stage: 'baby',
          growth: 25,
          mood: 'happy',
          health: 95,
        },
      });

      // Create reminder config
      await tx.reminderConfig.create({
        data: {
          userId: user.id,
          enabled: true,
          intervals: ['09:30', '11:00', '14:00', '16:00', '17:00'],
        },
      });

      return { user, pet };
    });

    console.log(`✅ Admin user created:`);
    console.log(`   Phone: ${adminPhone}`);
    console.log(`   User ID: ${adminResult.user.id}`);
    console.log(`   Pet: ${adminResult.pet.name} (${adminResult.pet.stage})`);
  } else {
    console.log('ℹ️ Admin user already exists');
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
