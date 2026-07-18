/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shipment, CargoType } from '../types';
import { 
  exportToSheets, 
  importFromSheets, 
  generateDocsReport, 
  getGoogleContacts, 
  createGoogleContact,
  sendGmailEmail,
  generateSlidesReport,
  getGoogleChatSpaces,
  sendGoogleChatMessage,
  getGoogleCalendarEvents,
  createGoogleCalendarEvent
} from '../lib/workspace';
import { 
  FileSpreadsheet, 
  FileText, 
  Users, 
  Download, 
  Upload, 
  Plus, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  UserPlus,
  Loader2,
  Lock,
  Contact,
  AlertCircle,
  Mail,
  Presentation,
  MessageSquare,
  Send,
  Hash,
  Calendar,
  Clock
} from 'lucide-react';

interface GoogleWorkspacePanelProps {
  shipments: Shipment[];
  token: string | null;
  onImportShipments: (imported: Shipment[]) => void;
  onLinkContactToShipment: (contactName: string) => void;
  onLoginWorkspace: () => void;
  isLoggingIn: boolean;
}

export default function GoogleWorkspacePanel({ 
  shipments, 
  token, 
  onImportShipments, 
  onLinkContactToShipment,
  onLoginWorkspace,
  isLoggingIn
}: GoogleWorkspacePanelProps) {
  
  // States for Google Sheets
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [exportedSheetUrl, setExportedSheetUrl] = useState<string | null>(null);
  const [sheetImportId, setSheetImportId] = useState('');
  const [isImportingSheets, setIsImportingSheets] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // States for Google Docs
  const [selectedShipmentId, setSelectedShipmentId] = useState(shipments[0]?.id || '');
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [generatedDocUrl, setGeneratedDocUrl] = useState<string | null>(null);

  // States for Google Contacts
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', org: '' });
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactActionMessage, setContactActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // States for Gmail
  const [gmailTo, setGmailTo] = useState('');
  const [gmailSubject, setGmailSubject] = useState('تقرير معاملة جمركية - مكتب طه رضوان');
  const [selectedGmailShipmentId, setSelectedGmailShipmentId] = useState(shipments[0]?.id || '');
  const [customEmailBody, setCustomEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailActionMessage, setEmailActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // States for Google Slides
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [generatedSlidesUrl, setGeneratedSlidesUrl] = useState<string | null>(null);

  // States for Google Chat
  const [chatSpaces, setChatSpaces] = useState<any[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  const [selectedSpaceName, setSelectedSpaceName] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingChatMessage, setIsSendingChatMessage] = useState(false);

  // States for Google Calendar
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isSchedulingEvent, setIsSchedulingEvent] = useState(false);
  const [selectedCalendarShipmentId, setSelectedCalendarShipmentId] = useState(shipments[0]?.id || '');
  const [calendarForm, setCalendarForm] = useState({
    summary: 'معاينة وفحص جمركي للحاوية',
    description: 'موعد فحص الحاوية ومطابقة المستندات بجمارك المنطقة الحرة',
    startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    startTime: '09:00',
    endTime: '10:00'
  });
  const [calendarActionMessage, setCalendarActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // تصدير المعاملات إلى شيت
  const handleExportSheets = async () => {
    if (!token) return;
    setIsExportingSheets(true);
    setExportedSheetUrl(null);
    try {
      const url = await exportToSheets(shipments, token);
      setExportedSheetUrl(url);
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء التصدير لـ Google Sheets. يرجى التحقق من الصلاحيات.');
    } finally {
      setIsExportingSheets(false);
    }
  };

  // استيراد الشحنات من شيت
  const handleImportSheets = async () => {
    if (!token || !sheetImportId.trim()) return;
    setIsImportingSheets(true);
    setImportMessage(null);
    try {
      // استخلاص معرّف جدول البيانات من الرابط إن قام المستخدم بإدخال الرابط كاملاً
      let spreadsheetId = sheetImportId.trim();
      if (spreadsheetId.includes('/d/')) {
        const parts = spreadsheetId.split('/d/');
        if (parts[1]) {
          spreadsheetId = parts[1].split('/')[0];
        }
      }

      const partialShipments = await importFromSheets(spreadsheetId, token);
      if (partialShipments.length === 0) {
        setImportMessage({ type: 'error', text: 'لم يتم العثور على أي بيانات بداخل جدول البيانات.' });
        return;
      }

      // تحويل الشحنات الجزئية لشحنات كاملة
      const fullShipments: Shipment[] = partialShipments.map((ps, index) => ({
        id: `ship_sheet_${Date.now()}_${index}`,
        code: ps.code || `YE-${Math.floor(10000 + Math.random() * 90000)}`,
        title: ps.title || 'شحنة مستوردة',
        cargoType: ps.cargoType || 'electronics',
        supplier: ps.supplier || 'مورد مستورد',
        countryOfOrigin: ps.countryOfOrigin || 'الصين',
        portOfDischarge: ps.portOfDischarge || 'ميناء عدن الدولي (الحاويات)',
        containerNumber: ps.containerNumber || 'MSCU000000-0',
        weight: ps.weight || 10,
        valueUSD: ps.valueUSD || 25000,
        valueLocal: ps.valueLocal || 25000 * 1350,
        carrierName: ps.carrierName || 'Maersk Line (ميرسك)',
        currentStatus: ps.currentStatus || 'purchased',
        documents: [], // سيتم توليدها تلقائياً بالبرنامج الأساسي
        logs: [
          {
            id: `log_import_${Date.now()}_${index}`,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            status: ps.currentStatus || 'purchased',
            message: 'تم استيراد هذه الشحنة وتأسيسها حياً من جدول بيانات Google Sheets الموثق.',
            userAction: true
          }
        ],
        hsCode: ps.hsCode,
        dutyRate: 0.05,
        inspectionChannel: ps.inspectionChannel || 'yellow',
        labResult: 'pending',
        dutiesPaid: false,
        transitProgress: 0,
        createdAt: ps.createdAt || new Date().toISOString().split('T')[0]
      }));

      onImportShipments(fullShipments);
      setImportMessage({ type: 'success', text: `تم استيراد ومزامنة عدد ${fullShipments.length} شحنة بنجاح من Google Sheets!` });
      setSheetImportId('');
    } catch (err: any) {
      console.error(err);
      setImportMessage({ type: 'error', text: 'فشل الاستيراد. تأكد من أن جدول البيانات يحتوي على ورقة باسم Sheet1 ومكتوب بالشكل الصحيح ورابطه متاح.' });
    } finally {
      setIsImportingSheets(false);
    }
  };

  // توليد مستند Google Doc للشحنة المحددة
  const handleGenerateDoc = async () => {
    if (!token || !selectedShipmentId) return;
    const targetShipment = shipments.find(s => s.id === selectedShipmentId);
    if (!targetShipment) return;

    setIsGeneratingDoc(true);
    setGeneratedDocUrl(null);
    try {
      const url = await generateDocsReport(targetShipment, token);
      setGeneratedDocUrl(url);
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء إصدار التقرير على Google Docs. يرجى إعادة المحاولة.');
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  // جلب جهات اتصال جوجل
  const handleLoadContacts = async () => {
    if (!token) return;
    setIsLoadingContacts(true);
    setContacts([]);
    try {
      const list = await getGoogleContacts(token);
      setContacts(list);
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء جلب جهات الاتصال من Google. يرجى التحقق من الربط.');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // إنشاء جهة اتصال جديدة
  const handleCreateContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!contactForm.name.trim()) return;

    setIsSavingContact(true);
    setContactActionMessage(null);
    try {
      await createGoogleContact(contactForm, token);
      setContactActionMessage({ type: 'success', text: 'تم حفظ جهة الاتصال حياً في حساب Google Contacts بنجاح!' });
      setContactForm({ name: '', phone: '', email: '', org: '' });
      // تحديث القائمة فوراً
      handleLoadContacts();
    } catch (err: any) {
      console.error(err);
      setContactActionMessage({ type: 'error', text: 'فشل حفظ جهة الاتصال في Google Contacts.' });
    } finally {
      setIsSavingContact(false);
    }
  };

  // إرسال بريد إلكتروني عبر Gmail بخصوص شحنة جمركية محددة
  const handleSendGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!gmailTo.trim() || !gmailSubject.trim()) {
      alert('يرجى ملء الحقول المطلوبة لإرسال البريد الإلكتروني.');
      return;
    }

    setIsSendingEmail(true);
    setEmailActionMessage(null);
    try {
      // بناء جسم البريد الإلكتروني (HTML) بناء على الشحنة المحددة
      let bodyText = customEmailBody;
      if (!bodyText.trim() && selectedGmailShipmentId) {
        const s = shipments.find(item => item.id === selectedGmailShipmentId);
        if (s) {
          bodyText = `
            <div style="direction: rtl; font-family: sans-serif; padding: 25px; background-color: #0f172a; color: #ffffff; border: 1px solid #1e293b; border-radius: 16px; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="color: #10b981; font-size: 20px; margin: 0;">مكتب طه رضوان للخدمات اللوجستية والتخليص الجمركي</h1>
                <p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0 0;">إشعار ومعاملة جمركية موحدة - مصلحة الجمارك بالجمهورية اليمنية</p>
              </div>
              <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">السلام عليكم ورحمة الله وبركاته،</p>
              <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">يسعدنا إفادتكم ببيان وتفاصيل حالة الشحنة المسجلة برمز <strong>${s.code}</strong> الموثقة ببرامجنا حياً وسحابياً:</p>
              
              <div style="background-color: #1e293b; padding: 15px; border-radius: 12px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: right;">
                  <tr style="border-bottom: 1px solid #334155;">
                    <td style="padding: 10px 0; color: #94a3b8; font-weight: bold; width: 35%;">مسمى الشحنة</td>
                    <td style="padding: 10px 0; color: #ffffff;">${s.title}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #334155;">
                    <td style="padding: 10px 0; color: #94a3b8; font-weight: bold;">المورد وبلد المنشأ</td>
                    <td style="padding: 10px 0; color: #ffffff;">${s.supplier} (${s.countryOfOrigin})</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #334155;">
                    <td style="padding: 10px 0; color: #94a3b8; font-weight: bold;">منفذ التوصيل</td>
                    <td style="padding: 10px 0; color: #ffffff;">${s.portOfDischarge}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #334155;">
                    <td style="padding: 10px 0; color: #94a3b8; font-weight: bold;">رقم الحاوية</td>
                    <td style="padding: 10px 0; color: #ffffff; font-family: monospace;">${s.containerNumber}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #334155;">
                    <td style="padding: 10px 0; color: #94a3b8; font-weight: bold;">قيمة الشحنة</td>
                    <td style="padding: 10px 0; color: #10b981; font-weight: bold;">${s.valueUSD.toLocaleString()} $ USD</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #94a3b8; font-weight: bold;">الحالة الجمركية الحالية</td>
                    <td style="padding: 10px 0; color: #3b82f6; font-weight: bold;">${s.currentStatus}</td>
                  </tr>
                </table>
              </div>
              
              <p style="font-size: 13px; line-height: 1.6; color: #94a3b8;">إذا كان لديكم أي استفسار، لا تترددوا بالرد مباشرة على هذا البريد الإلكتروني.</p>
              <div style="border-top: 1px solid #334155; padding-top: 15px; margin-top: 25px; text-align: center; font-size: 11px; color: #64748b;">
                طه رضوان للخدمات اللوجستية © 2026. جميع الحقوق محفوظة.
              </div>
            </div>
          `;
        }
      }

      if (!bodyText.trim()) {
        bodyText = `<h3>تقرير حركة البضائع من مكتب طه رضوان</h3><p>يرجى متابعة لوحة التحكم الموحدة.</p>`;
      }

      await sendGmailEmail(gmailTo.trim(), gmailSubject.trim(), bodyText, token);
      setEmailActionMessage({ type: 'success', text: 'تم إرسال البريد الإلكتروني بنجاح عبر Gmail!' });
      setGmailTo('');
      setCustomEmailBody('');
    } catch (err: any) {
      console.error(err);
      setEmailActionMessage({ type: 'error', text: 'فشل إرسال البريد الإلكتروني. تأكد من تفعيل الصلاحية وصحة البريد.' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // توليد عرض تقديمي في Google Slides لتقرير الشحنات
  const handleGenerateSlides = async () => {
    if (!token) return;
    setIsGeneratingSlides(true);
    setGeneratedSlidesUrl(null);
    try {
      const url = await generateSlidesReport(shipments, token);
      setGeneratedSlidesUrl(url);
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء توليد عرض Slides التقديمي. يرجى تكرار المحاولة وصحة الصلاحيات.');
    } finally {
      setIsGeneratingSlides(false);
    }
  };

  // جلب مساحات وقنوات Google Chat للمستخدم
  const handleLoadChatSpaces = async () => {
    if (!token) return;
    setIsLoadingSpaces(true);
    setChatSpaces([]);
    try {
      const list = await getGoogleChatSpaces(token);
      setChatSpaces(list);
      if (list.length > 0) {
        setSelectedSpaceName(list[0].name);
      } else {
        alert('لم يتم العثور على أي مساحات (Spaces) نشطة في حساب Google Chat الخاص بك.');
      }
    } catch (err: any) {
      console.error(err);
      alert('فشل جلب مساحات Google Chat. تأكد من تفعيل صلاحيات Chat والربط.');
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  // إرسال رسالة فورية إلى مساحة Google Chat المحددة
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedSpaceName || !chatMessage.trim()) return;

    setIsSendingChatMessage(true);
    try {
      await sendGoogleChatMessage(selectedSpaceName, chatMessage.trim(), token);
      setChatMessage('');
      alert('✓ تم نشر الرسالة وإرسالها حياً لمساحة Google Chat!');
    } catch (err: any) {
      console.error(err);
      alert('فشل إرسال الرسالة إلى Google Chat. تأكد من صلاحية الإرسال بداخل الغرفة/المساحة المحددة.');
    } finally {
      setIsSendingChatMessage(false);
    }
  };

  // جلب الأحداث والمواعيد القادمة من تقويم جوجل
  const handleLoadCalendarEvents = async () => {
    if (!token) return;
    setIsLoadingEvents(true);
    setCalendarEvents([]);
    try {
      const eventsList = await getGoogleCalendarEvents(token);
      setCalendarEvents(eventsList);
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء جلب مواعيد تقويم Google. يرجى التحقق من الصلاحيات والربط.');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // جدولة موعد جديد في تقويم جوجل بخصوص المعاملات الجمركية
  const handleScheduleCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // الحصول على الشحنة المحددة لتضمين تفاصيلها بالموعد
    const selectedShipment = shipments.find(s => s.id === selectedCalendarShipmentId);
    let finalSummary = calendarForm.summary;
    let finalDescription = calendarForm.description;

    if (selectedShipment) {
      finalSummary = `${calendarForm.summary} - شحنة ${selectedShipment.code}`;
      finalDescription = `${calendarForm.description}\n\nتفاصيل الشحنة:\n- الرمز: ${selectedShipment.code}\n- البضاعة: ${selectedShipment.title}\n- الميناء: ${selectedShipment.portOfDischarge}\n- رقم الحاوية: ${selectedShipment.containerNumber}\n- الوزن: ${selectedShipment.weight} طن`;
    }

    // تأكيد المستخدم الإجباري قبل إجراء التعديل (Mutating Operation Confirmation)
    const confirmed = window.confirm(
      `هل أنت متأكد من رغبتك في جدولة وإضافة هذا الموعد إلى تقويم جوجل (Google Calendar) الخاص بك؟\n\nالموعد: ${finalSummary}\nالتاريخ: ${calendarForm.startDate}\nالوقت: من ${calendarForm.startTime} إلى ${calendarForm.endTime}`
    );
    if (!confirmed) return;

    setIsSchedulingEvent(true);
    setCalendarActionMessage(null);

    // بناء الصيغة الكاملة لتاريخ ووقت البداية والنهاية
    const startISO = `${calendarForm.startDate}T${calendarForm.startTime}:00`;
    const endISO = `${calendarForm.startDate}T${calendarForm.endTime}:00`;

    try {
      await createGoogleCalendarEvent({
        summary: finalSummary,
        description: finalDescription,
        startDateTime: startISO,
        endDateTime: endISO
      }, token);

      setCalendarActionMessage({ type: 'success', text: '✓ تم جدولة وإضافة الموعد بنجاح إلى تقويم Google الخاص بك!' });
      // إعادة تحميل قائمة المواعيد لمزامنتها حياً فوراً
      handleLoadCalendarEvents();
    } catch (err: any) {
      console.error(err);
      setCalendarActionMessage({ type: 'error', text: 'فشل جدولة الموعد في تقويم Google. تأكد من تفعيل صلاحيات التقويم.' });
    } finally {
      setIsSchedulingEvent(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-8 text-right font-sans">
      
      {/* رأس تبويب الربط والمزامنة السحابية */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-emerald-500">⚡</span>
            <span>بوابة التكامل الرقمي مع خدمات Google Workspace</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">تصدير المعاملات الجمركية واستيرادها والتحكم بالملفات والعملاء مباشرة من حساب Google الخاص بك</p>
        </div>

        {/* زر التوثيق والربط للخدمات */}
        {!token ? (
          <button
            onClick={onLoginWorkspace}
            disabled={isLoggingIn}
            className="gsi-material-button flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-2xl transition-all shadow-md cursor-pointer text-xs"
          >
            {isLoggingIn ? (
              <Loader2 size={16} className="animate-spin text-white" />
            ) : (
              <Lock size={14} className="text-emerald-200" />
            )}
            <span>ربط وتفعيل خدمات Google Workspace</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-2xl">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-400 font-bold">بوابة Google Workspace متصلة وحية</span>
          </div>
        )}
      </div>

      {/* في حال لم يتم التفعيل بعد */}
      {!token && (
        <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
          <AlertCircle className="text-amber-500 shrink-0" size={24} />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-400">يلزم تسجيل الدخول وربط الحساب</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              للاستفادة الكاملة من المزايا المتقدمة لنظام طه رضوان اللوجستي مثل المزامنة المباشرة مع جداول بيانات Google Sheets، وإصدار مستندات جمركية بصيغة Google Docs، وجلب أو تصدير جهات الاتصال والمستوردين من Google Contacts، يرجى تفعيل الربط عبر النقر على زر التفعيل بالأعلى.
            </p>
          </div>
        </div>
      )}

      {/* الأقسام الثلاثة للتكامل */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-opacity duration-300 ${!token ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        
        {/* القسم الأول: Google Sheets */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">تكامل جداول البيانات (Sheets)</h3>
                <span className="text-[9px] text-slate-400">تصدير المعاملات الجمركية واستيرادها حياً</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-300 leading-relaxed">
              يمكّنك هذا الخيار من حفظ كافة المعاملات الجمركية لطه رضوان اللوجستية وتفاصيل حاوياتها بقيمها ورسومها وأوزانها في جدول Google Sheets جديد لمشاركته والعمل عليه.
            </p>

            {/* زر التصدير */}
            <div className="pt-2">
              <button
                onClick={handleExportSheets}
                disabled={isExportingSheets || !token}
                className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isExportingSheets ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                <span>تصدير المعاملات إلى Google Sheets</span>
              </button>

              {exportedSheetUrl && (
                <div className="mt-2.5 bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl text-right">
                  <span className="text-[10px] text-emerald-400 font-bold block mb-1">✓ تم التصدير بنجاح!</span>
                  <a 
                    href={exportedSheetUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded border border-slate-700 transition-colors"
                  >
                    <span>عرض جدول البيانات المفتوح</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* نموذج الاستيراد */}
          <div className="border-t border-slate-800 pt-4 space-y-2">
            <h4 className="text-[10px] font-bold text-white">استيراد شحنات من جدول Google Sheets</h4>
            <div className="space-y-1.5">
              <input 
                type="text" 
                placeholder="أدخل معرّف الجدول (Spreadsheet ID) أو رابطه..." 
                value={sheetImportId}
                onChange={(e) => setSheetImportId(e.target.value)}
                className="w-full text-[10px] px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-white focus:border-emerald-500 outline-none text-left"
              />
              <button
                onClick={handleImportSheets}
                disabled={isImportingSheets || !sheetImportId.trim() || !token}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold py-2 px-3 rounded-lg border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                {isImportingSheets ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Upload size={12} />
                )}
                <span>استيراد ومزامنة البيانات</span>
              </button>
            </div>

            {importMessage && (
              <p className={`text-[10px] p-1.5 rounded ${importMessage.type === 'success' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/30' : 'bg-rose-950/50 text-rose-400 border border-rose-900/30'}`}>
                {importMessage.text}
              </p>
            )}
          </div>
        </div>

        {/* القسم الثاني: Google Docs */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <div className="bg-blue-500/10 p-2 rounded-xl text-blue-400">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">إصدار مستندات رسمية (Docs)</h3>
                <span className="text-[9px] text-slate-400">توليد بيانات ووثائق التخليص الموحدة</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-300 leading-relaxed">
              اختر أي شحنة مسجلة حالياً بالبرنامج وسيقوم النظام بتوليد مستند جمركي متكامل يحوي مواصفاتها ورسومها ومسارها وحركات الدورة الجمركية وحفظها ببيان رسمي على Google Docs.
            </p>

            {/* منشئ المستندات */}
            <div className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 block font-bold">حدد الشحنة المستهدفة لإصدار المستند:</label>
                <select
                  value={selectedShipmentId}
                  onChange={(e) => setSelectedShipmentId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-white outline-none cursor-pointer focus:border-emerald-500"
                >
                  <option value="" disabled>--- اختر شحنة من القائمة ---</option>
                  {shipments.map(s => (
                    <option key={s.id} value={s.id}>{s.code} - {s.title}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleGenerateDoc}
                disabled={isGeneratingDoc || !selectedShipmentId || !token}
                className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isGeneratingDoc ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FileText size={14} />
                )}
                <span>إنشاء مستند تخليص رسمي جمركياً</span>
              </button>

              {generatedDocUrl && (
                <div className="mt-2.5 bg-blue-950/40 border border-blue-500/30 p-2.5 rounded-xl text-right">
                  <span className="text-[10px] text-blue-400 font-bold block mb-1">✓ تم إنشاء المستند بنجاح!</span>
                  <a 
                    href={generatedDocUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded border border-slate-700 transition-colors"
                  >
                    <span>فتح المستند في Google Docs</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="text-[9px] text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            📌 سيتم حفظ المستند تلقائياً في مجلد Drive الخاص بك تحت حساب Google المرتبط.
          </div>
        </div>

        {/* القسم الثالث: Google Contacts */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400">
                <Users size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">إدارة جهات اتصال Google Contacts</h3>
                <span className="text-[9px] text-slate-400">ربط وتصدير بيانات المستوردين والتجار</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-300 leading-relaxed">
              إدارة مستوردي البضائع وربطهم من دليل Google Contacts الخاص بك أو تسجيل بيانات عميل جديد في حسابك مباشرة للتنسيق والاتصال السريع بخصوص الفسح والتفتيش.
            </p>

            {/* استيراد وعرض جهات الاتصال */}
            <div className="space-y-2">
              <button
                onClick={handleLoadContacts}
                disabled={isLoadingContacts || !token}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold py-2 px-3 rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoadingContacts ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Contact size={14} className="text-indigo-400" />
                )}
                <span>استيراد جهات الاتصال من Google</span>
              </button>

              {contacts.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 max-h-[140px] overflow-y-auto space-y-1.5">
                  <span className="text-[8px] text-slate-400 font-bold block mb-1">دليل مستوردي Google ({contacts.length} جهة):</span>
                  {contacts.slice(0, 8).map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[9px] border-b border-slate-800 pb-1 last:border-0">
                      <div>
                        <span className="text-white font-bold block">{c.name}</span>
                        <span className="text-slate-400 block text-[8px]">{c.org} {c.phone}</span>
                      </div>
                      <button
                        onClick={() => {
                          onLinkContactToShipment(c.name);
                          alert(`تم ربط العميل المستورد "${c.name}" بنجاح!`);
                        }}
                        className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white px-2 py-0.5 rounded text-[8px] transition-colors"
                      >
                        ربط
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* إضافة مستورد جديد */}
          <form onSubmit={handleCreateContactSubmit} className="border-t border-slate-800 pt-4 space-y-2">
            <h4 className="text-[10px] font-bold text-white flex items-center gap-1">
              <UserPlus size={11} className="text-emerald-400" />
              <span>تسجيل مستورد جديد في Google Contacts</span>
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              <input 
                type="text" 
                placeholder="الاسم الكامل للتاجر..." 
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                className="w-full text-[9px] px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white outline-none focus:border-indigo-500"
                required
              />
              <input 
                type="text" 
                placeholder="الرقم (مثال: +967...)" 
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                className="w-full text-[9px] px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white outline-none focus:border-indigo-500 text-left"
              />
              <input 
                type="email" 
                placeholder="البريد الإلكتروني..." 
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                className="w-full text-[9px] px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white outline-none focus:border-indigo-500 text-left"
              />
              <input 
                type="text" 
                placeholder="الشركة (مثال: سبأ للتجارة)" 
                value={contactForm.org}
                onChange={(e) => setContactForm({ ...contactForm, org: e.target.value })}
                className="w-full text-[9px] px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingContact || !contactForm.name.trim() || !token}
              className="w-full flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingContact ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <Plus size={10} />
              )}
              <span>حفظ التاجر بجهات اتصال Google</span>
            </button>

            {contactActionMessage && (
              <p className={`text-[9px] p-1.5 rounded ${contactActionMessage.type === 'success' ? 'bg-emerald-950/50 text-emerald-400' : 'bg-rose-950/50 text-rose-400'}`}>
                {contactActionMessage.text}
              </p>
            )}
          </form>
        </div>

        {/* القسم الرابع: Gmail (البريد الإلكتروني الموثق) */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <div className="bg-rose-500/10 p-2 rounded-xl text-rose-400">
                <Mail size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">إرسال تقارير وإشعارات (Gmail)</h3>
                <span className="text-[9px] text-slate-400">مراسلة التجار والعملاء مباشرة وحياً</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-300 leading-relaxed">
              توجيه خطابات رسمية وتقارير حاويات جمركية ببيان أسعارها ومسارها وموانئ تفريغها إلكترونياً إلى بريد العميل بنقرة واحدة عبر خوادم Google Gmail الموثقة.
            </p>

            <form onSubmit={handleSendGmail} className="space-y-2">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 block font-bold">البريد الإلكتروني المستلم:</label>
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={gmailTo}
                  onChange={(e) => setGmailTo(e.target.value)}
                  className="w-full text-[10px] px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white outline-none focus:border-rose-500 text-left"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 block font-bold">عنوان الرسالة:</label>
                <input 
                  type="text" 
                  placeholder="عنوان البريد..." 
                  value={gmailSubject}
                  onChange={(e) => setGmailSubject(e.target.value)}
                  className="w-full text-[10px] px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 block font-bold">تضمين تفاصيل شحنة مفصلة جمركياً:</label>
                <select
                  value={selectedGmailShipmentId}
                  onChange={(e) => setSelectedGmailShipmentId(e.target.value)}
                  className="w-full text-[10px] px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white outline-none focus:border-rose-500"
                >
                  <option value="">-- بدون شحنة محددة (نص مخصص) --</option>
                  {shipments.map(s => (
                    <option key={s.id} value={s.id}>{s.code} - {s.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 block font-bold">رسالة مخصصة (اختياري):</label>
                <textarea 
                  rows={2}
                  placeholder="اكتب ملاحظات إضافية هنا لتضمينها..." 
                  value={customEmailBody}
                  onChange={(e) => setCustomEmailBody(e.target.value)}
                  className="w-full text-[9px] px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSendingEmail || !gmailTo.trim() || !token}
                className="w-full flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSendingEmail ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Send size={11} />
                )}
                <span>إرسال الإشعار الجمركي الآن</span>
              </button>

              {emailActionMessage && (
                <p className={`text-[9px] p-1.5 rounded text-center ${emailActionMessage.type === 'success' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/30' : 'bg-rose-950/50 text-rose-400 border border-rose-900/30'}`}>
                  {emailActionMessage.text}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* القسم الخامس: Google Slides (العروض التقديمية للتقارير) */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <div className="bg-amber-500/10 p-2 rounded-xl text-amber-400">
                <Presentation size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">عروض تقديمية وتقارير مرئية (Slides)</h3>
                <span className="text-[9px] text-slate-400">توليد ملفات العرض التقديمي للاستيراد السنوي</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-300 leading-relaxed">
              قم بإنشاء وتوليد ملف عرض تقديمي كامل (Google Slides Slide Deck) يحتوي على إحصائيات عامة، مجموع المعاملات، قيم الموانئ، والمسارات الرسمية لعرضها في اجتماعات الاستيراد والجمارك.
            </p>

            <div className="pt-2 space-y-3">
              <button
                onClick={handleGenerateSlides}
                disabled={isGeneratingSlides || !token}
                className="w-full flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isGeneratingSlides ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Presentation size={14} />
                )}
                <span>توليد وتصدير ملف العرض (Slides)</span>
              </button>

              {generatedSlidesUrl && (
                <div className="mt-2.5 bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-xl text-right">
                  <span className="text-[10px] text-amber-400 font-bold block mb-1">✓ تم إنشاء العرض التقديمي!</span>
                  <a 
                    href={generatedSlidesUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded border border-slate-700 transition-colors"
                  >
                    <span>عرض العرض التقديمي بـ Slides</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="text-[9px] text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            📌 يتم التصدير المباشر بتوليد شرائح ذكية، بوابات التوزيع، وبيانات حيازة البضائع لطه رضوان.
          </div>
        </div>

        {/* القسم السادس: Google Chat (الإشعارات والفرق) */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <div className="bg-sky-500/10 p-2 rounded-xl text-sky-400">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">تنبيهات غرف العمليات والفرق (Chat)</h3>
                <span className="text-[9px] text-slate-400">إرسال تنبيهات التخليص فورياً لغرف العمليات</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-300 leading-relaxed">
              اربط فريق المخلصين وسائقي الحاويات ومصلحة الميناء بقنوات دردشة حية على Google Chat لنشر مستجدات التفتيش والفسح الجمركي وتحديثات الحاويات حياً.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={handleLoadChatSpaces}
                disabled={isLoadingSpaces || !token}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold py-2 px-3 rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoadingSpaces ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RefreshCw size={12} className="text-sky-400" />
                )}
                <span>استرجاع غرف ومساحات Google Chat</span>
              </button>

              {chatSpaces.length > 0 && (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 block font-bold">اختر غرفة/مساحة الدردشة المستهدفة:</label>
                    <select
                      value={selectedSpaceName}
                      onChange={(e) => setSelectedSpaceName(e.target.value)}
                      className="w-full text-[10px] px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-white outline-none focus:border-sky-500"
                    >
                      {chatSpaces.map((space, idx) => (
                        <option key={idx} value={space.name}>
                          {space.displayName || `مساحة ${idx + 1} (${space.spaceType})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <form onSubmit={handleSendChatMessage} className="space-y-1.5">
                    <textarea 
                      rows={2}
                      placeholder="اكتب رسالة التنبيه للفريق..." 
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="w-full text-[9px] px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white outline-none focus:border-sky-500 resize-none"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSendingChatMessage || !chatMessage.trim() || !token}
                      className="w-full flex items-center justify-center gap-1 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all cursor-pointer"
                    >
                      {isSendingChatMessage ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Send size={10} />
                      )}
                      <span>إرسال التنبيه الفوري للغرفة</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* القسم السابع: Google Calendar (تقويم جوجل) */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <div className="bg-purple-500/10 p-2 rounded-xl text-purple-400">
                <Calendar size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">جدولة المواعيد والمعاينات (Calendar)</h3>
                <span className="text-[9px] text-slate-400">إدارة وتتبع مواعيد فحص وتوصيل الحاويات حياً</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-300 leading-relaxed">
              خطط وجدول مواعيد معاينة الحاويات، جلسات الفحص المخبري، وتواريخ الفسح مباشرة في تقويم جوجل الموثق لمشاركتها مع فريق التخليص ومندوبي مصلحة الجمارك.
            </p>

            {/* زر جلب المواعيد الحالية */}
            <div className="space-y-2">
              <button
                onClick={handleLoadCalendarEvents}
                disabled={isLoadingEvents || !token}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold py-2 px-3 rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoadingEvents ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RefreshCw size={12} className="text-purple-400" />
                )}
                <span>استعراض المواعيد القادمة في تقويم جوجل</span>
              </button>

              {calendarEvents.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 max-h-[140px] overflow-y-auto space-y-1.5 text-right">
                  <span className="text-[8px] text-slate-400 font-bold block mb-1">المواعيد المجدولة القادمة ({calendarEvents.length}):</span>
                  {calendarEvents.map((evt, idx) => (
                    <div key={idx} className="border-b border-slate-800 pb-1.5 last:border-0 text-[9px]">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold block truncate max-w-[150px]">{evt.summary}</span>
                        {evt.htmlLink && (
                          <a href={evt.htmlLink} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline text-[8px] inline-flex items-center gap-0.5">
                            <span>تفاصيل</span>
                            <ExternalLink size={8} />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[8px] text-slate-400 mt-0.5">
                        <Clock size={8} />
                        <span>
                          {new Date(evt.start).toLocaleString('ar-YE', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* نموذج جدولة موعد جديد */}
          <form onSubmit={handleScheduleCalendarEvent} className="border-t border-slate-800 pt-4 space-y-2 text-right">
            <h4 className="text-[10px] font-bold text-white flex items-center gap-1">
              <Plus size={11} className="text-purple-400" />
              <span>جدولة موعد فحص/معاينة جديد</span>
            </h4>

            <div className="space-y-1.5">
              <div className="space-y-0.5">
                <label className="text-[8px] text-slate-400 block font-bold">ربط الموعد بشحنة جمركية:</label>
                <select
                  value={selectedCalendarShipmentId}
                  onChange={(e) => setSelectedCalendarShipmentId(e.target.value)}
                  className="w-full text-[9px] px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white outline-none focus:border-purple-500"
                >
                  <option value="">-- بدون ربط بشحنة (موعد عام) --</option>
                  {shipments.map(s => (
                    <option key={s.id} value={s.id}>{s.code} - {s.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div className="space-y-0.5">
                  <label className="text-[8px] text-slate-400 block font-bold">عنوان الموعد:</label>
                  <input 
                    type="text" 
                    placeholder="عنوان الحدث..." 
                    value={calendarForm.summary}
                    onChange={(e) => setCalendarForm({ ...calendarForm, summary: e.target.value })}
                    className="w-full text-[9px] px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] text-slate-400 block font-bold">التاريخ:</label>
                  <input 
                    type="date" 
                    value={calendarForm.startDate}
                    onChange={(e) => setCalendarForm({ ...calendarForm, startDate: e.target.value })}
                    className="w-full text-[9px] px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white outline-none focus:border-purple-500 text-left"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div className="space-y-0.5">
                  <label className="text-[8px] text-slate-400 block font-bold">وقت البداية:</label>
                  <input 
                    type="time" 
                    value={calendarForm.startTime}
                    onChange={(e) => setCalendarForm({ ...calendarForm, startTime: e.target.value })}
                    className="w-full text-[9px] px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white outline-none focus:border-purple-500 text-left"
                    required
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] text-slate-400 block font-bold">وقت النهاية:</label>
                  <input 
                    type="time" 
                    value={calendarForm.endTime}
                    onChange={(e) => setCalendarForm({ ...calendarForm, endTime: e.target.value })}
                    className="w-full text-[9px] px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white outline-none focus:border-purple-500 text-left"
                    required
                  />
                </div>
              </div>

              <div className="space-y-0.5">
                <label className="text-[8px] text-slate-400 block font-bold">الوصف والتفاصيل:</label>
                <textarea 
                  rows={2}
                  placeholder="اكتب ملاحظات إضافية بخصوص الموعد..." 
                  value={calendarForm.description}
                  onChange={(e) => setCalendarForm({ ...calendarForm, description: e.target.value })}
                  className="w-full text-[9px] px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white outline-none focus:border-purple-500 resize-none font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSchedulingEvent || !token}
              className="w-full flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSchedulingEvent ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Calendar size={13} />
              )}
              <span>إرسال وتثبيت الموعد بـ Calendar</span>
            </button>

            {calendarActionMessage && (
              <p className={`text-[9px] p-1.5 rounded text-center ${calendarActionMessage.type === 'success' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/30' : 'bg-rose-950/50 text-rose-400 border border-rose-900/30'}`}>
                {calendarActionMessage.text}
              </p>
            )}
          </form>
        </div>

      </div>

    </div>
  );
}
