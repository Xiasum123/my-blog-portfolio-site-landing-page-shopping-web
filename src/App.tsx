/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  Bot, 
  Calendar, 
  Activity, 
  History, 
  Search, 
  Bell, 
  Maximize, 
  Globe, 
  User, 
  MoreVertical, 
  Eye, 
  Edit3, 
  Trash2, 
  Plus, 
  Download, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Cpu,
  RefreshCw,
  LogOut,
  MapPin,
  PlusCircle,
  MinusCircle,
  Layers,
  Zap,
  ShieldCheck,
  AlertTriangle,
  X,
  Lock,
  ArrowRight,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type NavSection = '仪表盘' | '设备管理' | '任务调度' | '实时监控' | '系统日志' | '系统设置';

interface Robot {
  id: string;
  name: string;
  model: string;
  status: '在线' | '离线' | '错误' | '维修';
  battery: number;
  lastConnected: string;
}

interface ActivityItem {
  id: string;
  type: string;
  robotId: string;
  description: string;
  timestamp: string;
  status: 'success' | 'critical' | 'in-progress' | 'active';
  icon: React.ReactNode;
}

interface ScheduledTask {
  id: string;
  title: string;
  robotId: string;
  startTime: string;
  duration: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Scheduled' | 'Delayed' | 'Recurring';
}

interface SystemLog {
  id: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  source: string;
  message: string;
  timestamp: string;
}

// --- Mock Data ---
const ROBOTS: Robot[] = [
  { id: '#9842', name: '泰坦-X1 Pro', model: '二代自主货运型', status: '在线', battery: 88, lastConnected: '2分钟前' },
  { id: '#9845', name: '阿特拉斯-R4', model: '重型起重S系列', status: '离线', battery: 42, lastConnected: '4小时前' },
  { id: '#9851', name: '星火-S2', model: '精密操作器', status: '错误', battery: 12, lastConnected: '刚刚' },
  { id: '#9860', name: '钻头-V9', model: '挖掘无人机', status: '维修', battery: 95, lastConnected: '15分钟前' },
];

const RECENT_ACTIVITY: ActivityItem[] = [
  { 
    id: '1', 
    type: '任务完成', 
    robotId: 'RBT-9902-X', 
    description: '精密装配程序 #442 已成功完成。', 
    timestamp: '2分钟前', 
    status: 'success',
    icon: <CheckCircle2 className="w-4 h-4" />
  },
  { 
    id: '2', 
    type: '系统警报', 
    robotId: 'RBT-4211-M', 
    description: '电池电压低于安全阈值 (3.2V)。', 
    timestamp: '14分钟前', 
    status: 'critical',
    icon: <AlertCircle className="w-4 h-4" />
  },
  { 
    id: '3', 
    type: '设备维护', 
    robotId: 'RBT-1108-Z', 
    description: '已远程启动计划中的固件更新。', 
    timestamp: '45分钟前', 
    status: 'in-progress',
    icon: <Cpu className="w-4 h-4" />
  },
  { 
    id: '4', 
    type: '新任务', 
    robotId: 'RBT-8872-B', 
    description: '已派遣至 B 仓库进行库存扫描。', 
    timestamp: '1小时前', 
    status: 'active',
    icon: <Send className="w-4 h-4" />
  },
];

const SCHEDULED_TASKS: ScheduledTask[] = [
  { id: 'T-101', title: '库存同步', robotId: '#9842', startTime: '14:30', duration: '45分', priority: 'Medium', status: 'Scheduled' },
  { id: 'T-102', title: '周界巡逻', robotId: '#9860', startTime: '15:00', duration: '2小时', priority: 'High', status: 'Recurring' },
  { id: 'T-103', title: '标准校准', robotId: '#9851', startTime: '16:15', duration: '30分', priority: 'Low', status: 'Delayed' },
  { id: 'T-104', title: '深度清洁', robotId: '#9845', startTime: '18:00', duration: '3小时', priority: 'Medium', status: 'Scheduled' },
];

const SYSTEM_LOGS: SystemLog[] = [
  { id: 'L-001', level: 'CRITICAL', source: 'Core-AI', message: 'B 区神经网络同步失败。', timestamp: '2026-04-18 10:12:44' },
  { id: 'L-002', level: 'WARNING', source: '电量管理', message: '主充电枢纽检测到功率波动。', timestamp: '2026-04-18 10:14:02' },
  { id: 'L-003', level: 'INFO', source: '舰队通信', message: '与泰坦-X1 单元 #9842 握手成功。', timestamp: '2026-04-18 10:15:33' },
  { id: 'L-004', level: 'ERROR', source: 'Lidar服务', message: '二层楼板制图数据损坏。', timestamp: '2026-04-18 10:16:18' },
  { id: 'L-005', level: 'INFO', source: '认证节点', message: '首席管理员通过远程终端登录。', timestamp: '2026-04-18 10:18:55' },
];

// --- Components ---

const Sidebar = ({ activeSection, setActiveSection }: { activeSection: NavSection, setActiveSection: (s: NavSection) => void }) => {
  const navItems: { name: NavSection, icon: React.ReactNode }[] = [
    { name: '仪表盘', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: '设备管理', icon: <Bot className="w-5 h-5" /> },
    { name: '任务调度', icon: <Calendar className="w-5 h-5" /> },
    { name: '实时监控', icon: <Activity className="w-5 h-5" /> },
    { name: '系统日志', icon: <History className="w-5 h-5" /> },
    { name: '系统设置', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 z-50 bg-white/5 backdrop-blur-2xl border-r border-white/10 flex flex-col py-6 gap-2">
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/40">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-none font-headline tracking-tight">精密核心</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-on-surface-variant/80">舰队指挥系统</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setActiveSection(item.name)}
            className={`w-full flex items-center gap-4 px-6 py-4 font-bold tracking-widest text-[10px] uppercase transition-all duration-500 hover:pl-8 group relative ${
              activeSection === item.name 
                ? 'text-white' 
                : 'text-on-surface-variant hover:text-white hover:bg-white/5'
            }`}
          >
            {activeSection === item.name && (
              <motion.div 
                layoutId="activeTab"
                className="absolute inset-x-0 inset-y-0 bg-primary/20 border-r-4 border-primary backdrop-blur-md"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className={`relative z-10 transition-transform duration-500 group-hover:scale-110 ${activeSection === item.name ? 'text-primary' : 'opacity-60'}`}>
              {item.icon}
            </span>
            <span className="relative z-10">{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto px-4">
        <div className="p-4 rounded-xl glass-card">
          <div className="flex items-center gap-3">
             <img 
              className="w-10 h-10 rounded-lg object-cover ring-2 ring-white/10" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCo_VdtJZo2NNHccFDnRE6Vs-BBFM9J9gwUZyG5TOqA8Rk0RlrsKH7PK9IZYsZjMAulzLS6oxG1W_EdNkR6sbgwxZI5gO_EFHheetIqXaoxm9xlfoAtnHM2b0PBeTcBTytioAjWCofmrLTgtvGmZtPntCu1HuJmbIIjG_0KQo2pAdcrcCPll1_iyY6cdspl8YkN5ySVHPR_2g5gmppTKEQJHECFZc_7uF-Ymi2xctKYofsY7-cUxjS1uicDdZ2QWrIo2MKjHph81XQ" 
              alt="Admin Profile" 
              referrerPolicy="no-referrer"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-white">首席管理员</p>
              <p className="text-[10px] text-on-surface-variant">系统大师</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const Header = () => (
  <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 z-40 bg-white/2 backdrop-blur-xl flex justify-between items-center px-8 border-b border-white/10">
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20 rounded-lg border border-white/5">
        <Search className="w-4 h-4 text-on-surface-variant" />
        <input 
          type="text" 
          placeholder="全局系统搜索..." 
          className="bg-transparent border-none focus:ring-0 text-sm w-64 placeholder:text-on-surface-variant/40 text-white"
        />
      </div>
    </div>
    <div className="flex items-center gap-4">
      <button className="p-2 text-on-surface-variant hover:text-white transition-colors"><Bell className="w-5 h-5" /></button>
      <button className="p-2 text-on-surface-variant hover:text-white transition-colors"><Maximize className="w-5 h-5" /></button>
      <button className="p-2 text-on-surface-variant hover:text-white transition-colors"><Globe className="w-5 h-5" /></button>
      <button className="p-2 text-on-surface-variant hover:text-white transition-colors"><Settings className="w-5 h-5" /></button>
      <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
      <span className="text-xs font-bold text-on-surface-variant tracking-widest uppercase">v2.4.0-稳定版</span>
    </div>
  </header>
);

const DashboardContent = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard icon={<Bot />} label="机器人总数" value="1,284" trend="+12.5%" />
      <StatCard icon={<Calendar />} label="活动任务" value="342" status="活动中" isSecondary />
      <StatCard icon={<ShieldCheck />} label="系统健康度" value="99.4%" status="最佳" />
      <StatCard icon={<AlertTriangle />} label="关键警报" value="03" isError count={3} />
    </div>

    <div className="grid grid-cols-12 gap-8">
      <div className="col-span-12 lg:col-span-8 glass-card rounded-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-light text-white tracking-widest font-headline">每日运行小时数</h2>
            <p className="text-sm text-on-surface-variant">过去 7 天的舰队全平台性能指标</p>
          </div>
          <div className="flex gap-2">
            <button className="text-[10px] px-3 py-1.5 font-bold uppercase tracking-widest bg-white/10 rounded text-white backdrop-blur">每周</button>
            <button className="text-[10px] px-3 py-1.5 font-bold uppercase tracking-widest hover:bg-white/10 rounded text-on-surface-variant/60">每月</button>
          </div>
        </div>
        <div className="relative h-[280px] w-full flex items-end justify-between px-2">
          {[65, 80, 72, 95, 85, 45, 55].map((h, i) => (
             <div key={i} className="flex flex-col items-center gap-4 group w-full">
              <div 
                className="w-4/5 bg-primary/20 rounded-t-lg relative flex items-end justify-center group-hover:bg-primary/40 transition-all cursor-pointer"
                style={{ height: `${h}%` }}
              >
                <div className="absolute -top-10 bg-white/90 text-black text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">{(h/4).toFixed(1)}h</div>
                <div className="w-full h-[4px] bg-primary rounded-full mb-0 shadow-[0_0_20px_#3b82f6]"></div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                {['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i]}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="col-span-12 lg:col-span-4 glass-card rounded-2xl p-8">
        <h2 className="text-xl font-light text-white tracking-widest font-headline mb-8 text-center">机器人状态</h2>
        <div className="flex items-center justify-center mb-8 relative">
           <svg className="w-48 h-48 -rotate-90 transform" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="75, 100" strokeLinecap="round" />
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="15, 100" strokeDashoffset="-75" strokeLinecap="round" />
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray="5, 100" strokeDashoffset="-90" strokeLinecap="round" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-light text-white font-headline">1,284</span>
              <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">舰队总数</span>
            </div>
        </div>
        <div className="space-y-3">
          <StatusRow color="bg-primary" label="在线且活跃" value="75%" />
          <StatusRow color="bg-tertiary" label="维护中" value="15%" />
          <StatusRow color="bg-error" label="关键错误" value="5%" />
          <StatusRow color="bg-white/10" label="待机" value="5%" />
        </div>
      </div>
    </div>

    <div className="glass-card rounded-2xl p-0 overflow-hidden">
      <div className="flex items-center justify-between p-8 border-b border-white/5">
        <h2 className="text-xl font-light text-white tracking-widest font-headline">最近活动</h2>
        <button className="text-sm font-bold text-primary hover:underline">查看所有活动</button>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left border-b border-white/5 uppercase bg-white/2">
            <th className="px-8 py-5 text-[10px] font-bold tracking-widest text-on-surface-variant/60">事件类型</th>
            <th className="px-8 py-5 text-[10px] font-bold tracking-widest text-on-surface-variant/60">机器人 ID</th>
            <th className="px-8 py-5 text-[10px] font-bold tracking-widest text-on-surface-variant/60">描述</th>
            <th className="px-8 py-5 text-[10px] font-bold tracking-widest text-on-surface-variant/60">时间戳</th>
            <th className="px-8 py-5 text-[10px] font-bold tracking-widest text-on-surface-variant/60">状态</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 bg-black/10">
          {RECENT_ACTIVITY.map((item) => (
            <tr key={item.id} className="hover:bg-white/5 transition-colors group">
              <td className="px-8 py-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl backdrop-blur ${
                    item.status === 'success' ? 'bg-primary/20 text-primary' : 
                    item.status === 'critical' ? 'bg-error/20 text-error' : 
                    item.status === 'in-progress' ? 'bg-tertiary/20 text-tertiary' : 'bg-primary/20 text-primary'
                  }`}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-bold text-white">{item.type}</span>
                </div>
              </td>
              <td className="px-8 py-5 font-mono text-xs text-on-surface-variant">{item.robotId}</td>
              <td className="px-8 py-5 text-sm text-on-surface-variant">{item.description}</td>
              <td className="px-8 py-5 text-xs text-on-surface-variant/60">{item.timestamp}</td>
              <td className="px-8 py-5">
                <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-lg border ${
                  item.status === 'success' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 
                  item.status === 'critical' ? 'border-error/30 text-error bg-error/10' : 
                  item.status === 'in-progress' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' : 'border-primary/30 text-primary bg-primary/10'
                }`}>
                  {item.status === 'success' ? '成功' : item.status === 'critical' ? '关键' : item.status === 'in-progress' ? '进行中' : '活跃'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  </div>
);

const DeviceManagementContent = ({ onDispatch }: { onDispatch: (r: Robot) => void }) => (
  <div className="space-y-8">
    <div className="flex justify-between items-end">
      <div>
        <h2 className="text-3xl font-light text-white font-headline tracking-tight uppercase">舰队管理</h2>
        <p className="text-on-surface-variant mt-1">控制并协调您的自主操作。</p>
      </div>
      <div className="flex gap-3">
        <button className="px-4 py-2.5 bg-white/5 backdrop-blur text-sm font-bold rounded-lg flex items-center gap-2 border border-white/10 hover:bg-white/10 transition-all text-white">
          <Download className="w-4 h-4" /> 导出
        </button>
        <button className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> 添加设备
        </button>
      </div>
    </div>

    <div className="glass-card rounded-2xl p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">设备名称</label>
          <input className="w-full bg-black/20 border border-white/5 rounded-lg text-sm px-4 py-2.5 text-white outline-none focus:border-primary/50 transition-colors" placeholder="例如：泰坦-X1" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">序列号</label>
          <input className="w-full bg-black/20 border border-white/5 rounded-lg text-sm px-4 py-2.5 text-white outline-none focus:border-primary/50 transition-colors" placeholder="PE-XXXX-XXXX" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">状态</label>
          <select className="w-full bg-black/20 border border-white/5 rounded-lg text-sm px-4 py-2.5 appearance-none text-white outline-none focus:border-primary/50 transition-colors">
            <option>所有状态</option>
            <option>在线</option>
            <option>离线</option>
            <option>错误</option>
          </select>
        </div>
        <div className="flex justify-end pt-5">
            <button className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
              <RefreshCw className="w-3 h-3" /> 重置过滤器
            </button>
        </div>
      </div>
    </div>

    <div className="glass-card rounded-2xl overflow-hidden shadow-sm border border-white/10">
      <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-white/5 text-left border-b border-white/10">
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">ID</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">设备</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">状态</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">电量</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">最后连接时间</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 bg-black/10">
          {ROBOTS.map((robot) => (
            <tr key={robot.id} className="group hover:bg-white/5 transition-all text-white/80 hover:text-white">
              <td className="px-6 py-5 font-mono text-xs opacity-60">{robot.id}</td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-xl group-hover:bg-primary group-hover:text-white transition-all border border-white/5">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{robot.name}</p>
                    <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase">{robot.model}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                  robot.status === '在线' ? 'border-primary/30 bg-primary/10 text-primary' : 
                  robot.status === '错误' ? 'border-error/30 bg-error/10 text-error' : 'border-white/10 bg-white/5 text-on-surface-variant/60'
                }`}>
                  {robot.status}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="w-32 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="opacity-60">{robot.battery}%</span>
                    <span className={robot.battery < 20 ? 'text-error' : 'text-primary'}>
                      {robot.battery < 20 ? '关键' : '标称'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div className={`h-full transition-all duration-1000 shadow-[0_0_10px] ${robot.battery < 20 ? 'bg-error shadow-error/40' : 'bg-primary shadow-primary/40'}`} style={{ width: `${robot.battery}%` }} />
                  </div>
                </div>
              </td>
              <td className="px-6 py-5 text-sm font-medium opacity-80">{robot.lastConnected}</td>
              <td className="px-6 py-5 text-right">
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 transition-all">
                  <button onClick={() => onDispatch(robot)} title="派遣任务" className="p-2 text-primary hover:bg-white/10 rounded-lg transition-all"><Send className="w-4 h-4" /></button>
                  <button title="查看详情" className="p-2 text-on-surface-variant hover:text-white hover:bg-white/10 rounded-lg transition-all text-white/40"><Eye className="w-4 h-4" /></button>
                  <button title="编辑" className="p-2 text-on-surface-variant hover:text-white hover:bg-white/10 rounded-lg transition-all text-white/40"><Edit3 className="w-4 h-4" /></button>
                  <button title="删除" className="p-2 text-error hover:bg-white/10 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <div className="p-6 bg-white/5 border-t border-white/5 flex items-center justify-between">
        <p className="text-xs font-bold text-on-surface-variant/60 italic">显示 42 个活动单元中的 1-4 个</p>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded hover:bg-white/10 text-on-surface-variant/40"><ChevronLeft className="w-4 h-4" /></button>
          <button className="w-8 h-8 rounded bg-primary text-white font-bold text-xs ring-2 ring-primary/20">1</button>
          <button className="w-8 h-8 rounded hover:bg-white/10 font-bold text-xs text-on-surface-variant/80">2</button>
          <button className="w-8 h-8 rounded hover:bg-white/10 font-bold text-xs text-on-surface-variant/80">3</button>
          <button className="p-2 rounded hover:bg-white/10 text-on-surface-variant/40"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  </div>
);

const MonitoringContent = () => {
  const [showAlerts, setShowAlerts] = useState(false);

  return (
    <div className="space-y-8 relative">
       <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-light text-white font-headline tracking-tight uppercase">舰队遥测</h2>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/20 backdrop-blur rounded-lg border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">活跃：42 个单元</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-error/20 backdrop-blur rounded-lg border border-error/20 cursor-pointer hover:bg-error/30 transition-all" onClick={() => setShowAlerts(true)}>
              <div className="w-2 h-2 rounded-full bg-error" />
              <span className="text-[10px] font-bold text-error uppercase tracking-widest">3 个警报</span>
            </div>
          </div>
        </div>
        <button className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/40 hover:opacity-90 transition-all uppercase tracking-widest text-[11px]">
          导出遥测数据
        </button>
      </div>

      <div className="relative group">
        <div className="glass-card rounded-2xl overflow-hidden aspect-[16/9] relative h-full transition-all duration-500">
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYtoO64qoPI7Kmokf04fV3xnrCprqBCpb0FUOZB59_pJHi2k0p1V_5Fnafj7C0OXD2hIpKdADSev9vtEOMdSHNnVWr1_PKRhxVpEwA_K-P9I_MHIixFX9EwOQKGkLrw08oOXN_rBQIhxPTtML5ZOXsnJ8-ZtfxPBUu_H2yD9jmKf48Fad4_AtTf2eUaXKVsxsnVerV9MwRLLDLklFGs8G2ef3bKmzoJmSbZv4D9A7mxzsCVVNXNjFj2vzD8QNnXU8AXce4ai8NUgw" 
                className="w-full h-full object-cover opacity-40 grayscale sepia brightness-50 contrast-125"
                alt="平面图"
                referrerPolicy="no-referrer"
              />
              {/* Mock Markers */}
              <div className="absolute top-[30%] left-[45%] group/marker cursor-pointer">
                <div className="w-8 h-8 bg-primary/30 rounded-full flex items-center justify-center animate-ping absolute" />
                <div className="w-5 h-5 bg-primary rounded-full relative shadow-[0_0_15px_#3b82f6] border border-white/20" />
              </div>
              <div className="absolute top-[65%] left-[25%] group/marker cursor-pointer">
                <div className="w-8 h-8 bg-error/30 rounded-full flex items-center justify-center animate-ping absolute" />
                <div className="w-5 h-5 bg-error rounded-full relative shadow-[0_0_15px_#ef4444] border border-white/20" />
              </div>
          </div>
          
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-black/40 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-white uppercase tracking-widest text-[10px]">7-G 区指挥中心</span>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
              <button className="p-2.5 bg-black/40 backdrop-blur-xl rounded-xl hover:bg-white/10 transition-all border border-white/10 text-white"><PlusCircle className="w-5 h-5" /></button>
              <button className="p-2.5 bg-black/40 backdrop-blur-xl rounded-xl hover:bg-white/10 transition-all border border-white/10 text-white opacity-40"><MinusCircle className="w-5 h-5" /></button>
              <button className="p-2.5 bg-black/40 backdrop-blur-xl rounded-xl hover:bg-white/10 transition-all border border-white/10 text-white"><Layers className="w-5 h-5" /></button>
          </div>

          {!showAlerts && (
            <motion.div 
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="absolute right-0 top-0 bottom-0 flex items-center z-20"
            >
              <button 
                onClick={() => setShowAlerts(true)}
                className="bg-primary/90 text-white p-2 rounded-l-xl shadow-2xl backdrop-blur-xl hover:bg-primary transition-all flex items-center gap-2 group/btn"
              >
                <div className="flex flex-col items-center">
                  <ChevronLeft className="w-5 h-5 group-hover/btn:-translate-x-1 transition-transform" />
                  <span className="[writing-mode:vertical-lr] text-[10px] font-bold uppercase tracking-widest mt-2 py-2">警报记录</span>
                </div>
              </button>
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {showAlerts && (
            <motion.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-80 z-30 pointer-events-auto"
            >
              <div className="glass-card rounded-2xl p-6 flex flex-col h-full shadow-[-20px_0_40px_rgba(0,0,0,0.5)] border-l border-white/10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                     <button 
                      onClick={() => setShowAlerts(false)}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-on-surface-variant transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <h3 className="font-light text-white font-headline text-lg uppercase tracking-widest italic">关键警报</h3>
                  </div>
                  <span className="text-[10px] font-bold border border-error/50 text-error px-2 py-0.5 rounded shadow-[0_0_10px_rgba(239,68,68,0.2)]">1 级</span>
                </div>
                <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <AlertItem title="机器人 #402：电量低" desc="电量低于 15% 阈值。正在返回充电座。" time="2分钟前" type="critical" />
                  <AlertItem title="机器人 #109：路径受阻" desc="在 4 号通道检测到障碍物。正在重新计算路径。" time="5分钟前" type="warning" />
                  <AlertItem title="激光雷达传感器故障" desc="机器人 #221 报告噪声异常。" time="14分钟前" type="info" />
                  <AlertItem title="更新 v2.4.1" desc="ARM-X 控制器固件更新可用。" time="45分钟前" type="update" />
                  <AlertItem title="系统维护预告" desc="计划于 UTC 04:00 进行核心同步。" time="1小时前" type="info" />
                </div>
                <button className="mt-8 w-full py-4 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant hover:text-white hover:bg-white/10 transition-all">
                  打开遥测流
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const TaskSchedulingContent = () => (
  <div className="space-y-8">
     <div className="flex justify-between items-end">
      <div>
        <h2 className="text-3xl font-light text-white font-headline tracking-widest uppercase">任务调度</h2>
        <p className="text-on-surface-variant mt-1">配置并监控自动化的舰队运行。</p>
      </div>
      <div className="flex gap-3">
        <button className="px-6 py-2.5 bg-primary text-white text-[11px] font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-primary/40 hover:opacity-90 transition-all flex items-center gap-2">
          <Calendar className="w-4 h-4" /> 新建序列
        </button>
      </div>
    </div>

    <div className="grid grid-cols-12 gap-8">
      <div className="col-span-12 lg:col-span-8 space-y-4">
        {SCHEDULED_TASKS.map((task, i) => (
          <div key={task.id} className="glass-card rounded-2xl p-6 flex items-center gap-6 group hover:bg-white/5 transition-all">
            <div className="flex flex-col items-center justify-center p-3 py-4 bg-white/5 border border-white/5 rounded-xl w-20 backdrop-blur-md">
               <span className="text-xs font-bold font-headline text-white">{task.startTime}</span>
               <div className="h-4 w-[1px] bg-white/10 my-1" />
               <span className="text-[9px] font-bold text-on-surface-variant/60">{task.duration}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h4 className="font-bold font-headline text-white/90">{task.title}</h4>
                <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg border backdrop-blur-sm ${
                  task.priority === 'High' ? 'border-error/30 bg-error/10 text-error' : 
                  task.priority === 'Medium' ? 'border-tertiary/30 bg-tertiary/10 text-tertiary' : 'border-primary/30 bg-primary/10 text-primary'
                }`}>
                  {task.priority === 'High' ? '高' : task.priority === 'Medium' ? '中' : '低'} 优先级
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-on-surface-variant/80 italic">
                <span className="flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" /> 已分配：{task.robotId}</span>
                <span className="flex items-center gap-1.5 font-mono text-[10px]"><Clock className="w-3.5 h-3.5" /> 任务 ID: {task.id}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                task.status === 'Scheduled' ? 'text-primary' : 
                task.status === 'Delayed' ? 'text-error' : 'text-tertiary'
              }`}>
                {task.status === 'Scheduled' ? '已调度' : task.status === 'Delayed' ? '延迟' : '循环'}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button title="编辑" className="p-2 hover:bg-white/10 text-white rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                <button title="删除" className="p-2 hover:bg-error/10 text-error rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        <div className="glass-card rounded-2xl p-8 h-full bg-primary/5">
          <h3 className="text-lg font-light text-white font-headline mb-8 uppercase tracking-widest italic">优化统计</h3>
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-1">舰队效率</p>
                <p className="text-3xl font-light font-headline text-white">94.2%</p>
              </div>
              <Activity className="w-10 h-10 text-primary opacity-30" />
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
               <div className="h-full bg-primary w-[94%] shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            </div>
            <div className="pt-8 border-t border-white/5 space-y-6">
               {[
                 { label: '拥堵风险', value: '低', color: 'text-primary' },
                 { label: '能量负载', value: '标称', color: 'text-tertiary' },
                 { label: '吞吐量', value: '+12%', color: 'text-primary' }
               ].map((item, idx) => (
                 <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-on-surface-variant/80 italic">{item.label}</span>
                    <span className={`font-bold uppercase tracking-widest border px-2 py-0.5 rounded-lg border-white/10 bg-white/5 ${item.color}`}>{item.value}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const LogsContent = () => (
  <div className="space-y-8 font-mono">
     <div className="flex justify-between items-end">
      <div>
        <h2 className="text-3xl font-light text-white font-headline tracking-widest font-sans uppercase">系统诊断</h2>
        <p className="text-on-surface-variant mt-1 font-sans">来自集体意识的原始遥测数据和事件流。</p>
      </div>
      <div className="flex gap-2">
        {['全部', '信息', '警告', '错误'].map(lvl => (
          <button key={lvl} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-[0.2em] border transition-all ${
            lvl === '全部' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-on-surface-variant/80 hover:bg-white/10 hover:text-white'
          }`}>
            {lvl}
          </button>
        ))}
      </div>
    </div>

    <div className="glass-card rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
      <div className="bg-white/5 p-4 flex items-center gap-4 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-error/80" />
          <div className="w-3 h-3 rounded-full bg-tertiary/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>
        <span className="text-[10px] text-white/40 uppercase font-bold tracking-[0.3em] font-sans">精密操作系统 ~ 遥测日志</span>
      </div>
      <div className="p-0 overflow-x-auto min-h-[600px] bg-black/40">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/2 text-white/40 uppercase text-[9px] font-bold tracking-widest border-b border-white/5">
             <tr>
               <th className="px-6 py-4 border-r border-white/5">时间戳</th>
               <th className="px-6 py-4 border-r border-white/5">级别</th>
               <th className="px-6 py-4 border-r border-white/5">来源</th>
               <th className="px-6 py-4">消息负载</th>
             </tr>
          </thead>
          <tbody className="text-white/70 text-[11px]">
            {SYSTEM_LOGS.map((log) => (
              <tr key={log.id} className="border-b border-white/5 hover:bg-white/2 transition-colors group">
                <td className="px-6 py-3 text-white/40 whitespace-nowrap">{log.timestamp}</td>
                <td className="px-6 py-3">
                  <span className={`font-bold border px-2 py-0.5 rounded-lg backdrop-blur-sm ${
                    log.level === 'CRITICAL' ? 'border-error/20 bg-error/10 text-error' : 
                    log.level === 'ERROR' ? 'border-error/20 bg-error/10 text-error' : 
                    log.level === 'WARNING' ? 'border-tertiary/20 bg-tertiary/10 text-tertiary' : 'border-primary/20 bg-primary/10 text-primary'
                  }`}>
                    {log.level === 'CRITICAL' ? '关键' : log.level === 'ERROR' ? '错误' : log.level === 'WARNING' ? '警告' : '信息'}
                  </span>
                </td>
                <td className="px-6 py-3 text-blue-400 opacity-80">{log.source}</td>
                <td className="px-6 py-3 group-hover:text-white transition-colors">
                  <span className="text-emerald-500 mr-2 opacity-60">➜</span>
                   {log.message}
                </td>
              </tr>
            ))}
            <tr className="border-b border-white/2 bg-black/20 opacity-50 italic">
                <td className="px-6 py-3 text-white/20 font-light">2026-04-18 10:20:11</td>
                <td className="px-6 py-3"><span className="text-primary/60">信息</span></td>
                <td className="px-6 py-3 text-blue-300/40">网络驱动</td>
                <td className="px-6 py-3 text-white/30 truncate">数据包心跳已确认 [ID: 0x9F22]</td>
            </tr>
            <tr className="border-b border-white/2 bg-black/20 opacity-40 italic">
                <td className="px-6 py-3 text-white/20 font-light">2026-04-18 10:21:05</td>
                <td className="px-6 py-3"><span className="text-primary/60">信息</span></td>
                <td className="px-6 py-3 text-blue-300/40">系统输入输出</td>
                <td className="px-6 py-3 text-white/30 truncate">缓冲区刷新完成。未报告错误。</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const SystemSettingsContent = () => (
  <div className="space-y-8">
     <div className="flex justify-between items-end">
      <div>
        <h2 className="text-3xl font-light text-white font-headline tracking-widest uppercase">系统核心</h2>
        <p className="text-on-surface-variant mt-1">微调舰队的操作边界和安全协议。</p>
      </div>
      <button className="px-8 py-2.5 bg-primary text-white text-[11px] font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all">
        确认更改
      </button>
    </div>

    <div className="grid grid-cols-12 gap-8">
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <SettingsCard title="自主协议">
           <ToggleRow label="动态避障" checked />
           <ToggleRow label="自动充电派遣" checked />
           <ToggleRow label="集群协调" />
           <ToggleRow label="人员存在检测" checked />
        </SettingsCard>

        <SettingsCard title="连接与遥测">
           <div className="space-y-4 px-1 pt-2">
             <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">采样率 (ms)</label>
             <input type="range" className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary" min="10" max="1000" defaultValue="100" />
             <div className="flex justify-between text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">
               <span className="opacity-40">10ms</span>
               <span className="text-primary">100ms</span>
               <span className="opacity-40">1000ms</span>
             </div>
           </div>
        </SettingsCard>
      </div>

      <div className="col-span-12 lg:col-span-8 space-y-6">
        <div className="glass-card rounded-2xl p-8 bg-white/2">
           <h3 className="font-light text-white font-headline text-lg uppercase tracking-widest mb-10 italic">安全与权限</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-8">
                 <h4 className="text-[10px] font-bold uppercase text-on-surface-variant/40 tracking-[0.3em] border-l-2 border-primary pl-4">访问层级</h4>
                 {[
                   { label: '远程终端访问', status: '已启用' },
                   { label: '手动操纵杆覆盖', status: '受限' },
                   { label: 'API 集成枢纽', status: '运行中' },
                   { label: '云端同步备份', status: '待机' },
                 ].map((item, i) => (
                   <div key={i} className="flex justify-between items-center group">
                      <span className="text-sm font-bold text-white/80 group-hover:text-primary transition-colors italic">{item.label}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        item.status === '已启用' || item.status === '运行中' ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-white' : 'border-white/5 bg-white/2 text-on-surface-variant/40'
                      }`}>{item.status}</span>
                   </div>
                 ))}
              </div>
              <div className="space-y-8">
                 <h4 className="text-[10px] font-bold uppercase text-on-surface-variant/40 tracking-[0.3em] border-l-2 border-error pl-4">系统阈值</h4>
                 <div className="p-6 bg-error/5 rounded-2xl border border-error/10 backdrop-blur-sm">
                    <p className="text-[10px] font-bold text-error uppercase tracking-[0.2em] mb-6">关键覆盖</p>
                    <div className="space-y-6">
                       <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-white/90">热关断</span>
                          <button className="px-3 py-1 bg-error text-white text-[9px] font-bold rounded-lg uppercase tracking-widest shadow-lg shadow-error/20">活动</button>
                       </div>
                       <p className="text-[11px] italic font-medium text-on-surface-variant/70 leading-relaxed">
                         如果温度值连续 2 秒 &gt; 85°C，核心温度传感器将触发立即运行冻结。
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="glass-card rounded-2xl p-8 bg-white/3">
           <div className="flex justify-between items-center mb-8">
              <h3 className="font-light text-white font-headline text-lg uppercase tracking-widest italic">硬件标识</h3>
              <span className="text-[10px] font-mono text-on-surface-variant/40 bg-white/5 px-2 py-0.5 rounded border border-white/5">节点 ID: 98AB-11-F</span>
           </div>
           <div className="flex flex-wrap gap-4">
              {['激光雷达-V2', 'ARM控制器-V4', '网格网络', 'AI中心', '安全网关', '电源系统'].map(tag => (
                <span key={tag} className="px-5 py-2.5 bg-white/5 border border-white/5 text-[10px] font-bold text-on-surface-variant tracking-widest rounded-xl flex items-center gap-3 group cursor-pointer hover:bg-white/10 hover:text-white transition-all">
                  <Cpu className="w-4 h-4 group-hover:scale-110 transition-transform opacity-60" /> {tag}
                </span>
              ))}
           </div>
        </div>
      </div>
    </div>
  </div>
);

const SettingsCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="glass-card rounded-2xl p-8 shadow-sm">
    <h3 className="font-bold font-headline text-[10px] uppercase tracking-[0.3em] mb-8 text-on-surface-variant/40">{title}</h3>
    <div className="space-y-6">
       {children}
    </div>
  </div>
);

const ToggleRow = ({ label, checked }: { label: string, checked?: boolean }) => (
  <div className="flex items-center justify-between group cursor-pointer">
    <span className="text-sm font-bold text-on-surface-variant/80 group-hover:text-white transition-colors italic">{label}</span>
    <div className={`w-11 h-6 rounded-full relative transition-all border duration-300 ${checked ? 'bg-primary border-primary' : 'bg-white/5 border-white/10'}`}>
       <div className={`absolute top-1 w-3.5 h-3.5 rounded-full bg-white transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] ${checked ? 'left-6' : 'left-1'}`} />
    </div>
  </div>
);

const StatCard = ({ icon, label, value, trend, status, isSecondary, isError, count }: any) => (
  <div className={`p-6 rounded-2xl glass-card transition-all group cursor-default ${
    isError ? 'bg-error/10 border-error/20' : ''
  }`}>
    <div className="flex justify-between items-start mb-6">
      <div className={`p-3 rounded-xl border ${
        isError ? 'bg-error text-white border-error/50' : 
        isSecondary ? 'bg-tertiary/20 text-tertiary border-tertiary/30' : 'bg-primary/20 text-primary border-primary/30'
      }`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
      </div>
      {trend && <span className="text-[10px] font-bold text-primary bg-primary/20 px-2 py-1 rounded-lg border border-primary/20 backdrop-blur">{trend}</span>}
      {status && <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-lg border backdrop-blur ${
        status === '活动中' ? 'bg-tertiary/20 text-tertiary border-tertiary/30' : 'bg-primary/20 text-primary border-primary/30'
      }`}>{status}</span>}
      {count && (
        <div className="flex -space-x-2">
          {Array.from({ length: count }).map((_, i) => (
             <div key={i} className="w-6 h-6 rounded-full border border-white/20 bg-error flex items-center justify-center shadow-lg" />
          ))}
        </div>
      )}
    </div>
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60 mb-1">{label}</p>
    <h3 className={`text-4xl font-light font-headline ${isError ? 'text-white' : 'text-white'}`}>{value}</h3>
  </div>
);

const StatusRow = ({ color, label, value }: { color: string, label: string, value: string }) => (
  <div className="flex items-center justify-between p-3.5 rounded-xl hover:bg-white/5 transition-all group cursor-default">
    <div className="flex items-center gap-4">
      <div className={`w-3.5 h-3.5 rounded-md ${color} shadow-[0_0_10px] shadow-current opacity-80`} />
      <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest group-hover:text-white/60 transition-colors">{label}</span>
    </div>
    <span className="text-sm font-light text-white font-headline italic tracking-wide">{value}</span>
  </div>
);

const AlertItem = ({ title, desc, time, type }: any) => (
  <div className={`p-4 rounded-xl flex items-start gap-4 transition-all hover:scale-[1.02] border border-transparent hover:border-white/10 cursor-default backdrop-blur-sm ${
    type === 'critical' ? 'bg-error/10 border-error/10' : 'bg-white/2 border-white/5'
  }`}>
    <div className={`p-2 rounded-lg ${
      type === 'critical' ? 'text-error' : 
      type === 'warning' ? 'text-tertiary' : 'text-primary'
    }`}>
      {type === 'critical' ? <AlertTriangle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
    </div>
    <div className="overflow-hidden">
      <p className={`font-bold text-sm ${type === 'critical' ? 'text-white' : 'text-white/90'}`}>{title}</p>
      <p className="text-xs font-medium text-on-surface-variant/80 truncate italic mt-1">{desc}</p>
      <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/40 mt-3 block">{time}</span>
    </div>
  </div>
);


const DispatchModal = ({ robot, onClose }: { robot: Robot, onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0f172a]/80 backdrop-blur-sm"
  >
    <motion.div 
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      className="relative bg-[#1e293b]/90 backdrop-blur-2xl w-full max-w-lg rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
    >
      <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 backdrop-blur-xl flex items-center justify-center text-primary border border-white/10">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-light text-white font-headline tracking-widest uppercase">任务指派</h3>
            <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">指派给 {robot.name}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 group rounded-full transition-all">
          <X className="w-5 h-5 text-on-surface-variant group-hover:text-white" />
        </button>
      </div>

      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-2">选定单元</label>
          <div className="w-full bg-black/30 rounded-2xl px-5 py-3 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm text-white">{robot.name}</span>
            </div>
            <span className="font-mono text-[10px] bg-white/10 text-white/60 px-2 py-0.5 rounded uppercase font-bold">{robot.id}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-2">任务层级</label>
            <select className="w-full bg-black/30 border border-white/5 rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-primary/50 appearance-none">
              <option>例行巡逻</option>
              <option>供应链运输</option>
              <option>深度扫描</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-2">优先级</label>
            <select className="w-full bg-black/30 border border-white/5 rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-primary/50 appearance-none">
              <option>Alpha (高)</option>
              <option selected>Beta (中)</option>
              <option>Gamma (低)</option>
            </select>
          </div>
        </div>

         <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-2">备注 / 参数</label>
          <textarea 
            className="w-full bg-black/30 border border-white/5 rounded-2xl px-4 py-3 text-sm font-medium h-32 resize-none italic text-white/80 outline-none focus:border-primary/50" 
            placeholder="系统说明或手动覆盖参数..."
          />
        </div>
      </div>

      <div className="px-8 py-6 bg-black/20 border-t border-white/5 flex justify-end gap-4">
        <button onClick={onClose} className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-white transition-all">取消</button>
        <button className="px-8 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all outline-none">
          执行协议
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// --- Login Page ---

const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth verification
    setTimeout(() => {
      onLogin();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-br from-[#060a12] via-[#111827] to-[#060a12] overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-tertiary/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[420px] p-4"
      >
        <div className="glass-card rounded-3xl p-10 border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Subtle Scanline Effect */}
          <div className="absolute inset-0 bg-scanlines opacity-[0.02] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex flex-col items-center mb-10">
              <div className="mb-4 p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <Shield className="w-10 h-10 text-primary shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
              </div>
              <h1 className="text-2xl font-bold text-white font-headline tracking-widest uppercase mb-1">精密核心指挥系统</h1>
              <p className="text-[10px] font-bold text-on-surface-variant/40 tracking-[0.4em] uppercase">Precision Core Fleet OS</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-4 flex items-center text-on-surface-variant/40 group-focus-within/input:text-primary transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-11 py-3.5 text-sm font-medium text-white outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
                    placeholder="请输入账号"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-4 flex items-center text-on-surface-variant/40 group-focus-within/input:text-primary transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    type="password" 
                    required
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-11 py-3.5 text-sm font-medium text-white outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
                    placeholder="请输入密码"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 relative group/input">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center text-on-surface-variant/40 group-focus-within/input:text-primary transition-colors">
                       <ShieldCheck className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" 
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-11 py-3.5 text-sm font-medium text-white outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
                      placeholder="验证码"
                    />
                    <div className="absolute top-1/2 -translate-y-1/2 right-2 h-8 w-24 bg-white/5 border border-white/5 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all">
                       <span className="text-xs font-bold font-mono tracking-tighter text-primary/60 italic select-none">3 8 F G</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pb-2">
                <label className="flex items-center gap-2 cursor-pointer group/check">
                  <input type="checkbox" className="hidden" />
                  <div className="w-4 h-4 border border-white/10 rounded-md bg-white/5 flex items-center justify-center transition-all group-hover/check:border-primary/30">
                    <div className="w-2 h-2 rounded-[2px] bg-primary scale-0 group-hover/check:scale-100 transition-transform" />
                  </div>
                  <span className="text-[11px] font-bold text-on-surface-variant/60 tracking-wider">记住密码</span>
                </label>
                <button type="button" className="text-[11px] font-bold text-primary/60 hover:text-primary tracking-wider transition-colors">忘记密码？</button>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 bg-primary text-white text-[13px] font-bold uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none relative overflow-hidden group/btn"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>登 录</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-white/5 flex justify-center">
               <p className="text-[10px] font-bold text-on-surface-variant/20 tracking-[0.5em] uppercase">授权终端连接中</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSection, setActiveSection] = useState<NavSection>('仪表盘');
  const [dispatchTarget, setDispatchTarget] = useState<Robot | null>(null);

  // --- Inactivity Timeout Logic (2 Minutes) ---
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_LIMIT = 2 * 60 * 1000; // 2 minutes

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isLoggedIn) {
      timeoutRef.current = setTimeout(() => {
        console.log("Inactivity detected. Returning to login.");
        setIsLoggedIn(false);
        setActiveSection('仪表盘'); // Return to home section
      }, INACTIVITY_LIMIT);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => window.addEventListener(event, resetTimeout));
      resetTimeout();
      return () => {
        events.forEach(event => window.removeEventListener(event, resetTimeout));
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
  }, [isLoggedIn, resetTimeout]);

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {!isLoggedIn ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          >
            <LoginPage onLogin={() => setIsLoggedIn(true)} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="min-h-screen"
          >
            <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
            <Header />
            
            <main className="ml-64 pt-16 min-h-screen">
              <div className="p-8 max-w-[1600px] mx-auto">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeSection === '仪表盘' && <DashboardContent />}
                  {activeSection === '设备管理' && <DeviceManagementContent onDispatch={(r) => setDispatchTarget(r)} />}
                  {activeSection === '任务调度' && <TaskSchedulingContent />}
                  {activeSection === '实时监控' && <MonitoringContent />}
                  {activeSection === '系统日志' && <LogsContent />}
                  {activeSection === '系统设置' && <SystemSettingsContent />}
                </motion.div>
              </div>
              
              <footer className="py-12 px-12 border-t border-white/5 flex justify-between items-center mt-24">
                  <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-on-surface-variant/20">
                    © 2026 精密核心 | 工业操作系统 v4.11_α
                  </p>
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400/40">遥测：稳定</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_#3b82f6]" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary/40">节点：已加密</span>
                    </div>
                  </div>
              </footer>
            </main>

            <AnimatePresence>
              {dispatchTarget && (
                <DispatchModal robot={dispatchTarget} onClose={() => setDispatchTarget(null)} />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
        .bg-scanlines {
          background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 51%);
          background-size: 100% 4px;
        }
      `}</style>
    </div>
  );
}
