import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

type Role =
  | 'OWNER'
  | 'IMPLEMENTER'
  | 'CUSTOMER_ADMIN'
  | 'CUSTOMER_USER'
  | 'VIEWER';

const db = new PrismaClient();

const DEMO_PASSWORD = 'Demo!2026';

async function main() {
  console.log('🌱 Seeding Implementation Portal…');

  await db.auditLog.deleteMany();
  await db.projectChecklistItem.deleteMany();
  await db.project.deleteMany();
  await db.checklistTemplateItem.deleteMany();
  await db.checklistTemplate.deleteMany();
  await db.user.deleteMany();
  await db.organization.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const vendor = await db.organization.create({
    data: { name: 'Northstar Software', type: 'VENDOR' }
  });

  const acme = await db.organization.create({
    data: { name: 'Acme Manufacturing', type: 'CUSTOMER' }
  });

  const globex = await db.organization.create({
    data: { name: 'Globex Logistics', type: 'CUSTOMER' }
  });

  const users: { email: string; name: string; role: Role; orgId: string }[] = [
    { email: 'owner@vendor.example', name: 'אורן בעלים', role: 'OWNER', orgId: vendor.id },
    { email: 'rivka@vendor.example', name: 'רבקה כהן', role: 'IMPLEMENTER', orgId: vendor.id },
    { email: 'admin@acme.example', name: 'אריאל אדמין', role: 'CUSTOMER_ADMIN', orgId: acme.id },
    { email: 'maria@acme.example', name: 'מריה לוי', role: 'CUSTOMER_USER', orgId: acme.id },
    { email: 'devops@acme.example', name: 'יואב דבאופס', role: 'CUSTOMER_USER', orgId: acme.id },
    { email: 'admin@globex.example', name: 'גלית גלובקס', role: 'CUSTOMER_ADMIN', orgId: globex.id },
    { email: 'auditor@vendor.example', name: 'דנה ביקורת', role: 'VIEWER', orgId: vendor.id }
  ];

  const created = await Promise.all(
    users.map((u) =>
      db.user.create({
        data: {
          email: u.email,
          name: u.name,
          role: u.role,
          organizationId: u.orgId,
          passwordHash
        }
      })
    )
  );

  const owner = created.find((u) => u.email === 'owner@vendor.example')!;
  const rivka = created.find((u) => u.email === 'rivka@vendor.example')!;
  const acmeAdmin = created.find((u) => u.email === 'admin@acme.example')!;

  const saasTemplate = await db.checklistTemplate.create({
    data: {
      name: 'הטמעת SaaS סטנדרטית',
      description:
        'תהליך onboarding מלא עבור לקוחות SaaS חדשים, כולל הקמת חשבון, אינטגרציות, ואימות.',
      items: {
        create: [
          {
            order: 1,
            kind: 'INFO',
            title: 'ברוכים הבאים לתהליך ההטמעה',
            description:
              'בעמוד הזה תקבלו סקירה כללית של מה שמחכה. ההטמעה המלאה אורכת בדרך כלל 2-3 שבועות, ומחולקת ל-7 שלבים מודרכים.\n\nבכל שלב תוכלו לעצור, לחזור, או לבקש עזרה. כל פעולה נרשמת לצורכי תאימות.'
          },
          {
            order: 2,
            kind: 'FORM',
            title: 'איסוף פרטי הארגון',
            description:
              'מלאו את שם החברה הרשמי, ע.מ./ח.פ., דומיין ראשי וכתובת אימייל לחשבונית. הפרטים האלו ישמשו את כל ההסכמים העתידיים.',
            requiredRole: 'CUSTOMER_ADMIN'
          },
          {
            order: 3,
            kind: 'TASK',
            title: 'יצירת חשבון בסביבת ייצור',
            description:
              'צוות ההטמעה אצלנו ייצור את החשבון ויעביר אליכם את פרטי הכניסה הראשונים.',
            requiredRole: 'IMPLEMENTER'
          },
          {
            order: 4,
            kind: 'UPLOAD',
            title: 'העלאת לוגו ונכסי מותג',
            description:
              'העלו את הלוגו (SVG מועדף, או PNG בשקיפות) ואת ערכת הצבעים שלכם. הם יופיעו בכל מסכי המערכת ובהתראות מייל ללקוחות שלכם.',
            requiredRole: 'CUSTOMER_ADMIN'
          },
          {
            order: 5,
            kind: 'FORM',
            title: 'הגדרת אינטגרציה עם SSO',
            description:
              'מלאו את metadata-XML של ה-IdP, או ספקו URL ציבורי. נתמוך ב-SAML 2.0 ו-OIDC. אם אין SSO — אפשר לדלג בשלב הבא.',
            requiredRole: 'CUSTOMER_ADMIN'
          },
          {
            order: 6,
            kind: 'TASK',
            title: 'יבוא רשימת משתמשים ראשונית',
            description:
              'יבוא של עד 100 משתמשים מ-CSV או הקצאה ידנית. תוכלו תמיד להוסיף משתמשים בהמשך.'
          },
          {
            order: 7,
            kind: 'APPROVAL',
            title: 'אישור Go-Live',
            description:
              'לאחר שכל הצדדים בדקו, מנהל הלקוח מאשר את עליית המערכת לאוויר. שלב זה מסיים את הפרויקט ומפעיל את חשבון הלקוח.',
            requiredRole: 'CUSTOMER_ADMIN'
          }
        ]
      }
    },
    include: { items: true }
  });

  const securityTemplate = await db.checklistTemplate.create({
    data: {
      name: 'מסלול תאימות אבטחה',
      description:
        'תוספת לפרויקטים שדורשים תאימות אבטחה מוגברת — IP allowlists, audit, MFA כפוי.',
      items: {
        create: [
          {
            order: 1,
            kind: 'INFO',
            title: 'דרישות תאימות',
            description:
              'בפרויקט הזה נשלים גם את שלבי האבטחה המוגברים — חובה לפני go-live של ארגונים פיננסיים או רפואיים.'
          },
          {
            order: 2,
            kind: 'FORM',
            title: 'הגדרת IP allowlist',
            description: 'הזינו טווחי CIDR מורשים לגישה לממשק הניהול.',
            requiredRole: 'CUSTOMER_ADMIN'
          },
          {
            order: 3,
            kind: 'APPROVAL',
            title: 'הפעלת MFA כפוי לכל המשתמשים',
            description:
              'אישור הלקוח להפעלת MFA חובה. לא ניתן לבטל לאחר ההפעלה ללא בקשה רשמית.',
            requiredRole: 'CUSTOMER_ADMIN'
          },
          {
            order: 4,
            kind: 'UPLOAD',
            title: 'העלאת מסמך מדיניות אבטחת מידע',
            description:
              'מסמך המדיניות הארגוני שלכם, יישמר בארכיון לצורכי ביקורת.',
            requiredRole: 'CUSTOMER_ADMIN'
          }
        ]
      }
    },
    include: { items: true }
  });

  // Project 1: Acme - SaaS, partially completed
  const acmeProject = await db.project.create({
    data: {
      name: 'Acme – הטמעת Q4',
      customerOrgId: acme.id,
      ownerId: rivka.id,
      templateId: saasTemplate.id,
      status: 'ACTIVE',
      startDate: daysAgo(14),
      targetDate: daysFromNow(14),
      items: {
        create: saasTemplate.items.map((ti) => ({
          templateItemId: ti.id,
          order: ti.order,
          status: 'PENDING'
        }))
      }
    },
    include: { items: { include: { templateItem: true }, orderBy: { order: 'asc' } } }
  });

  await db.projectChecklistItem.update({
    where: { id: acmeProject.items[0].id },
    data: {
      status: 'COMPLETED',
      completedAt: daysAgo(13),
      completedById: acmeAdmin.id
    }
  });
  await db.projectChecklistItem.update({
    where: { id: acmeProject.items[1].id },
    data: {
      status: 'COMPLETED',
      completedAt: daysAgo(10),
      completedById: acmeAdmin.id,
      payload: JSON.stringify({
        legalName: 'Acme Manufacturing Ltd.',
        domain: 'acme.example',
        billingEmail: 'finance@acme.example'
      })
    }
  });
  await db.projectChecklistItem.update({
    where: { id: acmeProject.items[2].id },
    data: {
      status: 'COMPLETED',
      completedAt: daysAgo(7),
      completedById: rivka.id,
      assignedToId: rivka.id,
      notes: 'חשבון נוצר. פרטי כניסה נשלחו במייל מאובטח.'
    }
  });
  await db.projectChecklistItem.update({
    where: { id: acmeProject.items[3].id },
    data: {
      status: 'IN_PROGRESS',
      assignedToId: acmeAdmin.id,
      notes: 'מחכים לקובץ הלוגו מהמיתוג.'
    }
  });

  // Project 2: Globex - Security, just started
  await db.project.create({
    data: {
      name: 'Globex – תאימות אבטחה',
      customerOrgId: globex.id,
      ownerId: owner.id,
      templateId: securityTemplate.id,
      status: 'DRAFT',
      targetDate: daysFromNow(30),
      items: {
        create: securityTemplate.items.map((ti) => ({
          templateItemId: ti.id,
          order: ti.order,
          status: 'PENDING'
        }))
      }
    }
  });

  // Project 3: Acme - completed
  const oldAcme = await db.project.create({
    data: {
      name: 'Acme – פיילוט מחלקת מכירות',
      customerOrgId: acme.id,
      ownerId: rivka.id,
      templateId: saasTemplate.id,
      status: 'COMPLETED',
      startDate: daysAgo(120),
      targetDate: daysAgo(60),
      items: {
        create: saasTemplate.items.map((ti) => ({
          templateItemId: ti.id,
          order: ti.order,
          status: 'COMPLETED',
          completedAt: daysAgo(70),
          completedById: rivka.id
        }))
      }
    }
  });

  await db.auditLog.createMany({
    data: [
      {
        action: 'PROJECT_CREATED',
        actorId: rivka.id,
        actorEmail: rivka.email,
        resourceType: 'Project',
        resourceId: acmeProject.id,
        occurredAt: daysAgo(14),
        metadata: JSON.stringify({ name: acmeProject.name, templateId: saasTemplate.id })
      },
      {
        action: 'USER_LOGIN',
        actorId: acmeAdmin.id,
        actorEmail: acmeAdmin.email,
        resourceType: 'User',
        resourceId: acmeAdmin.id,
        occurredAt: daysAgo(13),
        ipAddress: '203.0.113.42'
      },
      {
        action: 'ITEM_COMPLETED',
        actorId: acmeAdmin.id,
        actorEmail: acmeAdmin.email,
        resourceType: 'ProjectChecklistItem',
        resourceId: acmeProject.items[1].id,
        occurredAt: daysAgo(10),
        metadata: JSON.stringify({ title: 'איסוף פרטי הארגון', from: 'PENDING', to: 'COMPLETED' })
      },
      {
        action: 'PROJECT_STATUS_CHANGED',
        actorId: rivka.id,
        actorEmail: rivka.email,
        resourceType: 'Project',
        resourceId: acmeProject.id,
        occurredAt: daysAgo(10),
        metadata: JSON.stringify({ from: 'DRAFT', to: 'ACTIVE' })
      },
      {
        action: 'USER_LOGIN_FAILED',
        actorEmail: 'attacker@bad.example',
        resourceType: 'User',
        occurredAt: daysAgo(2),
        ipAddress: '198.51.100.7',
        metadata: JSON.stringify({ reason: 'unknown_or_inactive' })
      },
      {
        action: 'PROJECT_STATUS_CHANGED',
        actorId: rivka.id,
        actorEmail: rivka.email,
        resourceType: 'Project',
        resourceId: oldAcme.id,
        occurredAt: daysAgo(60),
        metadata: JSON.stringify({ to: 'COMPLETED', trigger: 'all_items_done' })
      }
    ]
  });

  console.log('✅ Seed complete.');
  console.log('');
  console.log('Demo accounts (password = Demo!2026):');
  for (const u of users) {
    console.log(`  • ${u.email.padEnd(28)}  ${u.role}`);
  }
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 3600 * 1000);
}

function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 3600 * 1000);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
