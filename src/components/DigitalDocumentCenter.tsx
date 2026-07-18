/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { Document, Shipment, DocumentType } from '../types';
import { 
  FileText, 
  Plus, 
  Folder, 
  Search, 
  Download, 
  Printer, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  X, 
  Upload, 
  FileCheck2, 
  Users,
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface DigitalDocumentCenterProps {
  shipments: Shipment[];
  onAddDocument: (shipmentId: string, doc: Document) => void;
  onUpdateDocument: (shipmentId: string, docId: string, updatedDoc: Document) => void;
}

export default function DigitalDocumentCenter({ shipments, onAddDocument, onUpdateDocument }: DigitalDocumentCenterProps) {
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedShipmentType, setSelectedShipmentType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewDoc, setViewDoc] = useState<{ shipmentCode: string; doc: Document } | null>(null);
  
  // نموذج الرفع
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadShipmentId, setUploadShipmentId] = useState(shipments[0]?.id || '');
  const [docType, setDocType] = useState<DocumentType>('invoice');
  const [docTitle, setDocTitle] = useState('');
  const [fileNumber, setFileNumber] = useState('');
  const [issuer, setIssuer] = useState('');
  const [clientNameInput, setClientNameInput] = useState('');
  const [fileNote, setFileNote] = useState('');

  // استخراج العملاء المميزين
  const clients = Array.from(new Set(shipments.map(s => s.clientName).filter(Boolean)));

  // تصنيف تلقائي للشحنة: تجارية، شخصية، ترانزيت
  const getShipmentType = (s: Shipment): 'commercial' | 'personal' | 'transit' => {
    // 1. ترانزيت (إذا كانت الشحنة قيد الترانزيت أو وجهتها ترانزيت أو مسار نقل بري)
    if (
      s.currentStatus === 'in_transit' || 
      s.title.includes('ترانزيت') || 
      s.portOfDischarge.toLowerCase().includes('ترانزيت') ||
      s.portOfDischarge.includes('منفذ') ||
      s.transitProgress > 0
    ) {
      return 'transit';
    }
    // 2. شخصية (أمتعة أفراد أو عملاء باسم شخصي صريح أو قيمة متدنية)
    const client = s.clientName || '';
    if (
      client.includes('شخصي') || 
      client.includes('أمتعة') || 
      (client.length > 0 && !client.includes('شركة') && !client.includes('مجموعة') && !client.includes('مؤسسة') && !client.includes('الجمعية') && !client.includes('مطاحن')) ||
      s.valueUSD < 15000
    ) {
      return 'personal';
    }
    // 3. تجارية (شركات ومؤسسات ومجموعات تجارية كبيرة ذات قيمة عالية)
    return 'commercial';
  };

  // تجميع وتجميع كل المستندات في مصفوفة واحدة للمراقبة والبحث
  const allDocuments = shipments.flatMap(s => {
    const sType = getShipmentType(s);
    return s.documents.map(d => ({
      shipmentId: s.id,
      shipmentCode: s.code,
      shipmentTitle: s.title,
      clientName: s.clientName || 'مجموعة طه رضوان',
      shipmentType: sType,
      doc: d
    }));
  });

  // الفلترة الديناميكية للمستندات حسب الشحنة، العميل، تصنيف الشحنة، والبحث
  const filteredDocs = allDocuments.filter(item => {
    const matchesShipment = selectedShipmentId === 'all' || item.shipmentId === selectedShipmentId;
    const matchesClient = selectedClient === 'all' || item.clientName === selectedClient;
    const matchesType = selectedShipmentType === 'all' || item.shipmentType === selectedShipmentType;
    const matchesSearch = 
      item.doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.doc.fileNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.doc.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.shipmentCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesShipment && matchesClient && matchesType && matchesSearch;
  });

  const getDocTypeAr = (type: DocumentType) => {
    switch (type) {
      case 'invoice': return 'الفاتورة التجارية (Invoice)';
      case 'packing_list': return 'قائمة التعبئة (Packing List)';
      case 'origin': return 'شهادة منشأ (Origin)';
      case 'quality': return 'شهادة مطابقة الجودة (Quality)';
      case 'lading': return 'بوليصة الشحن (Bill of Lading)';
      case 'declaration': return 'البيان الجمركي (Declaration)';
      case 'release': return 'إذن الفسح والترخيص (Release)';
      default: return 'مستند ملحق';
    }
  };

  const getDocIcon = (type: DocumentType) => {
    switch (type) {
      case 'invoice': return '🧾';
      case 'packing_list': return '📦';
      case 'origin': return '🌍';
      case 'quality': return '🔬';
      case 'lading': return '⚓';
      case 'declaration': return '📜';
      case 'release': return '🔑';
      default: return '📄';
    }
  };

  const handleUploadSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !fileNumber.trim() || !issuer.trim()) {
      alert("الرجاء تعبئة جميع الخانات الأساسية للوثيقة الرقمية.");
      return;
    }

    const targetShipment = shipments.find(s => s.id === uploadShipmentId);
    if (!targetShipment) return;

    const newDoc: Document = {
      id: `doc_upload_${Date.now()}`,
      type: docType,
      title: `${getDocTypeAr(docType)} - ${docTitle}`,
      fileNumber: fileNumber,
      issuer: issuer,
      issueDate: new Date().toISOString().split('T')[0],
      status: 'completed',
      content: {
        labNotes: fileNote || 'تم التحميل والتدقيق الرقمي للوثيقة الملحقة بنجاح.'
      }
    };

    onAddDocument(uploadShipmentId, newDoc);
    
    // تصفير الخانات وإغلاق المودال
    setDocTitle('');
    setFileNumber('');
    setIssuer('');
    setFileNote('');
    setShowUploadForm(false);
    alert("تم رفع وتوثيق المستند الرقمي في قاعدة بيانات طه رضوان اللوجستية بنجاح.");
  };

  const simulateDownload = (doc: Document) => {
    alert(`محاكاة: جاري تحميل مستند (${doc.title}) بصيغة PDF الرقمية المصدقة بالرمز الجمركي للجمهورية اليمنية.`);
  };

  const simulatePrint = () => {
    alert("محاكاة: تم إرسال الأمر للطباعة الفورية على الورق الرسمي المؤمن.");
  };

  return (
    <div className="space-y-6">
      
      {/* هيدر المركز وإجراءات البحث السريع */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-gray-800 flex items-center gap-2">
            <Folder className="text-emerald-600" size={18} />
            <span>مركز المستندات والوثائق الرقمية الموحد</span>
          </h3>
          <p className="text-[10px] text-gray-400 mt-1">تخزين، مراجعة، ومطابقة شهادات المنشأ والفواتير والبيانات الجمركية للشحنات</p>
        </div>
        
        <button 
          onClick={() => setShowUploadForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-xs self-start"
        >
          <Plus size={14} />
          <span>أرشفة / رفع وثيقة رقمية جديدة</span>
        </button>
      </div>

      {/* شريط الفلاتر والبحث الجمركي مع ميزات التصنيف والبحث السريع */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4 text-right">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* بحث نصي */}
          <div className="relative md:col-span-2">
            <input 
              type="text" 
              placeholder="البحث السريع برقم الوثيقة، اسم العميل، كود الشحنة أو المصدر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-sans pl-3 pr-10 py-2.5 rounded-xl border border-gray-150 focus:outline-hidden focus:border-emerald-500 bg-gray-50/50 focus:bg-white transition-all"
            />
            <Search className="absolute right-3 top-3 text-gray-400" size={16} />
          </div>

          {/* تصفية حسب الشحنة */}
          <div>
            <select 
              value={selectedShipmentId} 
              onChange={(e) => setSelectedShipmentId(e.target.value)}
              className="w-full text-xs font-sans py-2.5 px-3 rounded-xl border border-gray-150 focus:outline-hidden focus:border-emerald-500 bg-gray-50/50"
            >
              <option value="all">كل الشحنات جمركياً</option>
              {shipments.map(s => (
                <option key={s.id} value={s.id}>{s.code} - {s.title.substring(0, 20)}...</option>
              ))}
            </select>
          </div>

          {/* تصفية حسب العميل */}
          <div>
            <select 
              value={selectedClient} 
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full text-xs font-sans py-2.5 px-3 rounded-xl border border-gray-150 focus:outline-hidden focus:border-emerald-500 bg-gray-50/50"
            >
              <option value="all">كل المستوردين / المصدرين</option>
              {clients.map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* أزرار تصفية سريعة حسب تصنيف الشحنة (تجارية، شخصية، ترانزيت) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-gray-50">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-500 font-bold">تصنيف الشحنة التلقائي:</span>
            {[
              { id: 'all', label: 'الكل', icon: '🌐', color: 'bg-emerald-600 text-white border-emerald-600' },
              { id: 'commercial', label: 'تجارية (Commercial)', icon: '🏢', color: 'bg-blue-600 text-white border-blue-600' },
              { id: 'personal', label: 'شخصية (Personal)', icon: '👤', color: 'bg-amber-500 text-white border-amber-500' },
              { id: 'transit', label: 'ترانزيت (Transit)', icon: '🔄', color: 'bg-purple-600 text-white border-purple-600' }
            ].map(t => {
              const isActive = selectedShipmentType === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setSelectedShipmentType(t.id)}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive 
                      ? t.color + ' shadow-xs' 
                      : 'bg-gray-50 text-gray-600 border-gray-150 hover:bg-gray-100'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* كلمات البحث السريع */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="text-gray-400 font-bold">البحث السريع:</span>
            {[
              { label: 'فاتورة', q: 'invoice' },
              { label: 'بوليصة شحن', q: 'lading' },
              { label: 'بيان جمركي', q: 'declaration' },
              { label: 'شهادة منشأ', q: 'origin' },
              { label: 'مأرب', q: 'مأرب' },
              { label: 'المطاحن', q: 'المطاحن' }
            ].map(tag => (
              <button
                type="button"
                key={tag.label}
                onClick={() => setSearchQuery(tag.q)}
                className="bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 text-gray-500 hover:border-emerald-200 px-2.5 py-1 rounded-lg transition-all border border-gray-200/60 cursor-pointer"
              >
                #{tag.label}
              </button>
            ))}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-red-500 hover:text-red-700 font-bold px-1 cursor-pointer"
              >
                تصفير ×
              </button>
            )}
          </div>
        </div>

        {/* إحصائيات البحث السريع التلقائية */}
        <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1 border-t border-gray-50/50">
          <span>أرشيف المستندات الرقمية: <strong>{filteredDocs.length} من {allDocuments.length}</strong> وثائق جمركية مفهرسة</span>
          {searchQuery && (
            <span className="text-emerald-600 font-bold bg-emerald-50/60 px-2 py-0.5 rounded-lg border border-emerald-100/50 animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>نتائج بحث سريعة ومحدثة فورياً</span>
            </span>
          )}
        </div>

      </div>

      {/* شبكة المستندات المؤرشفة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.length > 0 ? (
          filteredDocs.map((item) => (
            <div 
              key={item.doc.id}
              onClick={() => setViewDoc({ shipmentCode: item.shipmentCode, doc: item.doc })}
              className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-emerald-300 hover:shadow-xs hover:bg-emerald-50/5 transition-all flex flex-col justify-between cursor-pointer text-right group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 bg-gray-50 rounded-xl group-hover:bg-emerald-50 transition-all">
                      {getDocIcon(item.doc.type)}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-gray-850 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {item.doc.title}
                      </h4>
                      <span className="text-[9px] text-gray-400 font-mono block mt-0.5">الرقم المرجعي: {item.doc.fileNumber}</span>
                    </div>
                  </div>
                  
                  {/* شارة التصنيف التلقائي */}
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border whitespace-nowrap self-start ${
                    item.shipmentType === 'commercial' ? 'bg-blue-50 text-blue-700 border-blue-100'
                      : item.shipmentType === 'personal' ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : 'bg-purple-50 text-purple-700 border-purple-100'
                  }`}>
                    {item.shipmentType === 'commercial' ? '🏢 تجارية'
                      : item.shipmentType === 'personal' ? '👤 شخصية'
                      : '🔄 ترانزيت'}
                  </span>
                </div>

                <div className="space-y-1.5 border-t border-gray-50 pt-2.5 text-[10px] text-gray-500">
                  <p className="flex items-center gap-1">
                    <Briefcase size={11} className="text-gray-400" />
                    <span>الشحنة: </span>
                    <strong className="text-gray-700 font-mono">{item.shipmentCode}</strong>
                  </p>
                  <p className="flex items-center gap-1">
                    <Users size={11} className="text-gray-400" />
                    <span>العميل: </span>
                    <strong className="text-gray-700">{item.clientName}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-50 mt-4 pt-3 text-[9px] text-gray-400">
                <span>المصدر: {item.doc.issuer}</span>
                <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <CheckCircle size={10} />
                  <span>مكتمل رقمياً</span>
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white border border-gray-100 rounded-2xl py-12 text-center text-gray-400 space-y-2">
            <FileText className="mx-auto text-gray-200" size={40} />
            <p className="text-xs">عذراً، لم نجد أي مستند رقمي يطابق خيارات الفلترة المحددة.</p>
          </div>
        )}
      </div>

      {/* مودال رفع الوثائق الرقمية */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col border border-gray-100 text-right">
            
            {/* الهيدر */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <Upload size={18} className="text-emerald-600" />
                <h4 className="text-xs font-extrabold text-gray-800">أرشفة ورفع مستند لوجستي جديد للشحنة</h4>
              </div>
              <button 
                onClick={() => setShowUploadForm(false)}
                className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-750 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* محتوى الاستمارة */}
            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4 text-xs">
              
              {/* اختيار الشحنة المرتبطة */}
              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">ارتباط المستند بالشحنة الجمركية:</label>
                <select 
                  value={uploadShipmentId}
                  onChange={(e) => setUploadShipmentId(e.target.value)}
                  className="w-full text-xs font-sans p-2 rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-500 bg-white"
                >
                  {shipments.map(s => (
                    <option key={s.id} value={s.id}>{s.code} - {s.title}</option>
                  ))}
                </select>
                {(() => {
                  const selectedUploadShipment = shipments.find(s => s.id === uploadShipmentId);
                  if (!selectedUploadShipment) return null;
                  const detectedUploadShipmentType = getShipmentType(selectedUploadShipment);
                  return (
                    <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl flex items-center justify-between text-[11px] mt-1.5">
                      <span className="text-gray-500 font-bold">التصنيف التلقائي للشحنة:</span>
                      <span className={`font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                        detectedUploadShipmentType === 'commercial' ? 'bg-blue-50 text-blue-700 border-blue-100'
                          : detectedUploadShipmentType === 'personal' ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-purple-50 text-purple-700 border-purple-100'
                      }`}>
                        {detectedUploadShipmentType === 'commercial' ? '🏢 شحنة تجارية'
                          : detectedUploadShipmentType === 'personal' ? '👤 أمتعة شخصية'
                          : '🔄 ترانزيت ونقل بري'}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* اختيار نوع المستند */}
              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">تصنيف المستند الجمركي:</label>
                <select 
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                  className="w-full text-xs font-sans p-2 rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-500 bg-white"
                >
                  <option value="invoice">الفاتورة التجارية (Commercial Invoice)</option>
                  <option value="packing_list">قائمة التعبئة والتفريغ (Packing List)</option>
                  <option value="origin">شهادة منشأ البضاعة الرسمية (Certificate of Origin)</option>
                  <option value="quality">شهادة جودة وفحص مطابقة المعايير (Quality Certificate)</option>
                  <option value="lading">بوليصة الشحن البحرية/الجوية (Bill of Lading)</option>
                </select>
              </div>

              {/* خانات الاسم والملف والجهة المصدرة */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">عنوان وتفصيل المستند:</label>
                  <input 
                    type="text" 
                    placeholder="مثال: فاتورة توريد محولات الطاقة..."
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">الرقم المرجعي للملف:</label>
                  <input 
                    type="text" 
                    placeholder="مثال: INV-YE-8092-26..."
                    value={fileNumber}
                    onChange={(e) => setFileNumber(e.target.value)}
                    className="w-full p-2 font-mono rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">الجهة الرسمية المصدّرة للمستند:</label>
                <input 
                  type="text" 
                  placeholder="مثال: هيئة المقاييس والمواصفات الوطنية، الغرفة التجارية بشنغهاي..."
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  className="w-full p-2 rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">ملاحظات المستند / تفاصيل المشمول:</label>
                <textarea 
                  placeholder="أدخل أي ملاحظات فحص، مطابقة جودة، أو شروط تخليص متعلقة بالورقة..."
                  value={fileNote}
                  onChange={(e) => setFileNote(e.target.value)}
                  rows={2}
                  className="w-full p-2 rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-500"
                ></textarea>
              </div>

              {/* سحب وإفلات محاكي للملف */}
              <div className="border-2 border-dashed border-gray-200 hover:border-emerald-400 rounded-xl p-4 text-center cursor-pointer transition-all bg-gray-50/50 space-y-1.5">
                <Upload className="mx-auto text-gray-400" size={24} />
                <p className="font-bold text-gray-600">اسحب الملف هنا أو اضغط للتصفح</p>
                <p className="text-[10px] text-gray-400">يدعم صيغ PDF, PNG, JPG بحد أقصى 10 ميجا بايت للوثيقة</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl transition-all"
                >
                  أرشفة المستند رسمياً
                </button>
                <button 
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-650 font-bold py-2 rounded-xl transition-all"
                >
                  إلغاء التراجع
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* مودال معاينة الوثيقة الكبيرة بالتفصيل */}
      {viewDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-gray-100 text-right">
            
            {/* الهيدر */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getDocIcon(viewDoc.doc.type)}</span>
                <div>
                  <h4 className="text-xs font-bold text-gray-800">{viewDoc.doc.title}</h4>
                  <p className="text-[10px] text-gray-400 font-mono">الرقم المرجعي للبيان الجمركي: {viewDoc.doc.fileNumber}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewDoc(null)}
                className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* محتوى المعاينة بمظهر ورقة رسمية */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-100/50 flex justify-center">
              <div className="bg-white w-full border border-gray-200 shadow-md p-8 font-sans text-right relative min-h-[420px] border-t-4 border-t-emerald-600 rounded-xs">
                
                {/* خلفية مائية للرقم المرجعي الجمركي */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                  <ShieldCheck size={300} className="text-emerald-900" />
                </div>

                {/* ترويسة ورقة رسمية */}
                <div className="flex justify-between items-start border-b-2 border-gray-200 pb-5 mb-6">
                  <div>
                    <h3 className="text-xs font-extrabold text-gray-800">{viewDoc.doc.issuer}</h3>
                    <p className="text-[10px] text-gray-400 mt-1">مستند رقمي مسجل لـ طه رضوان للخدمات اللوجستية</p>
                    <p className="text-[10px] text-gray-400">تاريخ المعالجة والأرشفة: {viewDoc.doc.issueDate}</p>
                  </div>
                  <div className="text-left font-sans">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      معتمد رقمياً جمركياً
                    </span>
                    <span className="text-[9px] text-gray-400 block mt-1">رقم الشحنة: {viewDoc.shipmentCode}</span>
                  </div>
                </div>

                {/* محتوى تفصيلي */}
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-400 block mb-1">الجهة المصدرة الرسمية:</span>
                      <strong className="text-gray-700">{viewDoc.doc.issuer}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-1">حالة التدقيق الرقمي والـ OCR:</span>
                      <strong className="text-emerald-600 flex items-center gap-1">
                        <FileCheck2 size={12} />
                        <span>مطابق بنسبة 100%</span>
                      </strong>
                    </div>
                  </div>

                  <div className="bg-gray-50/50 border border-gray-100 p-4 rounded-xl space-y-2 mt-4">
                    <span className="text-[10px] text-gray-400 font-bold block">مشمولات الوثيقة الملحقة وملاحظات الفحص الجمركي:</span>
                    <p className="text-xs text-gray-600 leading-relaxed font-sans">
                      {viewDoc.doc.content?.labNotes || 'تم تصفية الشحنة جمركياً ومطابقة البيانات الجمركية للجمهورية اليمنية، تفعيل أرقام المعاملات وسجل الـ HS Code بنجاح.'}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* الفوتر للتحميل والطباعة */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
              <button 
                onClick={() => simulateDownload(viewDoc.doc)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs"
              >
                <Download size={14} />
                <span>تحميل نسخة PDF المصدقة</span>
              </button>
              <button 
                onClick={simulatePrint}
                className="bg-white hover:bg-gray-100 text-gray-750 font-bold py-2 px-4 rounded-xl border border-gray-200 flex items-center justify-center gap-1.5 transition-all text-xs"
              >
                <Printer size={14} />
                <span>طباعة الورقة</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
