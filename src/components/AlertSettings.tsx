/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AppNotification, AlertConfig, Shipment } from '../types';
import { 
  Bell, 
  Settings, 
  Check, 
  CheckCircle, 
  Volume2, 
  VolumeX, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Building,
  Sparkles,
  ShieldCheck,
  X,
  Trash2
} from 'lucide-react';

interface AlertSettingsProps {
  notifications: AppNotification[];
  alertConfig: AlertConfig;
  shipments: Shipment[];
  onUpdateConfig: (config: AlertConfig) => void;
  onMarkRead: (notifId: string) => void;
  onMarkAllRead: () => void;
  onClearNotifications: () => void;
  onTriggerMockAlert: (category: 'docs' | 'customs' | 'deadline' | 'delay', shipmentId?: string) => void;
}

export default function AlertSettings({
  notifications,
  alertConfig,
  shipments,
  onUpdateConfig,
  onMarkRead,
  onMarkAllRead,
  onClearNotifications,
  onTriggerMockAlert
}: AlertSettingsProps) {
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');
  const [filterCategory, setFilterCategory] = useState<'all' | 'docs' | 'customs' | 'deadline' | 'delay'>('all');
  const [mockShipmentId, setMockShipmentId] = useState<string>(shipments[0]?.id || '');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifs = notifications.filter(n => {
    if (filterCategory === 'all') return true;
    return n.category === filterCategory;
  });

  const getCategoryIcon = (category: AppNotification['category']) => {
    switch (category) {
      case 'docs':
        return <FileText size={14} className="text-blue-600" />;
      case 'customs':
        return <Building size={14} className="text-amber-600" />;
      case 'deadline':
        return <Clock size={14} className="text-rose-600" />;
      case 'delay':
        return <AlertTriangle size={14} className="text-orange-600" />;
    }
  };

  const getCategoryNameAr = (category: AppNotification['category']) => {
    switch (category) {
      case 'docs': return 'وصول الوثائق والمستندات';
      case 'customs': return 'بدء الإجراءات الجمركية';
      case 'deadline': return 'اقتراب المواعيد النهائية';
      case 'delay': return 'التأخيرات والمخاطر الميدانية';
    }
  };

  const getTypeStyle = (type: AppNotification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-100 text-emerald-800';
      case 'warning':
        return 'bg-amber-50 border-amber-100 text-amber-800';
      case 'delay':
        return 'bg-orange-50 border-orange-100 text-orange-850';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-100 text-blue-800';
    }
  };

  const handleConfigToggle = (key: keyof Omit<AlertConfig, 'deadlineThresholdDays'>) => {
    onUpdateConfig({
      ...alertConfig,
      [key]: !alertConfig[key]
    });
  };

  return (
    <div id="alerts_notification_dashboard" className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right">
      
      {/* العمود الأيمن: تفضيلات الإشعارات وإعدادات التخصيص والتحكم الميداني */}
      <div className="space-y-6">
        
        {/* بطاقة التبويبات والتحكم السريع */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex bg-gray-50/70 p-1.5 rounded-xl border border-gray-100">
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${activeTab === 'notifications' ? 'bg-white text-gray-800 shadow-3xs' : 'text-gray-400 hover:text-gray-650'}`}
            >
              مركز التنبيهات ({unreadCount})
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${activeTab === 'settings' ? 'bg-white text-gray-800 shadow-3xs' : 'text-gray-400 hover:text-gray-650'}`}
            >
              تخصيص وإعدادات التنبيه
            </button>
          </div>
        </div>

        {/* لوحة ضبط وتخصيص التنبيهات الجمركية الفورية */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
            <Settings size={18} className="text-emerald-600" />
            <h4 className="text-xs font-extrabold text-gray-805">تخصيص قواعد الإشعارات الآلية</h4>
          </div>

          <div className="space-y-4 text-xs">
            {/* وصول الوثائق */}
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <div>
                <span className="font-bold text-gray-750 block">تنبيهات وصول الوثائق الرقمية</span>
                <span className="text-[10px] text-gray-400">إشعار فوري عند صدور أو اكتمال الفاتورة والشهادات المعتمدة</span>
              </div>
              <button 
                onClick={() => handleConfigToggle('enableDocsArrival')}
                className={`w-11 h-6 rounded-full transition-all relative ${alertConfig.enableDocsArrival ? 'bg-emerald-600' : 'bg-gray-200'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${alertConfig.enableDocsArrival ? 'left-1' : 'left-6'}`}></div>
              </button>
            </div>

            {/* بدء الإجراءات */}
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <div>
                <span className="font-bold text-gray-750 block">تنبيهات بدء إجراءات الفحص</span>
                <span className="text-[10px] text-gray-400">إشعار عند إحالة الشحنة لجمرك الميناء وتحديد المسار (أحمر/أصفر)</span>
              </div>
              <button 
                onClick={() => handleConfigToggle('enableCustomsStart')}
                className={`w-11 h-6 rounded-full transition-all relative ${alertConfig.enableCustomsStart ? 'bg-emerald-600' : 'bg-gray-200'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${alertConfig.enableCustomsStart ? 'left-1' : 'left-6'}`}></div>
              </button>
            </div>

            {/* اقتراب المهلة */}
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <div>
                <span className="font-bold text-gray-750 block">تنبيهات المواعيد والمهل النهائية</span>
                <span className="text-[10px] text-gray-400">تحذير عند اقتراب مهلة تقديم البيان أو سداد الضرائب للميناء</span>
              </div>
              <button 
                onClick={() => handleConfigToggle('enableDeadlineApproaching')}
                className={`w-11 h-6 rounded-full transition-all relative ${alertConfig.enableDeadlineApproaching ? 'bg-emerald-600' : 'bg-gray-200'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${alertConfig.enableDeadlineApproaching ? 'left-1' : 'left-6'}`}></div>
              </button>
            </div>

            {/* التأخيرات والتحذيرات */}
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <div>
                <span className="font-bold text-gray-750 block">تحذيرات التأخيرات ومخاطر البحر</span>
                <span className="text-[10px] text-gray-400">إشعار فوري عند وجود عواصف، تكدس بموانئ اليمن، أو طلبات فحص مستعجل</span>
              </div>
              <button 
                onClick={() => handleConfigToggle('enablePotentialDelays')}
                className={`w-11 h-6 rounded-full transition-all relative ${alertConfig.enablePotentialDelays ? 'bg-emerald-600' : 'bg-gray-200'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${alertConfig.enablePotentialDelays ? 'left-1' : 'left-6'}`}></div>
              </button>
            </div>

            {/* مهلة الأيام */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] text-gray-400">
                <span>تحديد عتبة التنبيه لتقديم الوثائق:</span>
                <span className="font-bold text-emerald-600 font-sans">{alertConfig.deadlineThresholdDays} أيام قبل الوصول</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={alertConfig.deadlineThresholdDays}
                onChange={(e) => onUpdateConfig({ ...alertConfig, deadlineThresholdDays: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>

            {/* صوت التنبيه المحاكي */}
            <div className="flex items-center justify-between border-t border-gray-50 pt-3">
              <span className="font-bold text-gray-700">تفعيل نغمة الرنين المحاكية</span>
              <button 
                onClick={() => handleConfigToggle('soundEnabled')}
                className="p-1.5 rounded-lg border border-gray-150 hover:bg-gray-50 text-gray-550 transition-colors"
              >
                {alertConfig.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* لوحة التحكم المحاكية لتجربة وإثبات جودة النظام */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-emerald-100 pb-3">
            <Sparkles size={18} className="text-emerald-700" />
            <h4 className="text-xs font-extrabold text-emerald-800">توليد ومحاكاة تنبيهات حية مخصصة</h4>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-[10px] text-emerald-600 leading-relaxed">
              استخدم أدوات التوليد الآتية لاختبار تفعيل وإرسال الإشعارات التلقائية الفورية جمركياً على الشحنة المفضلة للتتبع والمطابقة.
            </p>

            <div className="space-y-1">
              <label className="text-[10px] text-emerald-750 block font-bold">اختر الشحنة المستهدفة للتنبيه:</label>
              <select 
                value={mockShipmentId}
                onChange={(e) => setMockShipmentId(e.target.value)}
                className="w-full text-[10px] font-sans p-2 rounded-lg border border-emerald-200 focus:outline-hidden focus:border-emerald-500 bg-white"
              >
                {shipments.map(s => (
                  <option key={s.id} value={s.id}>{s.code} - {s.title.substring(0, 24)}...</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                onClick={() => onTriggerMockAlert('docs', mockShipmentId)}
                className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold py-2 rounded-lg transition-all"
              >
                وصول وثيقة رقمية 📄
              </button>
              <button 
                onClick={() => onTriggerMockAlert('customs', mockShipmentId)}
                className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold py-2 rounded-lg transition-all"
              >
                بدء إجراء جمركي 📜
              </button>
              <button 
                onClick={() => onTriggerMockAlert('deadline', mockShipmentId)}
                className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold py-2 rounded-lg transition-all"
              >
                اقتراب الموعد ⏰
              </button>
              <button 
                onClick={() => onTriggerMockAlert('delay', mockShipmentId)}
                className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold py-2 rounded-lg transition-all"
              >
                تأخر جمركي ومناخي ⚠️
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* العمود الأيسر (بعرض 2 أعمدة): تصفية وعرض الإشعارات الرقمية الفورية */}
      <div className="lg:col-span-2">
        {activeTab === 'notifications' ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col h-full justify-between">
            
            {/* ترويسة قائمة الإشعارات */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-50 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-emerald-600 animate-swing" />
                <h4 className="text-xs font-extrabold text-gray-800">مركز التنبيهات الجمركية المباشر</h4>
                {unreadCount > 0 && (
                  <span className="bg-rose-550 text-white font-sans text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce">
                    {unreadCount} غير مقروء
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={onMarkAllRead}
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                >
                  تحديد الكل كمقروء
                </button>
                <span className="text-gray-200">|</span>
                <button 
                  onClick={onClearNotifications}
                  className="text-[10px] text-gray-400 hover:text-rose-600 font-bold flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  <span>تصفير الإشعارات</span>
                </button>
              </div>
            </div>

            {/* تصفيات الإشعارات الفرعية */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              <button 
                onClick={() => setFilterCategory('all')}
                className={`text-[9px] font-bold px-3 py-1 rounded-full border transition-all ${filterCategory === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 text-gray-500 border-gray-150 hover:bg-gray-100'}`}
              >
                الكل ({notifications.length})
              </button>
              <button 
                onClick={() => setFilterCategory('docs')}
                className={`text-[9px] font-bold px-3 py-1 rounded-full border transition-all ${filterCategory === 'docs' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-500 border-gray-150 hover:bg-gray-100'}`}
              >
                المستندات
              </button>
              <button 
                onClick={() => setFilterCategory('customs')}
                className={`text-[9px] font-bold px-3 py-1 rounded-full border transition-all ${filterCategory === 'customs' ? 'bg-amber-600 text-white border-amber-600' : 'bg-gray-50 text-gray-500 border-gray-150 hover:bg-gray-100'}`}
              >
                الإجراءات الجمركية
              </button>
              <button 
                onClick={() => setFilterCategory('deadline')}
                className={`text-[9px] font-bold px-3 py-1 rounded-full border transition-all ${filterCategory === 'deadline' ? 'bg-rose-600 text-white border-rose-600' : 'bg-gray-50 text-gray-500 border-gray-150 hover:bg-gray-100'}`}
              >
                المواعيد
              </button>
              <button 
                onClick={() => setFilterCategory('delay')}
                className={`text-[9px] font-bold px-3 py-1 rounded-full border transition-all ${filterCategory === 'delay' ? 'bg-orange-600 text-white border-orange-600' : 'bg-gray-50 text-gray-500 border-gray-150 hover:bg-gray-100'}`}
              >
                التأخيرات
              </button>
            </div>

            {/* قائمة الإشعارات الفعلية */}
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 flex-1">
              {filteredNotifs.length > 0 ? (
                filteredNotifs.map(n => (
                  <div 
                    key={n.id}
                    onClick={() => !n.isRead && onMarkRead(n.id)}
                    className={`p-3 rounded-xl border text-right transition-all flex items-start gap-3 relative cursor-pointer ${getTypeStyle(n.type)} ${!n.isRead ? 'ring-2 ring-emerald-600/10 font-bold border-emerald-200' : 'opacity-85'}`}
                  >
                    <div className="p-2 bg-white rounded-lg border border-gray-100 flex-shrink-0">
                      {getCategoryIcon(n.category)}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-gray-800">{n.title}</span>
                        <span className="text-[8px] text-gray-400 font-mono">{n.timestamp}</span>
                      </div>
                      <p className="text-[10px] text-gray-650 leading-relaxed font-sans">{n.message}</p>
                      {n.shipmentCode && (
                        <span className="inline-block text-[8px] bg-white border border-gray-150 px-1.5 py-0.5 rounded font-mono text-gray-500 mt-1">
                          رقم المعاملة: {n.shipmentCode}
                        </span>
                      )}
                    </div>

                    {/* علامة غير مقروء الخضراء */}
                    {!n.isRead && (
                      <span className="w-2 h-2 bg-emerald-600 rounded-full absolute left-3 top-3"></span>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-gray-400 space-y-2">
                  <Bell size={40} className="mx-auto text-gray-200" />
                  <p className="text-xs">سجل الإشعارات نظيف، لا يوجد أي تنبيهات غير مقروءة حالياً.</p>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs text-center py-12 text-gray-450 space-y-3">
            <ShieldCheck size={40} className="mx-auto text-emerald-600" />
            <h5 className="text-xs font-bold text-gray-800">قواعد وإعدادات تتبع الشحنات مؤمنة</h5>
            <p className="text-[10px] text-gray-450 leading-relaxed max-w-md mx-auto">
              تدار هذه البوابة تحت مسؤولية مصلحة الجمارك اليمنية والمخلّص المعتمد طه رضوان. يتم توجيه كل تنبيه آلياً إلى بريد العميل المستورد المسجل لسرعة المتابعة واستكمال سداد الضرائب وتجنب رسوم الأرضيات والمناولة.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
