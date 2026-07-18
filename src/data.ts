/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CustomsStatus, CargoType, HSCodeItem, Shipment, Document } from './types';

export interface TimelineStepDetail {
  status: CustomsStatus;
  titleAr: string;
  titleEn: string;
  descAr: string;
  checkpointAr: string;
}

export const TIMELINE_STEPS: TimelineStepDetail[] = [
  {
    status: 'purchased',
    titleAr: 'الشراء والطلب',
    titleEn: 'Purchase & Order',
    descAr: 'شراء البضاعة من المورد الأجنبي، وتوقيع العقد التجاري وتأكيد شروط الشحن الدولية (Incoterms) مثل (CIF, FOB, EXW).',
    checkpointAr: 'إصدار أمر الشراء (PO) وتأكيد الدفع للمورد الخارجي.'
  },
  {
    status: 'docs_ready',
    titleAr: 'تجهيز المستندات والوثائق',
    titleEn: 'Document Preparation',
    descAr: 'استلام وتجهيز الوثائق الأصلية: الفاتورة، قائمة التعبئة، شهادة المنشأ، بوليصة الشحن، وشهادة الجودة المطابقة.',
    checkpointAr: 'اكتمال الوثائق الخمس الأساسية بصيغتها الرسمية.'
  },
  {
    status: 'arrived_at_port',
    titleAr: 'وصول الميناء والمناولة',
    titleEn: 'Port Arrival & Handling',
    descAr: 'وصول الباخرة أو الحاوية للميناء، تسجيل مانيفست الشحنة، تفريغ الحاوية في الساحات، والحصول على إشعار الوصول (Arrival Notice).',
    checkpointAr: 'استلام إشعار تفريغ الحاوية وبدء معاملة الميناء.'
  },
  {
    status: 'declaration_submitted',
    titleAr: 'تقديم البيان الجمركي',
    titleEn: 'Customs Declaration',
    descAr: 'إدخال بيانات الشحنة وتصنيفها بالترميز الجمركي الموحد (HS Code)، وتقديم البيان الجمركي (المنصة الموحدة أو نظام ديلفار).',
    checkpointAr: 'الحصول على رقم القيد الجمركي وتحديد بنود التعرفة.'
  },
  {
    status: 'inspection',
    titleAr: 'المعاينة الجمركية والتفتيش',
    titleEn: 'Customs Inspection',
    descAr: 'فرز المعاملة جمركياً عبر نظام المخاطر لتحديد المسار (الأخضر، الأصفر، الأحمر). يتطلب المسار الأحمر الفحص بالأشعة والمعاينة اليدوية العينية.',
    checkpointAr: 'اجتياز المعاينة الجمركية ومطابقة المشمول لبيان الجمرك.'
  },
  {
    status: 'lab_testing',
    titleAr: 'فحص المواصفات والمقاييس',
    titleEn: 'Quality & Lab Testing',
    descAr: 'سحب عينات من الشحنة (خاصة الأغذية، الكيماويات، والأجهزة) لفحصها مخبرياً للتأكد من مطابقتها للمواصفات والمقاييس الوطنية وضبط الجودة.',
    checkpointAr: 'صدور تقرير المخبر بمطابقة الشحنة للمواصفات وصلاحيتها.'
  },
  {
    status: 'payment_pending',
    titleAr: 'احتساب وسداد الرسوم والضرائب',
    titleEn: 'Duties & Taxes Payment',
    descAr: 'احتساب الرسوم الجمركية المستحقة بناءً على بند التعرفة (HS Code)، وإضافة ضريبة القيمة المضافة (VAT) ورسوم الميناء والأرضيات والمناولة.',
    checkpointAr: 'سداد الفاتورة الموحدة للجمارك والميناء إلكترونياً بالكامل.'
  },
  {
    status: 'released',
    titleAr: 'صدور الفسح وإذن التسليم',
    titleEn: 'Customs Release',
    descAr: 'الحصول على إذن التسليم النهائي من الخط الملاحي، وصدور الفسح الجمركي النهائي، وفك الارتباط بالميناء تمهيداً لخروج الحاوية.',
    checkpointAr: 'طباعة بطاقة البوابة وإذن خروج الحاوية من الميناء.'
  },
  {
    status: 'in_transit',
    titleAr: 'النقل البري والترانزيت',
    titleEn: 'Land Transport & Transit',
    descAr: 'تحميل الحاوية على الشاحنة الناقلة، تفعيل قفل الأمان والختم الجمركي، وتحرك الشاحنة برياً وتتبع مسارها حتى مستودعات التاجر.',
    checkpointAr: 'تتبع الشاحنة جغرافياً وضمان سلامة الختم الجمركي على الحاوية.'
  },
  {
    status: 'delivered',
    titleAr: 'الوصول للمخازن والتفريغ',
    titleEn: 'Warehouse Delivery & Unloading',
    descAr: 'وصول الشاحنة لمخازن التاجر، مطابقة الأختام، فك الختم الجمركي، جرد البضاعة ومقارنتها بقائمة التعبئة وتخزينها رسمياً بالرفوف.',
    checkpointAr: 'توقيع سند استلام الشحنة وإغلاق ملف الدورة الجمركية بنجاح.'
  }
];

export const HS_CODES: Record<CargoType, HSCodeItem> = {
  electronics: {
    code: '8517.13.00',
    nameAr: 'أجهزة هواتف ذكية لاسلكية خلوية',
    dutyRate: 0.05, // 5%
    requiresSpecialInspection: true, // يتطلب فحص هيئة الاتصالات / المواصفات
    requiredDocuments: ['invoice', 'packing_list', 'origin', 'quality', 'lading']
  },
  food: {
    code: '0406.90.10',
    nameAr: 'أجبان قشقوان وألبان معلبة طازجة وخاضعة للحجر الصحي',
    dutyRate: 0.10, // 10%
    requiresSpecialInspection: true, // يتطلب حجر صحي وزراعي وفحص مخبري دقيق
    requiredDocuments: ['invoice', 'packing_list', 'origin', 'quality', 'lading']
  },
  clothes: {
    code: '6109.10.00',
    nameAr: 'قمصان وتيشرتات جاهزة من قطن مغزول ومطرز',
    dutyRate: 0.15, // 15%
    requiresSpecialInspection: false,
    requiredDocuments: ['invoice', 'packing_list', 'origin', 'lading']
  },
  industrial: {
    code: '8414.59.00',
    nameAr: 'ضواغط هواء ومولدات طاقة ومحركات مخصصة للمصانع',
    dutyRate: 0.02, // 2% تشجيعاً للصناعة الوطنية
    requiresSpecialInspection: true, // فحص جودة ومطابقة السلامة المهنية
    requiredDocuments: ['invoice', 'packing_list', 'origin', 'quality', 'lading']
  },
  cars: {
    code: '8703.23.34',
    nameAr: 'سيارات ركوب سياحية ذات محركات بنزين سعة 2000 سي سي',
    dutyRate: 0.20, // 20% رسوم جمركية مرتفعة للسيارات الفاخرة
    requiresSpecialInspection: true, // فحص مطابقة مواصفات سلامة المركبات (SASO) ورقم الشاصيه
    requiredDocuments: ['invoice', 'packing_list', 'origin', 'quality', 'lading']
  },
  medical: {
    code: '3004.90.00',
    nameAr: 'أدوية علاجية ومستحضرات صيدلانية ومستلزمات طبية مستوردة',
    dutyRate: 0.00, // معفى لدعم الصحة العامة
    requiresSpecialInspection: true, // فحص الهيئة العليا للأدوية والمستلزمات الطبية
    requiredDocuments: ['invoice', 'packing_list', 'origin', 'quality', 'lading']
  },
  chemicals: {
    code: '3901.10.00',
    nameAr: 'بوليمرات إيثيلين بأشكالها الأولية ومواد كيميائية صناعية',
    dutyRate: 0.05,
    requiresSpecialInspection: true, // يتطلب موافقة الدفاع المدني وهيئة البيئة
    requiredDocuments: ['invoice', 'packing_list', 'origin', 'quality', 'lading']
  },
  building: {
    code: '7214.20.00',
    nameAr: 'قضبان حديد التسليح المحززة وألواح الصلب والحديد الإنشائي',
    dutyRate: 0.10,
    requiresSpecialInspection: false,
    requiredDocuments: ['invoice', 'packing_list', 'origin', 'lading']
  },
  agriculture: {
    code: '3102.10.00',
    nameAr: 'أسمدة يوريا نيتروجينية زراعية ومعدات ري بالتنقيط مطورة',
    dutyRate: 0.01,
    requiresSpecialInspection: true, // يتطلب فحص وزارة الزراعة والري ومطابقة التربة
    requiredDocuments: ['invoice', 'packing_list', 'origin', 'quality', 'lading']
  }
};

export const PORTS = [
  { id: 'port_aden', nameAr: 'ميناء عدن الدولي (الحاويات)', cityAr: 'عدن' },
  { id: 'port_hodeidah', nameAr: 'ميناء الحديدة الرئيسي', cityAr: 'الحديدة' },
  { id: 'port_mukalla', nameAr: 'ميناء المكلا الدولي', cityAr: 'المكلا' },
  { id: 'port_shehen', nameAr: 'منفذ شحن البري الجمركي', cityAr: 'شحن (المهرة)' },
  { id: 'port_wadeah', nameAr: 'منفذ الوديعة البري الجمركي', cityAr: 'الوديعة (حضرموت)' },
  { id: 'airport_sanaa', nameAr: 'مطار صنعاء الدولي الشحن الجوي', cityAr: 'صنعاء' },
  { id: 'airport_aden', nameAr: 'مطار عدن الدولي الشحن الجوي', cityAr: 'عدن' }
];

export const CARRIERS = [
  { id: 'maersk', name: 'Maersk Line (ميرسك)' },
  { id: 'msc', name: 'MSC Shipping (إم إس سي)' },
  { id: 'cma', name: 'CMA CGM (سي إم إيه)' },
  { id: 'hapag', name: 'Hapag-Lloyd (هاباج لويد)' },
  { id: 'cosco', name: 'COSCO Shipping (كوسكو)' }
];

export const SUPPLIERS = {
  electronics: [
    { name: 'Shenzhen Techtronics Ltd', country: 'الصين', city: 'شينزين' },
    { name: 'Samsung Electronics Global', country: 'كوريا الجنوبية', city: 'سول' },
    { name: 'Sony Corporation', country: 'اليابان', city: 'طوكيو' },
    { name: 'Apple Logistics Global Inc.', country: 'الولايات المتحدة', city: 'كوبيرتينو' },
    { name: 'ASUS Computer International', country: 'تايوان', city: 'تايبيه' },
    { name: 'Xiaomi Communications Ltd', country: 'الصين', city: 'بكين' },
    { name: 'Panasonic Global Logistics', country: 'اليابان', city: 'أوساكا' },
    { name: 'Schneider Electric SAS', country: 'فرنسا', city: 'باريس' },
    { name: 'Siemens Industrial Automation', country: 'ألمانيا', city: 'ميونخ' }
  ],
  food: [
    { name: 'EuroDairy Cooperatives', country: 'هولندا', city: 'روتردام' },
    { name: 'Al-Saeeda Agricultural Corp', country: 'مصر', city: 'المنصورة' },
    { name: 'JBS Foods Global', country: 'البرازيل', city: 'ساو باولو' },
    { name: 'Nestlé International Trade', country: 'سويسرا', city: 'فيفي' },
    { name: 'Cargill Agriculture Ltd', country: 'الولايات المتحدة', city: 'مينياتوليس' },
    { name: 'Savola Food Group', country: 'السعودية', city: 'جدة' },
    { name: 'Al-Marai Dairy & Food Co', country: 'السعودية', city: 'الرياض' },
    { name: 'Thai Union Group', country: 'تايلاند', city: 'بانكوك' },
    { name: 'Fonterra Co-operative Group', country: 'نيوزيلندا', city: 'أوكلاند' },
    { name: 'VinaMilk Export Corp', country: 'فيتنام', city: 'هانوي' }
  ],
  clothes: [
    { name: 'Anadolu Textile Group', country: 'تركيا', city: 'إسطنبول' },
    { name: 'Garment Masters Ltd', country: 'بنغلاديش', city: 'دكا' },
    { name: 'Zhejiang Apparel Factory', country: 'الصين', city: 'هانغتشو' },
    { name: 'Inditex Trading Corp', country: 'إسبانيا', city: 'غاليسيا' },
    { name: 'H&M Global Distribution', country: 'السويد', city: 'ستوكهولم' },
    { name: 'Viet Fashion Exporters', country: 'فيتنام', city: 'سايغون' },
    { name: 'Giza Cotton Exporters', country: 'مصر', city: 'القاهرة' },
    { name: 'Prada Group S.p.A', country: 'إيطاليا', city: 'ميلان' },
    { name: 'Textile de Casablanca', country: 'المغرب', city: 'الدار البيضاء' }
  ],
  industrial: [
    { name: 'Heidelberg Machinery GmbH', country: 'ألمانيا', city: 'فرانكفورت' },
    { name: 'Yaskawa Nippon Industrial', country: 'اليابان', city: 'أوساكا' },
    { name: 'Caterpillar Heavy Machinery', country: 'الولايات المتحدة', city: 'إلينوي' },
    { name: 'Komatsu Global Logistics', country: 'اليابان', city: 'طوكيو' },
    { name: 'Sany Heavy Industry Co', country: 'الصين', city: 'تشانغشا' },
    { name: 'Doosan Infracore Co', country: 'كوريا الجنوبية', city: 'إنتشون' },
    { name: 'Volvo Construction Equip', country: 'السويد', city: 'غوتنبرغ' },
    { name: 'ABB Engineering Group', country: 'سويسرا', city: 'زيورخ' },
    { name: 'L&T Heavy Engineering', country: 'الهند', city: 'مومباي' }
  ],
  cars: [
    { name: 'Toyota Tsusho Corp', country: 'اليابان', city: 'ناغويا' },
    { name: 'Bayerische Motoren Werke AG', country: 'ألمانيا', city: 'ميونخ' },
    { name: 'Hyundai Motor Company', country: 'كوريا الجنوبية', city: 'أولسان' },
    { name: 'Tesla Motors Inc.', country: 'الولايات المتحدة', city: 'أوستن' },
    { name: 'BYD Auto Co. Ltd', country: 'الصين', city: 'شينزين' },
    { name: 'Stellantis Automobiles', country: 'فرنسا', city: 'باريس' },
    { name: 'Ford Global Fleet Sales', country: 'الولايات المتحدة', city: 'ديترويت' },
    { name: 'Mercedes-Benz Group', country: 'ألمانيا', city: 'شتوتغارت' },
    { name: 'Fiat Chrysler S.p.A', country: 'إيطاليا', city: 'تورينو' },
    { name: 'Tata Motors Limited', country: 'الهند', city: 'بونا' }
  ],
  medical: [
    { name: 'Novartis International AG', country: 'سويسرا', city: 'بازل' },
    { name: 'Pfizer Global Supply', country: 'الولايات المتحدة', city: 'نيويورك' },
    { name: 'Roche Diagnostics Corp', country: 'سويسرا', city: 'بازل' },
    { name: 'AstraZeneca Pharmaceuticals', country: 'المملكة المتحدة', city: 'لندن' },
    { name: 'Sinopharm Biotech Group', country: 'الصين', city: 'بكين' },
    { name: 'Cipla Pharmaceutical Ltd', country: 'الهند', city: 'مومباي' },
    { name: 'Sanofi Aventis Group', country: 'فرنسا', city: 'باريس' },
    { name: 'GlaxoSmithKline plc (GSK)', country: 'المملكة المتحدة', city: 'لندن' },
    { name: 'Julphar Gulf Pharmaceutical', country: 'الإمارات العربية المتحدة', city: 'رأس الخيمة' }
  ],
  chemicals: [
    { name: 'SABIC Plastics Corp', country: 'السعودية', city: 'الجبيل' },
    { name: 'BASF Chemical SE', country: 'ألمانيا', city: 'لودفيغسهافن' },
    { name: 'Dow Chemical Corporation', country: 'الولايات المتحدة', city: 'ميدلاند' },
    { name: 'Sinopec Chemical Corp', country: 'الصين', city: 'بكين' },
    { name: 'Borouge Petrochemicals', country: 'الإمارات العربية المتحدة', city: 'أبوظبي' },
    { name: 'PetroChina Exporters Ltd', country: 'الصين', city: 'شنغهاي' },
    { name: 'Formosa Plastics Corp', country: 'تايوان', city: 'كاوهسيونغ' },
    { name: 'LG Chem Ltd', country: 'كوريا الجنوبية', city: 'سول' }
  ],
  building: [
    { name: 'ArcelorMittal Steel', country: 'لوكسمبورغ', city: 'لوكسمبورغ' },
    { name: 'Jindal Steel & Power', country: 'الهند', city: 'نيودلهي' },
    { name: 'Nippon Steel Corp', country: 'اليابان', city: 'طوكيو' },
    { name: 'LafargeHolcim Building Co', country: 'سويسرا', city: 'زيورخ' },
    { name: 'China State Construction Corp', country: 'الصين', city: 'بكين' },
    { name: 'CEMEX Cement Global', country: 'المكسيك', city: 'مونتيري' },
    { name: 'Tata Steel International', country: 'الهند', city: 'جمشيدبور' },
    { name: 'Ezz Steel Company', country: 'مصر', city: 'القاهرة' },
    { name: 'US Steel Corporation', country: 'الولايات المتحدة', city: 'بيتسبرغ' }
  ],
  agriculture: [
    { name: 'Yara International ASA', country: 'النرويج', city: 'أوسلو' },
    { name: 'John Deere Agri Equip', country: 'الولايات المتحدة', city: 'مولين' },
    { name: 'Kubota Tractor Corp', country: 'اليابان', city: 'أوساكا' },
    { name: 'Syngenta Crop Protection', country: 'سويسرا', city: 'بازل' },
    { name: 'Bayer Crop Science AG', country: 'ألمانيا', city: 'ليفركوزن' },
    { name: 'Mahindra Agri Solutions', country: 'الهند', city: 'بونا' },
    { name: 'ADM (Archer Daniels Midland)', country: 'الولايات المتحدة', city: 'شيكاغو' },
    { name: 'Louis Dreyfus Company', country: 'فرنسا', city: 'ليون' }
  ]
};

// مولد تلقائي لأرقام الحاويات
export function generateContainerNumber(): string {
  const letters = 'MSCU,MAEU,MEDU,SUDU,TEMU';
  const letterArr = letters.split(',');
  const prefix = letterArr[Math.floor(Math.random() * letterArr.length)];
  const digits = Math.floor(100000 + Math.random() * 900000);
  const checkDigit = Math.floor(Math.random() * 10);
  return `${prefix}${digits}-${checkDigit}`;
}

// إنشاء ملف وثائق افتراضي لشحنة جديدة
export function createDefaultDocuments(
  cargoType: CargoType,
  shipmentCode: string,
  valueUSD: number,
  weight: number,
  supplierName: string,
  originCountry: string,
  containerNumber: string
): Document[] {
  const dateStr = new Date().toISOString().split('T')[0];
  const hsItem = HS_CODES[cargoType];

  return [
    {
      id: `doc_inv_${shipmentCode}`,
      type: 'invoice',
      title: 'الفاتورة التجارية (Commercial Invoice)',
      fileNumber: `INV-${shipmentCode}-89`,
      issuer: supplierName,
      issueDate: dateStr,
      status: 'completed',
      content: {
        invoiceNumber: `INV-${shipmentCode}-89`,
        invoiceValue: valueUSD,
        currency: 'USD',
        items: [
          {
            name: hsItem.nameAr,
            qty: Math.floor(weight * 250),
            unitPrice: Math.round(valueUSD / (weight * 250)),
            total: valueUSD
          }
        ]
      }
    },
    {
      id: `doc_pack_${shipmentCode}`,
      type: 'packing_list',
      title: 'قائمة التعبئة والوزن (Packing List)',
      fileNumber: `PL-${shipmentCode}-89`,
      issuer: supplierName,
      issueDate: dateStr,
      status: 'completed',
      content: {
        totalWeight: weight,
        containerCount: 1,
        containerNumbers: [containerNumber]
      }
    },
    {
      id: `doc_ori_${shipmentCode}`,
      type: 'origin',
      title: 'شهادة المنشأ الرسمية (Certificate of Origin)',
      fileNumber: `CO-${shipmentCode}-34`,
      issuer: `الغرفة التجارية الصناعية في ${originCountry}`,
      issueDate: dateStr,
      status: 'completed',
      content: {
        certificateNumber: `CO-${shipmentCode}-34`,
        originCountry: originCountry
      }
    },
    {
      id: `doc_qual_${shipmentCode}`,
      type: 'quality',
      title: 'شهادة الجودة والمطابقة الدولية (Quality Certificate)',
      fileNumber: `QC-${shipmentCode}-12`,
      issuer: 'مختبرات فحص ومطابقة الصادرات العالمية SGS',
      issueDate: dateStr,
      status: hsItem.requiresSpecialInspection ? 'draft' : 'completed', // يتطلب تجهيز لو كانت ضرورية
      content: {
        labNotes: `مطابقة لمعايير السلامة والجودة والخصائص الفنية المعتمدة للشحنة رقم ${shipmentCode}`
      }
    },
    {
      id: `doc_lad_${shipmentCode}`,
      type: 'lading',
      title: 'بوليصة الشحن البحرية (Bill of Lading)',
      fileNumber: `BL-MAEU-${shipmentCode}`,
      issuer: 'شركة ميرسك للملاحة البحرية الدولية',
      issueDate: dateStr,
      status: 'completed',
      content: {
        containerNumbers: [containerNumber]
      }
    },
    {
      id: `doc_dec_${shipmentCode}`,
      type: 'declaration',
      title: 'البيان الجمركي الموحد (Customs Declaration)',
      fileNumber: `DEC-${shipmentCode}-99`,
      issuer: 'مصلحة الجمارك العامة',
      issueDate: dateStr,
      status: 'draft',
      content: {
        hsCode: hsItem.code,
        dutiesAmount: 0,
        vatAmount: 0,
        portFees: 0
      }
    },
    {
      id: `doc_rel_${shipmentCode}`,
      type: 'release',
      title: 'إذن الفسح والترخيص الجمركي (Customs Release)',
      fileNumber: `REL-${shipmentCode}-44`,
      issuer: 'إدارة جمارك الميناء',
      issueDate: dateStr,
      status: 'draft',
      content: {}
    }
  ];
}

// شحنات افتراضية أولية لجعل لوحة التحكم ممتلئة بالمعلومات الحقيقية عند البدء
export const INITIAL_SHIPMENTS: Shipment[] = [
  {
    id: 'ship_01',
    code: 'YE-90214',
    trackingNumber: 'TRK-YE-90214',
    title: 'منظومات طاقة شمسية ومولدات ريفية حديثة',
    cargoType: 'industrial',
    supplier: 'Shenzhen Techtronics Ltd',
    countryOfOrigin: 'الصين',
    portOfDischarge: 'ميناء عدن الدولي (الحاويات)',
    containerNumber: 'MSCU490812-3',
    weight: 18.5,
    valueUSD: 85000,
    valueLocal: 85000 * 1350, // القيمة بالريال اليمني
    carrierName: 'MSC Shipping (إم إس سي)',
    currentStatus: 'inspection', // في مرحلة المعاينة
    direction: 'import',
    clientName: 'مجموعة مأرب للتجارة والاستيراد',
    clientPhone: '+967 771 234 567',
    smsMessages: [],
    estimatedArrival: '2026-07-22',
    currentLocation: 'خليج عدن - على بعد 15 ميل بحري من رصيف ميناء عدن للمعاينة والفرز جمركياً',
    documents: [], // سيتم إنشاؤها بالدوال
    logs: [
      { id: 'l1', timestamp: '2026-07-10 09:00', status: 'purchased', message: 'تم فتح أمر الشراء وسداد دفعة التعاقد مع المورد الصيني عبر مكتب طه رضوان للخدمات اللوجستية.', userAction: true },
      { id: 'l2', timestamp: '2026-07-12 14:00', status: 'docs_ready', message: 'اكتملت جميع المستندات الأصلية من الفاتورة وقائمة التعبئة وبوليصة الشحن وبدأت الشحنة بالإبحار من ميناء شنغهاي إلى عدن.', userAction: false },
      { id: 'l3', timestamp: '2026-07-16 11:30', status: 'arrived_at_port', message: 'وصول السفينة الناقلة لمنطقة المخطاف الخارجي بميناء عدن الدولي وبدء مناولة الحاوية بانتظار إشعار الوصول.', userAction: false },
      { id: 'l4', timestamp: '2026-07-16 16:00', status: 'declaration_submitted', message: 'تقديم البيان الجمركي الجمركي الموحد رقم DEC-YE-90214 لدى جمارك عدن وتصنيف الشحنة بالترميز 8414.59.00 برسم 2% تشجيعاً.', userAction: true },
      { id: 'l5', timestamp: '2026-07-17 08:30', status: 'inspection', message: 'نظام المخاطر يحول الشحنة للمسار الأحمر لمتطلبات تفتيش أجهزة الطاقة والمولدات ومطابقة مطابقة الأرقام المتسلسلة.', userAction: false }
    ],
    hsCode: '8414.59.00',
    dutyRate: 0.02,
    inspectionChannel: 'red',
    inspectionNotes: 'مسار أحمر بجمارك ميناء عدن. تتطلب الشحنة فحص عينات عشوائي بالأشعة ومعاينة بدنية من مندوب هيئة المواصفات والمقاييس لضمان جودة المحولات والبطاريات المتكاملة.',
    labResult: 'pending',
    dutiesPaid: false,
    transitProgress: 0,
    createdAt: '2026-07-10'
  },
  {
    id: 'ship_02',
    code: 'YE-31089',
    trackingNumber: 'TRK-YE-31089',
    title: 'قمح استهلاكي ودقيق أبيض فاخر (معبأ)',
    cargoType: 'food',
    supplier: 'EuroDairy Cooperatives',
    countryOfOrigin: 'هولندا',
    portOfDischarge: 'ميناء الحديدة الرئيسي',
    containerNumber: 'MAEU310928-8',
    weight: 24.8,
    valueUSD: 64000,
    valueLocal: 64000 * 1350,
    carrierName: 'Maersk Line (ميرسك)',
    currentStatus: 'payment_pending', // في انتظار سداد الرسوم الجمركية
    direction: 'import',
    clientName: 'الشركة اليمنية للمطاحن وصوامع الغلال',
    clientPhone: '+967 775 654 321',
    smsMessages: [],
    estimatedArrival: '2026-07-18',
    currentLocation: 'ميناء الحديدة - ساحة فرز جمارك الحديدة وبانتظار سداد رسوم البيان الجمركي الموحد للجمهور',
    documents: [],
    logs: [
      { id: 'l21', timestamp: '2026-07-11 10:00', status: 'purchased', message: 'تحرير الفواتير التجارية وشراء القمح من المورد الهولندي، وطلب وساطة طه رضوان للتفتيش قبل الشحن.', userAction: true },
      { id: 'l22', timestamp: '2026-07-12 11:30', status: 'docs_ready', message: 'استلام شهادة المنشأ وشهادة مطابقة الحجر الزراعي وتصديقها للجمهورية اليمنية.', userAction: true },
      { id: 'l23', timestamp: '2026-07-14 15:45', status: 'arrived_at_port', message: 'دخول السفينة الناقلة رصيف التفريغ بميناء الحديدة وإنزال الحاويات بساحات التبريد والمطابقة.', userAction: false },
      { id: 'l24', timestamp: '2026-07-15 10:00', status: 'declaration_submitted', message: 'تقديم البيان الجمركي الموحد DEC-YE-31089 تحت البند 0406.90.10 برسم مخفض لدعم السلع الغذائية الأساسية.', userAction: true },
      { id: 'l25', timestamp: '2026-07-15 14:00', status: 'inspection', message: 'تم إحالة الملف للمسار الأصفر للمطابقة وفحص التقارير المخبرية المعتمدة للمواد الاستهلاكية.', userAction: false },
      { id: 'l26', timestamp: '2026-07-16 11:00', status: 'lab_testing', message: 'الهيئة اليمنية للمواصفات والمقاييس (YSMO) تأخذ عينات من الطحين وتصدر تقرير مطابقة للاستهلاك الآدمي وصلاحيته.', userAction: false },
      { id: 'l27', timestamp: '2026-07-17 09:15', status: 'payment_pending', message: 'تم احتساب الرسوم الجمركية والضرائب وضريبة القيمة المضافة، البيان بانتظار تبرئة الفاتورة الجمركية الموحدة.', userAction: false }
    ],
    hsCode: '0406.90.10',
    dutyRate: 0.10,
    inspectionChannel: 'yellow',
    inspectionNotes: 'مسار أصفر جمارك الحديدة. مطابقة الفاتورة التجارية مع الحجر الزراعي وشهادة الجودة الصادرة من المنشأ. تم السماح بالدفع.',
    labResult: 'passed',
    dutiesPaid: false,
    transitProgress: 0,
    createdAt: '2026-07-11'
  },
  {
    id: 'ship_03',
    code: 'YE-55122',
    trackingNumber: 'TRK-YE-55122',
    title: 'تصدير عسل سدر ملكي دوعني فاخر (صادرات)',
    cargoType: 'food',
    supplier: 'مؤسسة النخبة لإنتاج وتصدير العسل اليمني',
    countryOfOrigin: 'اليمن',
    portOfDischarge: 'مطار عدن الدولي الشحن الجوي',
    containerNumber: 'AIR-CO-91024',
    weight: 2.1,
    valueUSD: 45000,
    valueLocal: 45000 * 1350,
    carrierName: 'الخطوط الجوية اليمنية للشحن الجوي',
    currentStatus: 'delivered', // تم التوصيل بالكامل
    direction: 'export',
    clientName: 'الجمعية التعاونية لمنتجي العسل اليمني بدوعن',
    clientPhone: '+967 733 987 654',
    smsMessages: [
      {
        id: 'sms_hist_1',
        phoneNumber: '+967 733 987 654',
        message: 'عزيزنا المستورد/المصدر: تم فتح قيد جمركي رقم YE-55122 لبضاعتكم (تصدير عسل سدر ملكي دوعني فاخر) بنجاح عبر نظام ديلفار بجمارك الجمهورية اليمنية. نتمنى لكم التوفيق.',
        timestamp: '2026-07-05 10:30',
        status: 'delivered',
        type: 'declaration'
      },
      {
        id: 'sms_hist_2',
        phoneNumber: '+967 733 987 654',
        message: 'مصلحة الجمارك: تم استلام وتأكيد سداد الرسوم والضرائب المستحقة للبيان الجمركي الموحد YE-55122 بنجاح برقم إيصال PAY-SYS-981242 بقيمة 45,000 ريال يمني.',
        timestamp: '2026-07-06 09:05',
        status: 'delivered',
        type: 'payment'
      },
      {
        id: 'sms_hist_3',
        phoneNumber: '+967 733 987 654',
        message: 'مؤسسة طه رضوان اللوجستية: تم الانتهاء من تخليص المعاملة الجمركية بنجاح وتفريغها بالمستودعات بالكامل. نشكركم لثقتكم بخدماتنا اللوجستية.',
        timestamp: '2026-07-08 11:02',
        status: 'delivered',
        type: 'completion'
      }
    ],
    estimatedArrival: '2026-07-15',
    currentLocation: 'المملكة العربية السعودية - تم استلام وتفريغ الشحنة بمستودعات الرياض وتوقيع سند المبرز النهائي',
    documents: [],
    logs: [
      { id: 'l31', timestamp: '2026-07-01 09:00', status: 'purchased', message: 'استلام طلب تصدير العسل، تعبئة وتجهيز البضاعة بعبوات زجاجية مبردة مخصصة للشحن الدولي.', userAction: true },
      { id: 'l32', timestamp: '2026-07-02 12:00', status: 'docs_ready', message: 'إصدار شهادات المنشأ من الغرفة التجارية بعدن وفحص مطابقة العسل وحرارة تخزينه.', userAction: true },
      { id: 'l33', timestamp: '2026-07-04 15:00', status: 'arrived_at_port', message: 'تأكيد حجز بوليصة الشحن الجوي مع طيران اليمنية ووصول الصناديق لمستودعات الشحن بمطار عدن الدولي.', userAction: false },
      { id: 'l34', timestamp: '2026-07-05 10:30', status: 'declaration_submitted', message: 'تقديم بيان جمركي صادر رقم DEC-YE-55122 مع إعفاءات كاملة لتشجيع الصادرات اليمنية التقليدية والزراعية.', userAction: true },
      { id: 'l35', timestamp: '2026-07-05 14:00', status: 'inspection', message: 'المعاملة في المسار الأخضر المباشر بعد الكشف الظاهري ومطابقة ختم الشمع الأحمر الخاص بوزارة الزراعة.', userAction: false },
      { id: 'l36', timestamp: '2026-07-06 09:00', status: 'payment_pending', message: 'سداد رسوم مناولة المطار الخفيفة واستصدار الفسح الجمركي التصديري الفوري.', userAction: true },
      { id: 'l37', timestamp: '2026-07-06 13:00', status: 'released', message: 'إصدار الفسح النهائي للتحميل الجوي، ووضع الصناديق على متن طائرة الشحن المغادرة.', userAction: false },
      { id: 'l38', timestamp: '2026-07-07 16:30', status: 'in_transit', message: 'هبوط طائرة الشحن ووصول البضاعة للمطار المضيف والبدء بالنقل البري السريع عبر شركة الشريك اللوجستي لطه رضوان.', userAction: false },
      { id: 'l39', timestamp: '2026-07-08 11:00', status: 'delivered', message: 'تفريغ العسل وتسليمه لمخازن العميل بالرياض ومطابقة شروط النقل والتوقيع على الإغلاق الجمركي.', userAction: true }
    ],
    hsCode: '0406.90.10',
    dutyRate: 0.10,
    inspectionChannel: 'green',
    inspectionNotes: 'مسار أخضر تصديري. دعم وتسهيل الصادرات الزراعية اليمنية بموجب اللائحة الوزارية للتصدير، مطابقة ممتازة.',
    labResult: 'passed',
    dutiesPaid: true,
    transitProgress: 100,
    createdAt: '2026-07-01',
    deliveredAt: '2026-07-08'
  }
];

// تهيئة وثائق الشحنات الأولية
INITIAL_SHIPMENTS.forEach(s => {
  s.documents = createDefaultDocuments(
    s.cargoType,
    s.code,
    s.valueUSD,
    s.weight,
    s.supplier,
    s.countryOfOrigin,
    s.containerNumber
  );

  // تحديث بعض الوثائق حسب الحالة لكل شحنة
  if (s.currentStatus === 'payment_pending') {
    // تحديث البيان الجمركي برسم جمركي حقيقي
    const dec = s.documents.find(d => d.type === 'declaration');
    if (dec) {
      dec.status = 'completed';
      const hsItem = HS_CODES[s.cargoType];
      dec.content.hsCode = hsItem.code;
      dec.content.dutiesAmount = Math.round(s.valueLocal * hsItem.dutyRate);
      dec.content.vatAmount = Math.round(s.valueLocal * 0.15); // 15% VAT
      dec.content.portFees = 1800; // ثابت
    }
  }

  if (s.currentStatus === 'delivered') {
    // جميع وثائقها جاهزة ومكتملة
    s.documents.forEach(d => {
      d.status = 'completed';
      if (d.type === 'declaration') {
        const hsItem = HS_CODES[s.cargoType];
        d.content.hsCode = hsItem.code;
        d.content.dutiesAmount = Math.round(s.valueLocal * hsItem.dutyRate);
        d.content.vatAmount = Math.round(s.valueLocal * 0.15);
        d.content.portFees = 1800;
      }
      if (d.type === 'release') {
        d.content.dutiesAmount = Math.round(s.valueLocal * HS_CODES[s.cargoType].dutyRate);
      }
    });
  }
});
