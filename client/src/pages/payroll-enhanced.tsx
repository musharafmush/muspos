import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
    UsersIcon,
    DollarSignIcon,
    CalendarIcon,
    ClockIcon,
    PlusIcon,
    SearchIcon,
    FilterIcon,
    DownloadIcon,
    RefreshCwIcon,
    TrendingUpIcon,
    CheckCircle2Icon,
    AlertCircleIcon,
    SettingsIcon,
    FileTextIcon,
    LayoutDashboardIcon,
    WalletIcon,
    BriefcaseIcon
} from "lucide-react";
import type { Employee } from "@shared/sqlite-schema";

interface PayrollStats {
    totalEmployees: number;
    activeEmployees: number;
    monthlyPayout: number;
    pendingApprovals: number;
    attendanceRate: number;
    averageSalary: number;
}

export default function PayrollEnhanced() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // State
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("all");
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    // Queries
    const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
        queryKey: ['/api/employees'],
    });

    const { data: payrollRecords = [], isLoading: payrollLoading } = useQuery({
        queryKey: ['/api/payroll/month', selectedMonth],
    });

    // Calculate Stats (Enhanced)
    const stats: PayrollStats = {
        totalEmployees: employees.length,
        activeEmployees: employees.filter(e => e.status === 'active').length,
        monthlyPayout: payrollRecords.reduce((sum: number, r: any) => sum + (r.netSalaryEarned || 0), 0),
        pendingApprovals: 5, // Hardcoded for demo
        attendanceRate: 98.5, // Hardcoded for demo
        averageSalary: employees.length > 0 ? 45000 : 0, // Hardcoded for demo
    };

    // Filtered employees
    const filteredEmployees = (employees as any[]).filter(emp => {
        const matchesSearch = (emp.userName || emp.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (emp.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = selectedDepartment === 'all' || emp.department === selectedDepartment;
        return matchesSearch && matchesDept;
    });

    const departments = Array.from(new Set(employees.map(e => e.department)));

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8 p-8 bg-slate-50/50 min-h-screen">
                {/* Header Section with Glassmorphism */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl shadow-slate-200/50">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                                <WalletIcon className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Payroll Pro</h1>
                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 transition-colors">Enterprise v2.4</Badge>
                        </div>
                        <p className="text-slate-500 mt-2 font-medium">Advanced human resource capital and payroll management system</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="rounded-xl border-slate-200 hover:bg-slate-50 transition-all font-semibold">
                            <DownloadIcon className="h-4 w-4 mr-2" />
                            Export Reports
                        </Button>
                        <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all font-semibold px-6">
                            <PlusIcon className="h-4 w-4 mr-2 text-white" />
                            Process Month
                        </Button>
                    </div>
                </div>

                {/* Dynamic Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    <StatCard
                        title="Total Workforce"
                        value={stats.totalEmployees.toString()}
                        subtext="Active Employees"
                        icon={<UsersIcon className="h-5 w-5 text-indigo-600" />}
                        trend="+2% vs last month"
                        color="indigo"
                    />
                    <StatCard
                        title="Monthly Payout"
                        value={`₹${(stats.monthlyPayout / 100000).toFixed(2)}L`}
                        subtext="Gross Salaries"
                        icon={<DollarSignIcon className="h-5 w-5 text-emerald-600" />}
                        trend="+5.4% growth"
                        color="emerald"
                    />
                    <StatCard
                        title="Attendance"
                        value={`${stats.attendanceRate}%`}
                        subtext="Average Today"
                        icon={<ClockIcon className="h-5 w-5 text-blue-600" />}
                        trend="Steady state"
                        color="blue"
                    />
                    <StatCard
                        title="Leaves"
                        value={stats.pendingApprovals.toString()}
                        subtext="Pending Approval"
                        icon={<CalendarIcon className="h-5 w-5 text-orange-600" />}
                        trend="Active requests"
                        color="orange"
                    />
                    <StatCard
                        title="Avg Salary"
                        value={`₹${(stats.averageSalary / 1000).toFixed(0)}k`}
                        subtext="Per Employee"
                        icon={<TrendingUpIcon className="h-5 w-5 text-purple-600" />}
                        trend="Market aligned"
                        color="purple"
                    />
                    <StatCard
                        title="Tax Liability"
                        value="₹1.2L"
                        subtext="Current Quarter"
                        icon={<CheckCircle2Icon className="h-5 w-5 text-rose-600" />}
                        trend="Tax compliant"
                        color="rose"
                    />
                </div>

                {/* Main Content Area */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-2 rounded-xl border shadow-sm">
                        <TabsList className="bg-transparent border-none">
                            <TabTrigger value="overview" label="Overview" icon={<LayoutDashboardIcon className="w-4 h-4" />} />
                            <TabTrigger value="employees" label="Employee Capital" icon={<BriefcaseIcon className="w-4 h-4" />} />
                            <TabTrigger value="payroll" label="Payroll Processing" icon={<DollarSignIcon className="w-4 h-4" />} />
                            <TabTrigger value="compliance" label="Compliance & Tax" icon={<CheckCircle2Icon className="w-4 h-4" />} />
                            <TabTrigger value="settings" label="Architect Settings" icon={<SettingsIcon className="w-4 h-4" />} />
                        </TabsList>

                        <div className="flex items-center gap-4 px-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 border-l pl-4">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                System Live
                            </div>
                        </div>
                    </div>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <Card className="lg:col-span-2 rounded-2xl border-slate-200 shadow-xl shadow-slate-100 overflow-hidden">
                                <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between border-b px-8 py-6">
                                    <div>
                                        <CardTitle className="text-xl font-bold">Payroll Distribution</CardTitle>
                                        <CardDescription>Breakdown by department and grade</CardDescription>
                                    </div>
                                    <Select defaultValue="month">
                                        <SelectTrigger className="w-32 rounded-lg">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="month">Monthly</SelectItem>
                                            <SelectItem value="quarter">Quarterly</SelectItem>
                                            <SelectItem value="year">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="h-[300px] flex items-center justify-center bg-slate-50/50 rounded-xl border border-dashed text-slate-400">
                                        <div className="text-center">
                                            <TrendingUpIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                            <p className="font-medium italic">Advanced Distribution Chart would render here</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border-slate-200 shadow-xl shadow-slate-100 overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b px-8 py-6">
                                    <CardTitle className="text-xl font-bold text-slate-800">Quick Actions</CardTitle>
                                    <CardDescription>Commonly used payroll operations</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 space-y-3">
                                    <QuickActionButton label="Generate Payslips" icon={<FileTextIcon className="w-5 h-5" />} color="indigo" />
                                    <QuickActionButton label="Update Salary Structures" icon={<SettingsIcon className="w-5 h-5" />} color="blue" />
                                    <QuickActionButton label="Process Incentives" icon={<TrendingUpIcon className="w-5 h-5" />} color="emerald" />
                                    <QuickActionButton label="View Leave Audit" icon={<CalendarIcon className="w-5 h-5" />} color="orange" />
                                    <QuickActionButton label="Tax Computation" icon={<AlertCircleIcon className="w-5 h-5" />} color="rose" />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="employees" className="space-y-6">
                        <Card className="rounded-2xl border-slate-200 shadow-xl shadow-slate-100 overflow-hidden">
                            <CardHeader className="bg-white border-b px-8 py-8">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div>
                                        <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">Human Capital Directory</CardTitle>
                                        <CardDescription className="text-slate-500 font-medium mt-1">Efficient employee management and data access</CardDescription>
                                    </div>
                                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                                        <div className="relative flex-1 md:w-64">
                                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                placeholder="ID or Name search..."
                                                className="pl-10 rounded-xl border-slate-200 focus:ring-indigo-500"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                            <SelectTrigger className="w-full md:w-48 rounded-xl border-slate-200">
                                                <FilterIcon className="w-4 h-4 mr-2 opacity-50" />
                                                <SelectValue placeholder="All Departments" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Departments</SelectItem>
                                                {departments.map(d => (
                                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {employeesLoading ? (
                                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent shadow-xl shadow-indigo-100"></div>
                                        <p className="text-indigo-600 font-bold animate-pulse">Syncing Employee Ledger...</p>
                                    </div>
                                ) : filteredEmployees.length === 0 ? (
                                    <div className="text-center py-24 text-slate-400">
                                        <UsersIcon className="h-16 w-16 mx-auto mb-4 opacity-10" />
                                        <p className="text-lg font-bold">No records found matching criteria</p>
                                        <p className="max-w-xs mx-auto mt-2 opacity-60">Adjust your search parameters or select a different department filter.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/80 text-xs font-bold text-slate-500 uppercase tracking-widest border-b">
                                                    <th className="px-8 py-5">Employee Portfolio</th>
                                                    <th className="px-6 py-5">Engagement Details</th>
                                                    <th className="px-6 py-5">Tenure Status</th>
                                                    <th className="px-6 py-5">State</th>
                                                    <th className="px-8 py-5 text-right">Operational Center</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredEmployees.map((employee) => (
                                                    <tr key={employee.id} className="hover:bg-slate-50/50 transition-colors group cursor-default">
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-700 font-extrabold text-lg border border-indigo-100 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                                                    {((employee as any).userName || (employee as any).employeeName || 'U')[0]}
                                                                </div>
                                                                <div>
                                                                    <p className="font-heavy text-slate-900 text-base">{(employee as any).userName || (employee as any).employeeName || 'Anonymous Asset'}</p>
                                                                    <p className="text-slate-500 text-xs font-bold mt-0.5 tracking-tight">IDENTITY: <span className="text-indigo-600 font-mono">{employee.employeeId}</span></p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-6 font-medium text-slate-700">
                                                            <div className="flex flex-col gap-1">
                                                                <p className="text-slate-900 group-hover:text-indigo-700 transition-colors font-bold">{employee.designation}</p>
                                                                <Badge variant="outline" className="w-fit text-[10px] py-0 border-slate-200 text-slate-500 uppercase font-black">{employee.department}</Badge>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-6">
                                                            <div className="space-y-1.5">
                                                                <div className="flex items-center gap-1.5">
                                                                    <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                                                                    <span className="text-sm text-slate-600 font-semibold">{new Date(employee.dateOfJoining).toLocaleDateString()}</span>
                                                                </div>
                                                                <p className="text-[11px] text-slate-400 font-bold ml-5">Joined {(new Date().getFullYear() - new Date(employee.dateOfJoining).getFullYear())} years ago</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-6">
                                                            <div className="flex flex-col gap-1.5">
                                                                <Badge className={`${employee.status === 'active' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-100'} px-2 py-1 rounded-lg text-[11px] font-black uppercase w-fit shadow-sm`}>
                                                                    {employee.status}
                                                                </Badge>
                                                                <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase letter-spacing-1">{employee.employmentType}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-indigo-50 hover:text-indigo-600"><FileTextIcon className="h-4 w-4" /></Button>
                                                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-indigo-50 hover:text-indigo-600"><SettingsIcon className="h-4 w-4" /></Button>
                                                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-indigo-50 hover:text-indigo-600"><UsersIcon className="h-4 w-4" /></Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}

function StatCard({ title, value, subtext, icon, trend, color }: any) {
    const colors: any = {
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        orange: "bg-orange-50 text-orange-600 border-orange-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100",
        rose: "bg-rose-50 text-rose-600 border-rose-100",
    };

    const trendColors: any = {
        indigo: "text-indigo-500",
        emerald: "text-emerald-500",
        blue: "text-blue-500",
        orange: "text-orange-500",
        purple: "text-purple-500",
        rose: "text-rose-500",
    };

    return (
        <Card className="rounded-2xl border-slate-200 hover:border-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-50/50 group cursor-default">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl border ${colors[color]} group-hover:scale-110 transition-transform duration-300`}>
                        {icon}
                    </div>
                    <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${colors[color]} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        Real-time
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{title}</p>
                    <p className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{value}</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <p className="text-[11px] font-heavy text-slate-400">{subtext}</p>
                    <p className={`text-[10px] font-black uppercase tracking-tighter ${trendColors[color]}`}>{trend}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function TabTrigger({ value, label, icon }: any) {
    return (
        <TabsTrigger
            value={value}
            className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 group"
        >
            <div className="p-1 rounded-md opacity-50 group-data-[state=active]:opacity-100 transition-opacity">
                {icon}
            </div>
            <span className="font-bold tracking-tight text-sm uppercase">{label}</span>
        </TabsTrigger>
    );
}

function QuickActionButton({ label, icon, color }: any) {
    const colors: any = {
        indigo: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
        blue: "bg-blue-50 text-blue-700 hover:bg-blue-100",
        emerald: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
        orange: "bg-orange-50 text-orange-700 hover:bg-orange-100",
        rose: "bg-rose-50 text-rose-700 hover:bg-rose-100",
    };

    return (
        <Button variant="ghost" className={`w-full justify-start rounded-xl p-4 h-auto transition-all hover:translate-x-1 ${colors[color]}`}>
            <div className="p-2 bg-white rounded-lg shadow-sm mr-3">
                {icon}
            </div>
            <span className="font-heavy text-sm uppercase tracking-tight">{label}</span>
            <TrendingUpIcon className="ml-auto w-4 h-4 opacity-30" />
        </Button>
    );
}
