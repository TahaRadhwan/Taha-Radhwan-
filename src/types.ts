/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CargoType = 'electronics' | 'food' | 'clothes' | 'industrial' | 'cars' | 'medical' | 'chemicals' | 'building' | 'agriculture';

export type DocumentType = 
  | 'invoice' 
  | 'packing_list' 
  | 'origin' 
  | 'quality' 
  | 'lading' 
  | 'declaration' 
  | 'release';

export type CustomsStatus =
  | 'purchased'            // تم الشراء وطلب البضاعة
  | 'docs_ready'           // تجهيز المستندات والوثائق
  | 'arrived_at_port'      // وصول الحاوية للميناء والمناولة
  | 'declaration_submitted'// تقديم البيان الجمركي والترميز
  | 'inspection'           // المعاينة الجمركية والتفتيش
  | 'lab_testing'          // فحص الهيئة العامة للمواصفات والمقاييس
  | 'payment_pending'      // احتساب وسداد الرسوم والضرائب
  | 'released'             // صدور إذن الفسح والخروج من الميناء
  | 'in_transit'           // النقل البري قيد الترانزيت
  | 'delivered';           // وصول الشحنة وتفريغها بمخازن التاجر

export interface Document {
  id: string;
  type: DocumentType;
  title: string; // بالعربية
  fileNumber: string;
  issuer: string;
  issueDate: string;
  status: 'missing' | 'draft' | 'completed';
  content: {
    invoiceNumber?: string;
    invoiceValue?: number;
    currency?: string;
    items?: Array<{ name: string; qty: number; unitPrice: number; total: number }>;
    totalWeight?: number;
    containerCount?: number;
    containerNumbers?: string[];
    originCountry?: string;
    certificateNumber?: string;
    labNotes?: string;
    hsCode?: string;
    dutiesAmount?: number;
    vatAmount?: number;
    portFees?: number;
  };
}

export interface LogEntry {
  id: string;
  timestamp: string;
  status: CustomsStatus;
  message: string;
  userAction?: boolean;
}

export interface SmsMessage {
  id: string;
  phoneNumber: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'failed';
  type: 'declaration' | 'payment' | 'completion' | 'custom';
}

export interface Shipment {
  id: string;
  code: string; // رمز الشحنة المرجعي (مثال: CL-90823)
  title: string;
  cargoType: CargoType;
  supplier: string;
  countryOfOrigin: string;
  portOfDischarge: string; // ميناء التخليص
  containerNumber: string; // رقم الحاوية
  weight: number; // بالطن
  valueUSD: number; // القيمة بالدولار
  valueLocal: number; // القيمة بالعملة المحلية
  carrierName: string; // شركة الملاحة
  currentStatus: CustomsStatus;
  documents: Document[];
  logs: LogEntry[];
  hsCode?: string; // الترميز الجمركي
  dutyRate?: number; // نسبة الرسوم الجمركية %
  inspectionChannel?: 'green' | 'yellow' | 'red'; // المسار الجمركي
  inspectionNotes?: string;
  labResult?: 'passed' | 'failed' | 'pending';
  dutiesPaid: boolean;
  transitProgress: number; // نسبة مسار النقل (0 - 100)
  createdAt: string;
  deliveredAt?: string;
  direction?: 'import' | 'export';
  clientName?: string;
  clientPhone?: string;
  smsMessages?: SmsMessage[];
  trackingNumber?: string;
  estimatedArrival?: string;
  currentLocation?: string;
  customsClearedAt?: string;
  readyForPickupAt?: string;
}

export interface HSCodeItem {
  code: string;
  nameAr: string;
  dutyRate: number; // نسبة مئوية (مثال: 0.05 لـ 5%)
  requiresSpecialInspection: boolean;
  requiredDocuments: DocumentType[];
}

export interface AppNotification {
  id: string;
  shipmentId?: string;
  shipmentCode?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'delay';
  timestamp: string;
  isRead: boolean;
  category: 'docs' | 'customs' | 'deadline' | 'delay';
}

export interface AlertConfig {
  enableDocsArrival: boolean;
  enableCustomsStart: boolean;
  enableDeadlineApproaching: boolean;
  enablePotentialDelays: boolean;
  deadlineThresholdDays: number;
  soundEnabled: boolean;
}

