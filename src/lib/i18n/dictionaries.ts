// Translation dictionaries. Pure data + small interpolation helpers, safe to
// import from both server and client components.
//
// `en` is the source of truth for the shape; `he` must satisfy the same type.

import type { Locale } from './config';

const en = {
  common: {
    appName: 'Implementation Portal',
    continue: 'Continue',
    backToDashboard: 'Back to dashboard',
    vendorAccount: 'Vendor account',
    logout: 'Log out',
    filter: 'Filter',
    previous: 'Previous',
    next: 'Next',
    language: 'Language',
    emptyValue: '—'
  },
  nav: {
    dashboard: 'Dashboard',
    projects: 'Projects',
    users: 'Users',
    audit: 'Audit log'
  },
  login: {
    heroTitleLine1: 'Turn every implementation',
    heroTitleLine2: 'into a guided experience.',
    heroSubtitle:
      'From the moment a customer gets access until go-live — live checklists, role-based assignments, and a full audit trail for every action.',
    feature1: 'Reusable onboarding templates',
    feature2: 'RBAC with 5 permission levels',
    feature3: 'Audit trail built for compliance',
    welcome: 'Welcome back',
    subtitle: 'Sign in to continue your implementation journey.',
    inactiveAccount: 'This account is inactive. Contact your administrator.',
    emailLabel: 'Email address',
    passwordLabel: 'Password',
    signIn: 'Sign in',
    signingIn: 'Signing in…',
    demoTitle: 'Demo credentials',
    demoOwner: 'Owner: owner@vendor.example / Demo!2026',
    demoCustomerAdmin: 'Customer admin: admin@acme.example / Demo!2026',
    demoCustomerUser: 'Customer user: maria@acme.example / Demo!2026',
    invalidData: 'Invalid data',
    errorInvalidCredentials: 'Invalid email or password',
    errorRateLimited: 'Too many login attempts. Try again in a few minutes.'
  },
  dashboard: {
    greeting: (name: string) => `Hello, ${name}.`,
    vendorIntro:
      'These are the active projects in the system. Pick one to continue the engagement.',
    customerIntro:
      'These are your active implementation projects. Pick one to continue.',
    accessDenied: 'Access to the requested area was denied — insufficient permissions.',
    statProjects: 'Projects',
    statTotalProgress: 'Total progress',
    tasksCompleted: (completed: number, total: number) =>
      `${completed} / ${total} tasks completed`,
    owner: (name: string) => `Owner: ${name}`,
    target: (date: string) => `Due: ${date}`,
    emptyTitle: 'No projects yet',
    emptyVendor:
      'Create a new implementation project from an existing checklist template and invite the customer.',
    emptyCustomer:
      'Once the implementation team assigns you a project, it will appear here.',
    createNew: 'Create new project'
  },
  project: {
    templatePrefix: (name: string) => `Template: ${name}`,
    owner: (name: string) => `Owner: ${name}`,
    targetDate: (date: string) => `Due date: ${date}`,
    created: (date: string) => `Created: ${date}`,
    tasksCompletedOf: (completed: number, total: number) =>
      `${completed} of ${total} tasks completed`,
    nextStep: 'Your next step',
    guidedChecklist: 'Guided checklist',
    step: (n: number) => `Step ${n}`,
    viewOnly: 'View only',
    requiresHigherRole: 'A higher permission level is required',
    assignedTo: (name: string) => `Assigned to ${name}`,
    completedBy: (name: string, date: string) => `Completed by ${name} on ${date}`
  },
  item: {
    backToProject: (name: string) => `Back to project ${name}`,
    stepOf: (current: number, total: number) => `Step ${current} of ${total}`,
    client: 'Customer',
    assignedTo: 'Assigned to',
    notAssigned: 'Unassigned',
    lastUpdated: 'Last updated',
    completedBanner: (name: string, date: string) =>
      `Completed by ${name} on ${date}.`,
    statusLabel: 'Status',
    formContent: 'Form content',
    fileLink: 'Link / file name',
    formHint: 'Fill in the information required for this step (free text or JSON).',
    uploadHint: 'Demo mode: paste a file URL or a file name.',
    notes: 'Notes',
    notesHint: 'Recorded in the audit trail.',
    notesPlaceholder: 'Add an optional note…',
    noPermission: 'You do not have permission to update this step.',
    save: 'Save and continue',
    saving: 'Saving…',
    prevStep: 'Previous step',
    nextStep: 'Next step',
    statusUpdated: 'Status updated',
    notFound: 'Task not found',
    noAccess: 'You do not have access to this project',
    requiresHigherRole: 'A higher permission level is required for this step',
    invalidData: 'Invalid data'
  },
  adminProjects: {
    title: 'Projects',
    subtitle: 'Manage implementation projects across all customers.',
    newProject: 'New project',
    allProjects: (n: number) => `All projects (${n})`,
    colName: 'Name',
    colClient: 'Customer',
    colTemplate: 'Template',
    colOwner: 'Owner',
    colStatus: 'Status',
    colProgress: 'Progress',
    colTargetDate: 'Due date',
    empty: 'No projects created yet.'
  },
  adminUsers: {
    title: 'Users',
    subtitle: 'All existing accounts — both vendor and customer.',
    totalUsers: (n: number) => `${n} users in total`,
    colName: 'Name',
    colEmail: 'Email',
    colOrg: 'Organization',
    colRole: 'Role',
    colStatus: 'Status',
    colLastLogin: 'Last login',
    vendor: 'vendor',
    customer: 'customer',
    active: 'Active',
    inactive: 'Inactive'
  },
  adminAudit: {
    title: 'Audit log',
    subtitle: 'Append-only record of every sensitive action in the system.',
    allActions: 'All actions',
    filter: 'Filter',
    eventsCount: (n: string) => `${n} events`,
    filteredBy: (label: string) => ` · filtered by ${label}`,
    colDate: 'Date',
    colAction: 'Action',
    colActor: 'Actor',
    colResource: 'Resource',
    colDetails: 'Details',
    colIp: 'IP',
    anonymous: 'Anonymous',
    noEvents: 'No matching events.',
    pageOf: (page: number, total: number) => `Page ${page} of ${total}`
  },
  newProject: {
    backToList: 'Back to projects list',
    title: 'New implementation project',
    subtitle:
      'Pick a customer and a checklist template — we will generate all the steps automatically.',
    projectName: 'Project name',
    projectNamePlaceholder: 'e.g. Acme Implementation – Q4',
    customerOrg: 'Customer organization',
    selectCustomer: 'Select a customer…',
    template: 'Checklist template',
    selectTemplate: 'Select a template…',
    stepsCount: (n: number) => `${n} steps`,
    implementer: 'Implementation owner (internal)',
    selectOwner: 'Select an owner…',
    targetDate: 'Due date',
    creating: 'Creating…',
    create: 'Create project',
    noPermission: 'You do not have permission to create projects',
    templateNotFound: 'Template not found',
    invalidData: 'Invalid data'
  },
  labels: {
    status: {
      PENDING: 'Pending',
      IN_PROGRESS: 'In progress',
      BLOCKED: 'Blocked',
      COMPLETED: 'Completed',
      SKIPPED: 'Skipped'
    } as Record<string, string>,
    projectStatus: {
      DRAFT: 'Draft',
      ACTIVE: 'Active',
      ON_HOLD: 'On hold',
      COMPLETED: 'Completed',
      ARCHIVED: 'Archived'
    } as Record<string, string>,
    itemKind: {
      INFO: 'Info',
      TASK: 'Task',
      FORM: 'Form',
      UPLOAD: 'File upload',
      APPROVAL: 'Approval'
    } as Record<string, string>,
    role: {
      OWNER: 'Owner',
      IMPLEMENTER: 'Implementer',
      CUSTOMER_ADMIN: 'Customer admin',
      CUSTOMER_USER: 'Customer user',
      VIEWER: 'Viewer'
    } as Record<string, string>,
    action: {
      USER_LOGIN: 'Login',
      USER_LOGIN_FAILED: 'Failed login attempt',
      USER_LOGOUT: 'Logout',
      USER_CREATED: 'User created',
      USER_UPDATED: 'User updated',
      USER_DEACTIVATED: 'User deactivated',
      PROJECT_CREATED: 'Project created',
      PROJECT_UPDATED: 'Project updated',
      PROJECT_STATUS_CHANGED: 'Project status changed',
      PROJECT_DELETED: 'Project deleted',
      ITEM_STATUS_CHANGED: 'Task status changed',
      ITEM_COMPLETED: 'Task completed',
      ITEM_ASSIGNED: 'Task assigned',
      ITEM_APPROVED: 'Task approved',
      ITEM_NOTE_ADDED: 'Note added',
      TEMPLATE_CREATED: 'Template created',
      TEMPLATE_UPDATED: 'Template updated',
      PERMISSION_DENIED: 'Permission denied'
    } as Record<string, string>
  }
};

export type Dictionary = typeof en;

const he: Dictionary = {
  common: {
    appName: 'Implementation Portal',
    continue: 'המשך',
    backToDashboard: 'חזרה ללוח הבקרה',
    vendorAccount: 'חשבון ספק',
    logout: 'התנתק',
    filter: 'סנן',
    previous: 'הקודם',
    next: 'הבא',
    language: 'שפה',
    emptyValue: '—'
  },
  nav: {
    dashboard: 'לוח בקרה',
    projects: 'פרויקטים',
    users: 'משתמשים',
    audit: 'יומן ביקורת'
  },
  login: {
    heroTitleLine1: 'להפוך כל הטמעה',
    heroTitleLine2: 'לחוויה מודרכת.',
    heroSubtitle:
      'מהרגע שלקוח מקבל גישה ועד go-live — checklists חיים, הקצאות מבוססות תפקיד, ומסלול ביקורת מלא לכל פעולה.',
    feature1: 'תבניות onboarding לשימוש חוזר',
    feature2: 'RBAC עם 5 רמות הרשאה',
    feature3: 'Audit trail צמוד לתאימות וביקורת',
    welcome: 'ברוכים הבאים',
    subtitle: 'התחברו כדי להמשיך בתהליך ההטמעה שלכם.',
    inactiveAccount: 'החשבון אינו פעיל. פנו למנהל המערכת.',
    emailLabel: 'כתובת מייל',
    passwordLabel: 'סיסמה',
    signIn: 'כניסה',
    signingIn: 'מתחבר…',
    demoTitle: 'פרטי התחברות לדמו',
    demoOwner: 'בעלים: owner@vendor.example / Demo!2026',
    demoCustomerAdmin: 'מנהל לקוח: admin@acme.example / Demo!2026',
    demoCustomerUser: 'משתמש לקוח: maria@acme.example / Demo!2026',
    invalidData: 'נתונים לא תקינים',
    errorInvalidCredentials: 'מייל או סיסמה שגויים',
    errorRateLimited: 'יותר מדי ניסיונות התחברות. נסו שוב בעוד מספר דקות.'
  },
  dashboard: {
    greeting: (name: string) => `שלום, ${name}.`,
    vendorIntro: 'אלו הפרויקטים הפעילים במערכת. בחרו פרויקט כדי להמשיך בליווי.',
    customerIntro: 'אלו פרויקטי ההטמעה הפעילים שלכם. בחרו פרויקט כדי להמשיך.',
    accessDenied: 'הגישה לאזור המבוקש נדחתה — חסרות הרשאות.',
    statProjects: 'פרויקטים',
    statTotalProgress: 'התקדמות כוללת',
    tasksCompleted: (completed: number, total: number) =>
      `${completed} / ${total} משימות הושלמו`,
    owner: (name: string) => `אחראי: ${name}`,
    target: (date: string) => `יעד: ${date}`,
    emptyTitle: 'אין עדיין פרויקטים',
    emptyVendor:
      'צרו פרויקט הטמעה חדש מתבנית checklist קיימת והזמינו את הלקוח.',
    emptyCustomer: 'ברגע שצוות ההטמעה ישייך אליכם פרויקט, הוא יופיע כאן.',
    createNew: 'צור פרויקט חדש'
  },
  project: {
    templatePrefix: (name: string) => `תבנית: ${name}`,
    owner: (name: string) => `אחראי: ${name}`,
    targetDate: (date: string) => `תאריך יעד: ${date}`,
    created: (date: string) => `נוצר: ${date}`,
    tasksCompletedOf: (completed: number, total: number) =>
      `${completed} מתוך ${total} משימות הושלמו`,
    nextStep: 'השלב הבא שלך',
    guidedChecklist: 'רשימת המשימות המודרכת',
    step: (n: number) => `שלב ${n}`,
    viewOnly: 'לצפייה בלבד',
    requiresHigherRole: 'נדרשת רמת הרשאה גבוהה יותר',
    assignedTo: (name: string) => `מוקצה ל-${name}`,
    completedBy: (name: string, date: string) => `הושלם ע״י ${name} ב-${date}`
  },
  item: {
    backToProject: (name: string) => `חזרה לפרויקט ${name}`,
    stepOf: (current: number, total: number) => `שלב ${current} מתוך ${total}`,
    client: 'לקוח',
    assignedTo: 'מוקצה ל',
    notAssigned: 'לא שויך',
    lastUpdated: 'עודכן לאחרונה',
    completedBanner: (name: string, date: string) =>
      `הושלם ע״י ${name} בתאריך ${date}.`,
    statusLabel: 'סטטוס',
    formContent: 'תוכן הטופס',
    fileLink: 'קישור / שם קובץ',
    formHint: 'מלאו כאן את המידע שנדרש לשלב הזה (פורמט חופשי או JSON).',
    uploadHint: 'במצב דמו: הדביקו URL לקובץ או שם קובץ.',
    notes: 'הערות',
    notesHint: 'מתועד ב-audit trail.',
    notesPlaceholder: 'הוסיפו הערה אופציונלית…',
    noPermission: 'אין לכם הרשאה לעדכן שלב זה.',
    save: 'שמור והמשך',
    saving: 'שומר…',
    prevStep: 'השלב הקודם',
    nextStep: 'השלב הבא',
    statusUpdated: 'הסטטוס עודכן',
    notFound: 'המשימה לא נמצאה',
    noAccess: 'אין לכם גישה לפרויקט הזה',
    requiresHigherRole: 'נדרשת רמת הרשאה גבוהה יותר לשלב זה',
    invalidData: 'נתונים לא תקינים'
  },
  adminProjects: {
    title: 'פרויקטים',
    subtitle: 'ניהול פרויקטי הטמעה לכל הלקוחות.',
    newProject: 'פרויקט חדש',
    allProjects: (n: number) => `כל הפרויקטים (${n})`,
    colName: 'שם',
    colClient: 'לקוח',
    colTemplate: 'תבנית',
    colOwner: 'אחראי',
    colStatus: 'סטטוס',
    colProgress: 'התקדמות',
    colTargetDate: 'תאריך יעד',
    empty: 'עדיין לא נוצרו פרויקטים.'
  },
  adminUsers: {
    title: 'משתמשים',
    subtitle: 'כל החשבונות הקיימים — של ספק ושל לקוחות.',
    totalUsers: (n: number) => `סך הכל ${n} משתמשים`,
    colName: 'שם',
    colEmail: 'מייל',
    colOrg: 'ארגון',
    colRole: 'תפקיד',
    colStatus: 'סטטוס',
    colLastLogin: 'כניסה אחרונה',
    vendor: 'ספק',
    customer: 'לקוח',
    active: 'פעיל',
    inactive: 'מושבת'
  },
  adminAudit: {
    title: 'יומן ביקורת',
    subtitle: 'רישום append-only של כל פעולה רגישה במערכת.',
    allActions: 'כל הפעולות',
    filter: 'סנן',
    eventsCount: (n: string) => `${n} אירועים`,
    filteredBy: (label: string) => ` · מסונן לפי ${label}`,
    colDate: 'תאריך',
    colAction: 'פעולה',
    colActor: 'מבצע',
    colResource: 'משאב',
    colDetails: 'פרטים',
    colIp: 'IP',
    anonymous: 'אנונימי',
    noEvents: 'אין אירועים תואמים.',
    pageOf: (page: number, total: number) => `עמוד ${page} מתוך ${total}`
  },
  newProject: {
    backToList: 'חזרה לרשימת הפרויקטים',
    title: 'פרויקט הטמעה חדש',
    subtitle: 'בחרו לקוח ותבנית checklist — נייצר עבורכם את כל השלבים אוטומטית.',
    projectName: 'שם הפרויקט',
    projectNamePlaceholder: 'למשל: הטמעת Acme – Q4',
    customerOrg: 'ארגון לקוח',
    selectCustomer: 'בחרו לקוח…',
    template: 'תבנית checklist',
    selectTemplate: 'בחרו תבנית…',
    stepsCount: (n: number) => `${n} שלבים`,
    implementer: 'אחראי הטמעה (פנימי)',
    selectOwner: 'בחרו אחראי…',
    targetDate: 'תאריך יעד',
    creating: 'יוצר…',
    create: 'צור פרויקט',
    noPermission: 'אין לכם הרשאה ליצור פרויקטים',
    templateNotFound: 'התבנית לא נמצאה',
    invalidData: 'נתונים לא תקינים'
  },
  labels: {
    status: {
      PENDING: 'ממתין',
      IN_PROGRESS: 'בעבודה',
      BLOCKED: 'חסום',
      COMPLETED: 'הושלם',
      SKIPPED: 'דולג'
    },
    projectStatus: {
      DRAFT: 'טיוטה',
      ACTIVE: 'פעיל',
      ON_HOLD: 'מושהה',
      COMPLETED: 'הושלם',
      ARCHIVED: 'בארכיון'
    },
    itemKind: {
      INFO: 'מידע',
      TASK: 'משימה',
      FORM: 'טופס',
      UPLOAD: 'העלאת קובץ',
      APPROVAL: 'אישור'
    },
    role: {
      OWNER: 'בעלים',
      IMPLEMENTER: 'איש הטמעה',
      CUSTOMER_ADMIN: 'מנהל לקוח',
      CUSTOMER_USER: 'משתמש לקוח',
      VIEWER: 'צופה'
    },
    action: {
      USER_LOGIN: 'התחברות',
      USER_LOGIN_FAILED: 'ניסיון התחברות שנכשל',
      USER_LOGOUT: 'התנתקות',
      USER_CREATED: 'משתמש נוצר',
      USER_UPDATED: 'משתמש עודכן',
      USER_DEACTIVATED: 'משתמש הושבת',
      PROJECT_CREATED: 'פרויקט נוצר',
      PROJECT_UPDATED: 'פרויקט עודכן',
      PROJECT_STATUS_CHANGED: 'סטטוס פרויקט שונה',
      PROJECT_DELETED: 'פרויקט נמחק',
      ITEM_STATUS_CHANGED: 'סטטוס משימה שונה',
      ITEM_COMPLETED: 'משימה הושלמה',
      ITEM_ASSIGNED: 'משימה הוקצתה',
      ITEM_APPROVED: 'משימה אושרה',
      ITEM_NOTE_ADDED: 'הערה נוספה',
      TEMPLATE_CREATED: 'תבנית נוצרה',
      TEMPLATE_UPDATED: 'תבנית עודכנה',
      PERMISSION_DENIED: 'הרשאה נדחתה'
    }
  }
};

export const dictionaries: Record<Locale, Dictionary> = { en, he };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en;
}
