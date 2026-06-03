# Implementation Portal

פורטל onboarding ללקוחות שהופך checklists של הטמעה לחוויית מוצר מודרכת — עם RBAC, REST API, ומסלול ביקורת מלא (audit trail).

> **TL;DR**: לקוח מוזמן לפורטל, רואה רק את הפרויקט שלו, מתקדם שלב-אחר-שלב לפי תבנית checklist שצוות ההטמעה הגדיר. כל פעולה (התחברות, עדכון סטטוס, ניסיון גישה אסור) נרשמת ב-AuditLog. אינטגרציות חיצוניות עובדות מול אותה לוגיקה דרך REST API מאובטח.

---

## תכונות עיקריות

- **תבניות checklist לשימוש חוזר** — צרו playbook אחד והפעילו אותו על כל לקוח חדש.
- **חוויה מודרכת step-by-step** — הלקוח רואה איפה הוא נמצא, מה השלב הבא, ומה התקדם.
- **5 רמות הרשאה (RBAC)** — `OWNER`, `IMPLEMENTER`, `CUSTOMER_ADMIN`, `CUSTOMER_USER`, `VIEWER`. שלבים בודדים יכולים לדרוש רמת הרשאה מינימלית.
- **בידוד tenancy** — לקוח רואה רק את הארגון שלו; ספק רואה הכול. נאכף בכל endpoint.
- **REST API מלא** תחת `/api/v1/*` — auth, projects, items, templates, users, audit. תמיכה ב-Bearer tokens ובקוקיז במקביל.
- **Audit trail מלא** — לוגיני success/failure, יצירת פרויקטים, שינויי סטטוס, גישה שנדחתה — כולל IP, user-agent, ו-`via=rest|web`.
- **תפעול אוטומטי** — פרויקט עובר ל-`ACTIVE` ברגע שהשלב הראשון מתחיל, ול-`COMPLETED` כשכל המשימות סגורות.
- **UI מודרני בעברית עם RTL מלא** — Tailwind, lucide-react, ועיצוב מהוקצע.

---

## ערימת הטכנולוגיות

| שכבה | טכנולוגיה |
|---|---|
| Runtime | **Node.js** 20+ |
| Framework | **Next.js** 14 (App Router) + TypeScript |
| Database | **PostgreSQL** 16 + Prisma ORM (migrations) |
| **Auth** | JWT (jose) + bcryptjs · cookies לדפדפן + Bearer token ל-REST |
| **REST API** | Next.js Route Handlers תחת `/api/v1/*`, JSON אחיד, Zod validation |
| UI | Tailwind CSS + lucide-react + React Server Actions |

---

## הקמה מקומית

### דרישות

- Node.js 20+
- Docker Desktop (ל-Postgres מקומי)

### צעדים

```bash
cd implementation-portal
npm install
copy .env.example .env       # PowerShell: cp ב-bash
npm run setup                # docker compose up + prisma migrate + seed
npm run dev
```

הפורטל יעלה בכתובת `http://localhost:3000`.

הסקריפט `setup` מריץ ברצף:
1. `docker compose up -d db` — מעלה Postgres מקומי בפורט 5544
2. `prisma generate` + `prisma migrate deploy` — מסנכרן את הסכמה
3. `tsx prisma/seed.ts` — זורע נתוני דמו

### עצירה

```bash
npm run db:down              # עוצר את container ה-Postgres (הנתונים נשמרים ב-volume)
```

---

## חשבונות דמו

כל החשבונות חולקים את הסיסמה: **`Demo!2026`**

| מייל | תפקיד | מי |
|---|---|---|
| `owner@vendor.example` | OWNER | בעלים – Northstar (הספק) |
| `rivka@vendor.example` | IMPLEMENTER | אשת הטמעה – Northstar |
| `auditor@vendor.example` | VIEWER | מבקרת תאימות |
| `admin@acme.example` | CUSTOMER_ADMIN | מנהל מצד הלקוח Acme |
| `maria@acme.example` | CUSTOMER_USER | משתמשת קצה ב-Acme |
| `devops@acme.example` | CUSTOMER_USER | DevOps ב-Acme |
| `admin@globex.example` | CUSTOMER_ADMIN | מנהל מצד הלקוח Globex |

---

## REST API

כל ה-endpoints חיים תחת `/api/v1/*` ומחזירים JSON בפורמט אחיד:

```json
{ "ok": true, "data": <result> }
{ "ok": false, "error": { "code": "...", "message": "...", "details": [...] } }
```

### Auth — שני מסלולים נתמכים

ניתן להזדהות מול ה-API ב-2 דרכים, וכל route תקבל את שתיהן:

1. **Cookie** (שמשמש את ה-UI) — `POST /api/v1/auth/login` שולח `Set-Cookie: ip_session`.
2. **Bearer token** (ל-clients חיצוניים) — אותה תשובה כוללת `data.token` שאפשר לשלוח ב-`Authorization: Bearer <token>`.

### תיעוד ה-endpoints

| Method | Path | תיאור | הרשאה |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | התחברות. גוף: `{email, password}`. מחזיר token + user. | public |
| `POST` | `/api/v1/auth/logout` | מנקה cookie ורושם USER_LOGOUT. | any |
| `GET` | `/api/v1/auth/me` | פרטי המשתמש המחובר + ארגון. | any |
| `GET` | `/api/v1/projects` | רשימת פרויקטים. query: `status`, `customerOrgId`. לקוח מקבל רק את הארגון שלו. | `project:view` |
| `POST` | `/api/v1/projects` | יצירת פרויקט מתבנית. גוף: `{name, customerOrgId, templateId, ownerId, targetDate?}`. | `project:create` |
| `GET` | `/api/v1/projects/{id}` | פרטי פרויקט מלאים, כולל `items[]`. | `project:view` (+tenant) |
| `PATCH` | `/api/v1/projects/{id}` | עדכון `name`/`status`/`ownerId`/`targetDate`. | `project:update` |
| `DELETE` | `/api/v1/projects/{id}` | מחיקת פרויקט. רושם `PROJECT_DELETED`. | `project:delete` (OWNER) |
| `GET` | `/api/v1/projects/{id}/items` | רשימת המשימות של הפרויקט. | `project:view` (+tenant) |
| `GET` | `/api/v1/items/{id}` | פרטי משימה בודדת. | tenant of project |
| `PATCH` | `/api/v1/items/{id}` | עדכון `status`/`notes`/`payload`/`assignedToId`. בודק `requiredRole`. מפעיל state-machine אוטומטי. | tenant + role-required |
| `GET` | `/api/v1/templates` | רשימת תבניות עם ספירות. | `project:view` |
| `POST` | `/api/v1/templates` | יצירת תבנית חדשה. | `template:manage` |
| `GET` | `/api/v1/users` | רשימת משתמשים. CUSTOMER_ADMIN רואה רק את הארגון שלו. | `user:manage` |
| `GET` | `/api/v1/audit` | יומן ביקורת עם paging. query: `action`, `actorId`, `resourceType`, `resourceId`, `since`, `limit`, `cursor`. | `audit:view` |

### דוגמאות `curl`

```bash
# 1. כניסה וקבלת Bearer token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"owner@vendor.example","password":"Demo!2026"}' \
  | jq -r .data.token)

# 2. רשימת פרויקטים
curl -s http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. עדכון סטטוס משימה
curl -s -X PATCH http://localhost:3000/api/v1/items/<itemId> \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"COMPLETED","notes":"done!"}' | jq

# 4. שליפת 50 האירועים האחרונים ביומן הביקורת
curl -s 'http://localhost:3000/api/v1/audit?limit=50' \
  -H "Authorization: Bearer $TOKEN" | jq
```

### קודי שגיאה

| HTTP | code | מתי |
|---|---|---|
| 400 | `BAD_JSON` | גוף הבקשה לא JSON תקין |
| 401 | `UNAUTHENTICATED` | אין token / cookie תקין |
| 401 | `INVALID_CREDENTIALS` | מייל/סיסמה שגויים |
| 403 | `FORBIDDEN` | חסרה הרשאה |
| 404 | `NOT_FOUND` | מזהה לא קיים *או* גישה חוצת-tenant |
| 422 | `VALIDATION_ERROR` | Zod schema נכשלה. `details` מכיל list עם `path` + `message` |
| 429 | `RATE_LIMITED` | יותר מדי ניסיונות התחברות. כולל header `Retry-After` (שניות) |
| 500 | `INTERNAL_ERROR` | שגיאה לא צפויה |

---

## תפעול והקשחה (Ops & Hardening)

- **Health probe** — `GET /api/health` (ללא auth) מחזיר `200` כש-DB זמין, `503` אחרת. מתאים ל-Kubernetes liveness/readiness ולמוניטורים:
  ```json
  { "status": "ok", "checks": { "database": "up" }, "uptimeSeconds": 42, "timestamp": "..." }
  ```
- **Rate limiting על התחברות** — עד 8 ניסיונות לכל `(email + IP)` בחלון של 10 דקות, גם ב-UI וגם ב-REST. חריגה מחזירה `429` עם `Retry-After`, ונרשמת ב-audit עם `reason: rate_limited`. התחברות מוצלחת מאפסת את המונה (`src/lib/rate-limit.ts`). למספר instances — יש להחליף ל-Redis בלי לשנות את ה-call sites.
- **ולידציית סביבה (fail-fast)** — `src/lib/env.ts` מאמת את `DATABASE_URL`, `AUTH_SECRET` (≥32 תווים) ו-`SESSION_MAX_AGE_HOURS` בהפעלה, עם הודעה אחת ברורה במקום כשל עמוק בזמן בקשה.
- **Security headers** — `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, וכיבוי `X-Powered-By` (`next.config.mjs`).
- **לוגיקת auth מאוחדת** — גם ה-Server Action וגם `POST /api/v1/auth/login` עוברים דרך `authenticateCredentials()` אחד (`src/lib/authenticate.ts`), כך שאין סחיפה (drift) בין השניים.

---

## בדיקות (Tests)

חבילת בדיקות **Vitest** ממוקדת בלוגיקה הקריטית — 97 בדיקות ב-5 קבצים תחת `src/lib/__tests__/`:

| קובץ | מה נבדק |
|---|---|
| `rbac.test.ts` | מטריצת ההרשאות המלאה (כל role × כל permission), role ranking, `requirePermission`, ובידוד תפקיד לא מוכר |
| `rate-limit.test.ts` | חלון מחליק, ספירת `remaining`, פקיעת hits ישנים, `Retry-After`, בידוד בין מפתחות, ו-`reset` |
| `authenticate.test.ts` | הנתיב הרגיש: הצלחה (token + cookie + audit), משתמש לא קיים/מושבת, סיסמה שגויה, brute-force → `RATE_LIMITED`, ואיפוס המונה אחרי הצלחה (עם DB/audit מ-mock) |
| `validation.test.ts` | סכמות Zod: login, יצירת פרויקט (כולל coercion של תאריך), עדכון סטטוס משימה |
| `format.test.ts` | `progressPercent` (כולל חלוקה באפס), פורמט תאריכים, ומפות תוויות |

```bash
npm run test           # הרצה חד-פעמית
npm run test:watch     # מצב watch
```

הבדיקות אינן דורשות DB או רשת — collaborators עם תופעות לוואי מ-mock, וה-rate limiter (לוגיקה טהורה) נבדק אמיתי.

---

## מודל הנתונים

```
Organization (VENDOR | CUSTOMER)
   ├── User (role: OWNER/IMPLEMENTER/CUSTOMER_ADMIN/CUSTOMER_USER/VIEWER)
   └── Project (CUSTOMER orgs only)
        ├── ChecklistTemplate (re-usable playbook)
        │     └── ChecklistTemplateItem (kind: INFO/TASK/FORM/UPLOAD/APPROVAL)
        └── ProjectChecklistItem (instance per project, has status & payload)

AuditLog (append-only, indexed by occurredAt + actorId + resource)
```

ראו את הפירוט המלא ב-[`prisma/schema.prisma`](./prisma/schema.prisma).

---

## RBAC – מטריצת הרשאות

| הרשאה | OWNER | IMPLEMENTER | CUSTOMER_ADMIN | CUSTOMER_USER | VIEWER |
|---|---|---|---|---|---|
| `project:create` | ✓ | ✓ | | | |
| `project:update` | ✓ | ✓ | | | |
| `project:delete` | ✓ | | | | |
| `project:view` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `item:complete` | ✓ | ✓ | ✓ | ✓ | |
| `item:assign` | ✓ | ✓ | ✓ | | |
| `item:approve` | ✓ | ✓ | | | |
| `user:manage` | ✓ | | ✓ | | |
| `template:manage` | ✓ | ✓ | | | |
| `audit:view` | ✓ | ✓ | | | ✓ |

בנוסף, כל שלב ב-checklist יכול לדרוש רמת הרשאה מינימלית (`requiredRole`) — למשל "אישור Go-Live" שדורש `CUSTOMER_ADMIN`. נאכף גם דרך REST (`PATCH /items/{id}` מחזיר 403 אם הרמה נמוכה מדי).

---

## מסלול ביקורת (Audit Trail)

כל אירוע רגיש נשמר ב-`AuditLog`:

- `USER_LOGIN`, `USER_LOGIN_FAILED`, `USER_LOGOUT`
- `PROJECT_CREATED`, `PROJECT_UPDATED`, `PROJECT_STATUS_CHANGED`, `PROJECT_DELETED`
- `ITEM_STATUS_CHANGED`, `ITEM_COMPLETED`, `ITEM_ASSIGNED`, `ITEM_APPROVED`
- `TEMPLATE_CREATED`, `TEMPLATE_UPDATED`
- `PERMISSION_DENIED` — כשמישהו ניסה לגעת במשהו שלא הורשה לו

לכל אירוע נשמרים: `actorId`, `actorEmail` (snapshot), `ipAddress`, `userAgent`, ו-`metadata` JSON עם הקשר. ב-`metadata.via` נסמן `rest` או `web` לזיהוי הערוץ. הצפייה זמינה ב-`/admin/audit` (UI) או דרך `GET /api/v1/audit` עם paging מבוסס cursor.

---

## מבנה הפרויקט

```
implementation-portal/
├── docker-compose.yml          # Postgres 16 בפורט 5544
├── prisma/
│   ├── schema.prisma           # מודל הנתונים
│   ├── migrations/             # SQL migrations (init יוצר)
│   └── seed.ts                 # נתוני דמו עשירים
├── src/
│   ├── app/
│   │   ├── layout.tsx          # RTL + Inter
│   │   ├── login/              # דף כניסה (Server Action)
│   │   ├── api/
│   │   │   ├── logout/         # legacy POST למסך הלוגאוט שב-UI
│   │   │   └── v1/             # ★ REST API ★
│   │   │       ├── auth/{login,logout,me}/
│   │   │       ├── projects/[id]/items/
│   │   │       ├── items/[id]/
│   │   │       ├── templates/
│   │   │       ├── users/
│   │   │       ├── audit/
│   │   │       └── _serializers.ts
│   │   ├── (portal)/           # אזור הלקוח
│   │   └── (admin)/            # אזור הספק
│   ├── components/             # TopBar, StatusBadge, ui/*
│   ├── lib/
│   │   ├── db.ts               # Prisma singleton
│   │   ├── auth.ts             # JWT + cookies + Bearer
│   │   ├── rbac.ts             # מטריצת הרשאות
│   │   ├── audit.ts            # recordAudit()
│   │   ├── api.ts              # ★ REST helpers (handle, jsonOk, parseJsonBody, requireApiUser)
│   │   ├── validation.ts       # Zod schemas
│   │   ├── format.ts           # תוויות בעברית
│   │   └── types.ts            # TypeScript unions במקום DB enums
│   └── middleware.ts           # מעביר API דרך, מגן על דפי SSR
├── tailwind.config.ts
├── next.config.mjs
├── tsconfig.json
└── package.json
```

---

## פקודות שימושיות

```bash
npm run dev          # שרת פיתוח עם hot reload
npm run build        # build production (כולל prisma generate)
npm run start        # הרצת build production
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # Vitest (run once)
npm run test:watch   # Vitest (watch mode)
npm run db:up        # docker compose up -d db
npm run db:down      # docker compose down
npm run db:migrate   # prisma migrate dev (יוצר migrations חדשים)
npm run db:deploy    # prisma migrate deploy (production)
npm run db:seed      # זריעת נתוני דמו
npm run db:studio    # Prisma Studio (GUI ל-DB)
npm run setup        # all-in-one: docker + migrate + seed
```

---

## פריסה לפרודקשן

1. `AUTH_SECRET` חזק (≥32 תווים): `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`
2. `DATABASE_URL` ל-Postgres production עם SSL: `postgresql://user:pass@host:5432/db?sslmode=require&schema=public`
3. `npm run db:deploy` (לא `migrate dev`) — מריץ רק migrations קיימים בלי לייצר חדשים.
4. `npm run build && npm run start`, או deploy ל-Vercel/Fly/Render. לוודא שהמשתנים ב-environment.
5. הוספת reverse proxy (nginx/Caddy) עם HTTPS — ה-cookie יסומן אוטומטית `Secure` ב-production.

---

## הרחבות אפשריות

- 📧 שליחת התראות במייל ב-state transitions (`ITEM_ASSIGNED`, `PROJECT_COMPLETED`).
- 📎 העלאת קבצים אמיתית ל-S3/R2 (כרגע ה-`UPLOAD` קולט URL).
- ✍️ עורך תבניות drag-and-drop למנהלי המוצר.
- 🔄 Webhooks החוצה כשפרויקט משלים שלב.
- 🔐 SSO (SAML/OIDC), MFA, ו-API keys לאינטגרציות (במקום bearer-לכל-משתמש).
- 📊 דוחות התקדמות וצפי go-live ב-`/admin`.
- 🧪 OpenAPI spec אוטומטי + Swagger UI על בסיס ה-Zod schemas.

---

## רישיון

MIT
