/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  BookOpen, 
  FileText, 
  ShieldCheck, 
  Scale, 
  HelpCircle, 
  Info, 
  AlertTriangle,
  Award,
  Globe2,
  Lock
} from 'lucide-react';

export default function CustomsGuide() {
  return (
    <div id="customs_guide_tab" className="space-y-6">
      {/* هيدر الدليل الإرشادي */}
      <div className="bg-emerald-800 text-white p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-emerald-700/50 to-emerald-900/50 -z-0" />
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] bg-emerald-700 text-emerald-100 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            المعرفة الجمركية واللوجستية الموحدة
          </span>
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <BookOpen size={24} />
            <span>الدليل العملي الشامل للتخليص الجمركي للبضائع</span>
          </h2>
          <p className="text-xs text-emerald-100/80 leading-relaxed max-w-2xl">
            تعرّف على كافة الأوراق المطلوبة، الإجراءات القانونية، بنود التعرفة، ومسار الحاوية منذ لحظة قطع فواتير الشراء لدى المورد الأجنبي وحتى تفريغ الشحنة بمستودعاتك.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* المستندات الخمسة الأساسية */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
            <FileText size={20} />
          </div>
          <h4 className="text-sm font-bold text-gray-800">1. المستندات والوثائق الخمس الأساسية</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            لا يمكن البدء بإجراءات التخليص دون توفير النسخ الموثقة إلكترونياً من المستندات التالية:
          </p>
          <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
            <li><strong>الفاتورة التجارية (Invoice):</strong> توضح البائع، المشتري، والأسعار.</li>
            <li><strong>قائمة التعبئة (Packing List):</strong> توضح الأوزان الدقيقة والتعبئة.</li>
            <li><strong>شهادة المنشأ (Origin Cert):</strong> لإثبات وتأكيد دولة تصنيع السلعة.</li>
            <li><strong>بوليصة الشحن (Bill of Lading):</strong> سند نقل الملكية البحري.</li>
            <li><strong>شهادة المطابقة (Quality Cert):</strong> للتأكد من مواصفات الجودة والسلامة.</li>
          </ul>
        </div>

        {/* الترميز الجمركي الموحد */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
            <Globe2 size={20} />
          </div>
          <h4 className="text-sm font-bold text-gray-800">2. الرمز الجمركي الموحد (HS Code)</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            النظام المنسق (Harmonized System) هو تصنيف دولي موحد مكون من ترميز رقمي (عادة 8 أرقام) تفرضه منظمة الجمارك العالمية لوصف وتصنيف كل صنف تجاري مستورد.
          </p>
          <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100 text-xs text-amber-900 leading-relaxed">
            يحدد الرمز الجمركي نسبة الرسوم والضرائب المستحقة على البضاعة، وما إذا كانت خاضعة لإجراءات تقييد إضافية من هيئات متخصصة.
          </div>
        </div>

        {/* المسارات الجمركية الثلاثة */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold">
            <ShieldCheck size={20} />
          </div>
          <h4 className="text-sm font-bold text-gray-800">3. قنوات الفرز الجمركي (المسارات)</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            يقوم نظام المخاطر الآلي في المنافذ بفرز البيانات الجمركية المقدمة وتوجيه الحاويات إلكترونياً إلى أحد القنوات الثلاث التالية:
          </p>
          <ul className="text-xs text-gray-600 space-y-2">
            <li className="flex gap-2 items-start">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mt-1 shrink-0" />
              <span><strong>المسار الأخضر:</strong> فسح فوري وتخليص آلي للمستندات دون فحص عيني أو بدني.</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full mt-1 shrink-0" />
              <span><strong>المسار الأصفر:</strong> فحص وتدقيق دقيق للمستندات المرفقة فقط للتأكد من قيمتها وصحتها.</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full mt-1 shrink-0" />
              <span><strong>المسار الأحمر:</strong> معاينة وتفتيش عيني كامل وتمرير على كاشف الأشعة (X-ray) وسحب عينات.</span>
            </li>
          </ul>
        </div>

        {/* ضبط الجودة والمواصفات */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center font-bold">
            <Scale size={20} />
          </div>
          <h4 className="text-sm font-bold text-gray-800">4. فحص الجودة والمواصفات والمقاييس</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            تخضع السلع المستوردة الحساسة مثل (المواد الغذائية، الأدوية، مستحضرات التجميل، الأجهزة الكهربائية، والسيارات) إلى الرقابة الإلزامية من الهيئة الوطنية للمواصفات والمقاييس.
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            يتم سحب عينات عشوائية مغلقة بختم الجمرك وإرسالها للمختبرات للتأكد من تطابقها مع الكتالوج القياسي، لضمان صحة المواطنين وسلامة السوق المحلي.
          </p>
        </div>

        {/* سداد الرسوم والضرائب */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            <Award size={20} />
          </div>
          <h4 className="text-sm font-bold text-gray-800">5. احتساب الفاتورة الجمركية الموحدة</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            يتحمل المستورد سداد التكاليف المالية الإلزامية التالية لتبرئة ذمة الحاوية من الميناء:
          </p>
          <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
            <li><strong>الرسوم الجمركية:</strong> نسبة مئوية من القيمة الكلية للبضاعة محددة بالبند التعريفي.</li>
            <li><strong>ضريبة القيمة المضافة (VAT):</strong> عادة 15% من القيمة مضافاً إليها الرسم الجمركي.</li>
            <li><strong>رسوم الميناء والأرضيات:</strong> مقابل بقاء الحاوية ومناولتها بساحة الميناء.</li>
            <li><strong>رسوم فحص الأشعة:</strong> رسوم الفرز الآلي وتأمين البوابات.</li>
          </ul>
        </div>

        {/* الترانزيت البري ومستودعات التاجر */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            <Info size={20} />
          </div>
          <h4 className="text-sm font-bold text-gray-800">6. إذن التسليم النهائي والنقل اللوجستي</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            بمجرد إصدار بطاقة الفسح المبرأة الجمركية، يتسلم الوكيل اللوجستي إذن التسليم النهائي، ويتم تحميل الحاوية على الشاحنة الناقلة.
          </p>
          <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 text-xs text-emerald-900 leading-relaxed">
            من الضروري تتبع سلامة الختم الجمركي الفولاذي (Seal) المغلق على أبواب الحاوية منعا للسرقة أو التلاعب، ليفكه التاجر بمستودعه عقب جرد ومطابقة قائمة التعبئة الأصلية.
          </div>
        </div>
      </div>

      {/* تحذيرات هامة لتجنب الغرامات */}
      <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-start gap-4 shadow-2xs">
        <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
          <AlertTriangle size={22} />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-amber-900">تحذيرات جمركية هامة لتجنب الغرامات المالية والأرضيات المرتفعة:</h4>
          <p className="text-amber-800 leading-relaxed">
            تأكد دائماً من مطابقة بلد المنشأ المطبوع على السلعة مع الأوراق المصدرية، وتجنب تأخر سداد الرسوم الجمركية والضرائب الموحدة لأكثر من 48 ساعة لتفادي رسوم الحفظ والأرضيات وغرامات التأخير اليومية التي تفرضها إدارة الموانئ الجافة والبحرية.
          </p>
        </div>
      </div>
    </div>
  );
}
