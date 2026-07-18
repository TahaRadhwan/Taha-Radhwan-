/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shipment } from '../types';

let cachedToken: string | null = null;

export const setWorkspaceToken = (token: string | null) => {
  cachedToken = token;
};

export const getWorkspaceToken = () => {
  return cachedToken;
};

/**
 * تصدير المعاملات الجمركية إلى جدول بيانات Google Sheets حياً وبكبسة زر واحدة
 */
export async function exportToSheets(shipments: Shipment[], token: string): Promise<string> {
  // 1. إنشاء جدول بيانات جديد وتسمية الورقة الأولى "Sheet1" صراحة لتفادي مشاكل توطين اللغات (مثلا ورقة1)
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: 'طه رضوان للخدمات اللوجستية - المعاملات الجمركية الموحدة'
      },
      sheets: [
        {
          properties: {
            title: 'Sheet1'
          }
        }
      ]
    })
  });

  if (!createRes.ok) {
    const errorDetails = await createRes.text();
    throw new Error(`فشل إنشاء جدول بيانات Google Sheets: ${errorDetails}`);
  }

  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const spreadsheetUrl = spreadsheet.spreadsheetUrl;

  // 2. تعبئة البيانات في الجدول
  const headers = [
    'رمز الشحنة', 
    'اسم الشحنة / التفاصيل', 
    'التصنيف جمركياً', 
    'المورد الأصلي', 
    'بلد المنشأ', 
    'منفذ وميناء التوصيل', 
    'رقم الحاوية', 
    'الوزن (طن)', 
    'القيمة بالدولار ($)', 
    'القيمة بالريال اليمني', 
    'الخط الملاحي', 
    'الحالة الجمركية الحالية', 
    'المسار جمركياً',
    'الترميز (HS Code)',
    'تاريخ الإنشاء'
  ];

  const rows = shipments.map(s => [
    s.code,
    s.title,
    s.cargoType,
    s.supplier,
    s.countryOfOrigin,
    s.portOfDischarge,
    s.containerNumber,
    s.weight,
    s.valueUSD,
    s.valueLocal,
    s.carrierName,
    s.currentStatus,
    s.inspectionChannel || 'غير محدد',
    s.hsCode || 'غير محدد',
    s.createdAt
  ]);

  const writeRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: 'Sheet1!A1',
      majorDimension: 'ROWS',
      values: [headers, ...rows]
    })
  });

  if (!writeRes.ok) {
    const errorDetails = await writeRes.text();
    throw new Error(`فشل كتابة البيانات بداخل Google Sheets: ${errorDetails}`);
  }

  return spreadsheetUrl;
}

/**
 * استيراد الشحنات من جدول بيانات Google Sheets موجود عبر معرّف الجدول
 */
export async function importFromSheets(spreadsheetId: string, token: string): Promise<Partial<Shipment>[]> {
  const readRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:O100`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!readRes.ok) {
    const errorDetails = await readRes.text();
    throw new Error(`فشل قراءة جدول البيانات. تأكد من إمكانية الوصول ومعرّف الجدول (ID): ${errorDetails}`);
  }

  const data = await readRes.json();
  const rows = data.values as any[][];

  if (!rows || rows.length === 0) {
    return [];
  }

  return rows.map(row => ({
    code: row[0] || `YE-${Math.floor(10000 + Math.random() * 90000)}`,
    title: row[1] || 'شحنة مستوردة من جوجل شيت',
    cargoType: (row[2] || 'electronics') as any,
    supplier: row[3] || 'مورد مستورد',
    countryOfOrigin: row[4] || 'الصين',
    portOfDischarge: row[5] || 'ميناء عدن الدولي (الحاويات)',
    containerNumber: row[6] || 'MSCU000000-0',
    weight: Number(row[7]) || 10,
    valueUSD: Number(row[8]) || 25000,
    valueLocal: Number(row[9]) || (Number(row[8]) || 25000) * 1350,
    carrierName: row[10] || 'Maersk Line (ميرسك)',
    currentStatus: (row[11] || 'purchased') as any,
    inspectionChannel: (row[12] || 'yellow') as any,
    hsCode: row[13] || '8517.13.00',
    createdAt: row[14] || new Date().toISOString().split('T')[0]
  }));
}

/**
 * توليد بيان جمركي وتخليص جمركي موحد للشحنة المحددة بداخل Google Docs
 */
export async function generateDocsReport(shipment: Shipment, token: string): Promise<string> {
  // 1. إنشاء المستند
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: `بيان التخليص الجمركي الموحد للشحنة رقم ${shipment.code}`
    })
  });

  if (!createRes.ok) {
    const errorDetails = await createRes.text();
    throw new Error(`فشل إنشاء مستند Google Docs: ${errorDetails}`);
  }

  const document = await createRes.json();
  const documentId = document.documentId;

  // 2. كتابة المحتوى والتنسيق
  const textContent = 
    `مكتب طه رضوان للخدمات اللوجستية والتخليص الجمركي\n` +
    `الجمهورية اليمنية - مصلحة الجمارك العامة والموانئ المعتمدة\n` +
    `========================================================================\n\n` +
    `بيان ومعاملة جمركية رسمية موحدة\n` +
    `تاريخ التوليد: ${new Date().toLocaleDateString('ar-YE')}\n\n` +
    `1. تفاصيل الشحنة الأساسية:\n` +
    `-----------------------------------------\n` +
    `- الرمز المرجعي للمعاملة: ${shipment.code}\n` +
    `- مسمى البضاعة: ${shipment.title}\n` +
    `- نوع الصنف جمركياً: ${shipment.cargoType}\n` +
    `- المورد الأصلي: ${shipment.supplier}\n` +
    `- بلد منشأ الصنف: ${shipment.countryOfOrigin}\n` +
    `- ميناء ومنفذ التوصيل والتخليص: ${shipment.portOfDischarge}\n` +
    `- الشركة الملاحية الناقلة: ${shipment.carrierName}\n` +
    `- رقم الحاوية الفريد: ${shipment.containerNumber}\n` +
    `- الوزن الإجمالي للبضائع: ${shipment.weight} طن\n` +
    `- قيمة الفاتورة التجارية: ${shipment.valueUSD.toLocaleString()} $ USD\n` +
    `- القيمة بالعملة المحلية (الريال اليمني): ${shipment.valueLocal.toLocaleString()} ريال يمني\n` +
    `- العميل / المستورد المحلي: ${shipment.clientName || 'غير محدد'}\n` +
    `- رقم تتبع بوليصة الشحن: ${shipment.trackingNumber || 'غير محدد'}\n` +
    `- تاريخ البدء الفعلي: ${shipment.createdAt}\n\n` +
    `2. الحالة والبيان الجمركي الموحد:\n` +
    `-----------------------------------------\n` +
    `- حالة التخليص الحالية للشحنة: ${shipment.currentStatus}\n` +
    `- الترميز الجمركي الموحد لتعرفة الصنف (HS Code): ${shipment.hsCode || 'غير محدد'}\n` +
    `- نسبة الرسوم المقررة جمركياً: ${((shipment.dutyRate || 0) * 100)}%\n` +
    `- المسار الموجه جمركياً بالشاشات (نظام المخاطر): ${shipment.inspectionChannel === 'red' ? 'المسار الأحمر (تفتيش عيني ومخبري)' : shipment.inspectionChannel === 'yellow' ? 'المسار الأصفر (مطابقة مستندات)' : 'المسار الأخضر (فسح فوري)'}\n` +
    `- نتيجة الفحص المخبري والشهادة الصحية: ${shipment.labResult === 'passed' ? 'مطابق ومجاز' : shipment.labResult === 'failed' ? 'غير مطابق ومرفوض' : 'قيد الفحص والمطابقة مخبرياً'}\n` +
    `- حالة سداد الرسوم والضرائب: ${shipment.dutiesPaid ? 'تم السداد بالكامل إلكترونياً' : 'بانتظار تبرئة السداد وإغلاق البيان'}\n\n` +
    `3. سجل تحركات وخطوات الدورة الجمركية (التتبع التاريخي):\n` +
    `-----------------------------------------\n` +
    shipment.logs.map(l => `[${l.timestamp}] (حالة: ${l.status}) - ${l.message}`).join('\n') + `\n\n` +
    `========================================================================\n` +
    `تم تصدير وتجهيز هذا التقرير الجمركي من خلال مكتب طه رضوان للخدمات اللوجستية.\n` +
    `جميع البيانات تعتبر رسمية طبقاً للوائح الاستيراد ومصلحة الجمارك بالجمهورية اليمنية.`;

  const writeRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: textContent
          }
        }
      ]
    })
  });

  if (!writeRes.ok) {
    const errorDetails = await writeRes.text();
    throw new Error(`فشل كتابة المحتوى في Google Docs: ${errorDetails}`);
  }

  return `https://docs.google.com/document/d/${documentId}/edit`;
}

/**
 * استدعاء جهات الاتصال من Google Contacts (People API)
 */
export async function getGoogleContacts(token: string): Promise<any[]> {
  const res = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=50', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errorDetails = await res.text();
    throw new Error(`فشل استرجاع جهات الاتصال: ${errorDetails}`);
  }

  const data = await res.json();
  const connections = data.connections || [];

  return connections.map((conn: any) => {
    const name = conn.names?.[0]?.displayName || 'جهة اتصال بلا اسم';
    const email = conn.emailAddresses?.[0]?.value || 'لا يوجد بريد';
    const phone = conn.phoneNumbers?.[0]?.value || 'لا يوجد هاتف';
    const org = conn.organizations?.[0]?.name || 'غير محددة';
    return { name, email, phone, org };
  });
}

/**
 * حفظ جهة اتصال جديدة في Google Contacts
 */
export async function createGoogleContact(contact: { name: string; phone: string; email: string; org: string }, token: string): Promise<boolean> {
  const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      names: [
        {
          givenName: contact.name
        }
      ],
      emailAddresses: [
        {
          value: contact.email || `${contact.name.replace(/\s+/g, '')}@example.com`
        }
      ],
      phoneNumbers: [
        {
          value: contact.phone || '+967111111'
        }
      ],
      organizations: [
        {
          name: contact.org || 'مكتب طه رضوان اللوجستي',
          title: 'عميل / مستورد لوجستي'
        }
      ]
    })
  });

  if (!res.ok) {
    const errorDetails = await res.text();
    throw new Error(`فشل حفظ جهة الاتصال في Google Contacts: ${errorDetails}`);
  }

  return true;
}

/**
 * دالة تشفير النصوص بصيغة base64url المتوافقة مع الـ UTF-8 لإرسال رسائل Gmail
 */
function base64url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * إرسال بريد إلكتروني تفصيلي ومخصص عبر Gmail بخصوص شحنة أو تقرير لوجستي
 */
export async function sendGmailEmail(to: string, subject: string, htmlBody: string, token: string): Promise<boolean> {
  const emailContent = [
    `To: ${to}`,
    'Content-Type: text/html; charset="UTF-8"',
    'MIME-Version: 1.0',
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    '',
    htmlBody
  ].join('\r\n');

  const raw = base64url(emailContent);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw })
  });

  if (!res.ok) {
    const errorDetails = await res.text();
    throw new Error(`فشل إرسال البريد الإلكتروني عبر Gmail: ${errorDetails}`);
  }

  return true;
}

/**
 * إنشاء وتوليد عرض تقديمي متكامل لتقرير الشحنات الجمركية السنوي في Google Slides
 */
export async function generateSlidesReport(shipments: Shipment[], token: string): Promise<string> {
  // 1. إنشاء العرض التقديمي
  const createRes = await fetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'مكتب طه رضوان - التقرير السنوي واللوجستي للشحنات'
    })
  });

  if (!createRes.ok) {
    const errorDetails = await createRes.text();
    throw new Error(`فشل إنشاء عرض تقديمي Google Slides: ${errorDetails}`);
  }

  const presentation = await createRes.json();
  const presentationId = presentation.presentationId;

  // حساب الإحصائيات للشحنات
  const count = shipments.length;
  const totalValue = shipments.reduce((sum, s) => sum + (s.valueUSD || 0), 0).toLocaleString();
  const totalWeight = shipments.reduce((sum, s) => sum + (s.weight || 0), 0).toLocaleString();
  const currentDate = new Date().toLocaleDateString('ar-YE');

  // 2. تحديث وتزيين الشرائح عبر batchUpdate
  const batchRes = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        {
          createSlide: {
            objectId: 'slide_report_1',
            insertionIndex: '0',
            slideLayoutReference: {
              predefinedLayout: 'BLANK'
            }
          }
        },
        {
          createShape: {
            objectId: 'title_box_1',
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: 'slide_report_1',
              size: {
                height: { magnitude: 1200000, unit: 'EMU' },
                width: { magnitude: 8000000, unit: 'EMU' }
              },
              transform: {
                scaleX: 1, scaleY: 1,
                translateX: 500000, translateY: 500000,
                unit: 'EMU'
              }
            }
          }
        },
        {
          insertText: {
            objectId: 'title_box_1',
            text: `مكتب طه رضوان للخدمات اللوجستية والتخليص الجمركي\nتقرير حركة الشحنات والمعاملات الجمركية الموحدة`,
            insertionIndex: 0
          }
        },
        {
          createShape: {
            objectId: 'content_box_1',
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: 'slide_report_1',
              size: {
                height: { magnitude: 3000000, unit: 'EMU' },
                width: { magnitude: 8000000, unit: 'EMU' }
              },
              transform: {
                scaleX: 1, scaleY: 1,
                translateX: 500000, translateY: 1800000,
                unit: 'EMU'
              }
            }
          }
        },
        {
          insertText: {
            objectId: 'content_box_1',
            text: `تم إصدار هذا التقرير التحليلي بصفة رسمية ومباشرة من خلال لوحة تحكم المعاملات الجمركية السحابية.\n\n📊 إحصائيات عامة وشاملة:\n- إجمالي المعاملات الجمركية النشطة: ${count} شحنات\n- القيمة الإجمالية المصرح بها جمركياً: ${totalValue} $ USD\n- الوزن الكلي للبضائع والحاويات: ${totalWeight} طن كلي\n\n🌍 تفاصيل التوزيع الجغرافي وحركة الموانئ:\n- المنافذ المعتمدة: ميناء عدن الدولي، منفذ شحن البري، ميناء الحديدة\n- تاريخ التحديث والتقرير المباشر: ${currentDate}`,
            insertionIndex: 0
          }
        }
      ]
    })
  });

  if (!batchRes.ok) {
    const errorDetails = await batchRes.text();
    throw new Error(`فشل تعبئة وتحديث الشرائح في Google Slides: ${errorDetails}`);
  }

  return `https://docs.google.com/presentation/d/${presentationId}/edit`;
}

/**
 * جلب قائمة قنوات ومساحات Google Chat المتوفرة لدى الحساب المرتبط
 */
export async function getGoogleChatSpaces(token: string): Promise<any[]> {
  const res = await fetch('https://chat.googleapis.com/v1/spaces', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errorDetails = await res.text();
    throw new Error(`فشل استرجاع مساحات Google Chat: ${errorDetails}`);
  }

  const data = await res.json();
  return data.spaces || [];
}

/**
 * إرسال رسالة فورية إلى مساحة Google Chat معينة
 */
export async function sendGoogleChatMessage(spaceName: string, textContent: string, token: string): Promise<boolean> {
  const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: textContent
    })
  });

  if (!res.ok) {
    const errorDetails = await res.text();
    throw new Error(`فشل إرسال الرسالة إلى Google Chat: ${errorDetails}`);
  }

  return true;
}

/**
 * جلب قائمة المواعيد والأحداث القادمة من تقويم جوجل (Google Calendar)
 */
export async function getGoogleCalendarEvents(token: string): Promise<any[]> {
  const timeMin = new Date().toISOString();
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=15&orderBy=startTime&singleEvents=true&timeMin=${timeMin}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errorDetails = await res.text();
    throw new Error(`فشل جلب مواعيد تقويم Google: ${errorDetails}`);
  }

  const data = await res.json();
  const items = data.items || [];

  return items.map((item: any) => ({
    id: item.id,
    summary: item.summary || 'حدث بدون عنوان',
    description: item.description || '',
    start: item.start?.dateTime || item.start?.date || '',
    end: item.end?.dateTime || item.end?.date || '',
    htmlLink: item.htmlLink
  }));
}

/**
 * جدولة موعد جديد في تقويم جوجل (Google Calendar) للشحنة الجمركية
 */
export async function createGoogleCalendarEvent(
  event: { summary: string; description: string; startDateTime: string; endDateTime: string }, 
  token: string
): Promise<boolean> {
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      start: {
        dateTime: event.startDateTime,
        timeZone: 'Asia/Aden'
      },
      end: {
        dateTime: event.endDateTime,
        timeZone: 'Asia/Aden'
      }
    })
  });

  if (!res.ok) {
    const errorDetails = await res.text();
    throw new Error(`فشل جدولة الموعد في تقويم Google: ${errorDetails}`);
  }

  return true;
}
