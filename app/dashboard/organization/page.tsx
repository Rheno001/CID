'use client';

import { useState, useEffect } from 'react';
import { Building2, MapPin, Briefcase, Loader2, Map, Plus, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { companyApi, departmentApi, branchApi } from '@/lib/api';
import { Branch, Company, Staff } from '@/app/types';

export default function OrganizationPage() {
    const [activeTab, setActiveTab] = useState<'company' | 'department' | 'branch'>('company');
    const [loading, setLoading] = useState(false);

    // Data state
    const [branches, setBranches] = useState<Branch[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [companyEmployees, setCompanyEmployees] = useState<Staff[]>([]);

    // Forms state
    const [companyData, setCompanyData] = useState({
        name: '',
        address: '',
        logo: null as File | null
    });

    // Department Form State
    const [departmentData, setDepartmentData] = useState({
        name: '',
        company_id: '',
        head_id: ''
    });

    // Branch Form State
    const [branchData, setBranchData] = useState({
        name: '',
        address: '',
        location_city: '',
        gps_lat: '',
        gps_long: '',
        radius_meters: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [branchesData, companiesData] = await Promise.all([
                branchApi.getAll(),
                companyApi.getAll()
            ]);

            // Normalize companies
            const rawCompanies = Array.isArray(companiesData) ? companiesData : (companiesData as any).data || (companiesData as any).companies || [];
            const normalizedCompanies = rawCompanies.map((c: any, idx: number) => ({
                ...c,
                _id: c._id || c.id || `company-${idx}`
            }));

            // Normalize branches
            const rawBranches = Array.isArray(branchesData) ? branchesData : (branchesData as any).data || (branchesData as any).branches || [];
            const normalizedBranches = rawBranches.map((b: any, idx: number) => ({
                ...b,
                _id: b._id || b.id || `branch-${idx}`
            }));

            setBranches(normalizedBranches);
            setCompanies(normalizedCompanies);
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    // Fetch employees when company is selected
    useEffect(() => {
        const fetchCompanyEmployees = async () => {
            if (departmentData.company_id) {
                try {
                    const employees = await companyApi.getEmployees(departmentData.company_id);
                    // Normalize employees
                    const rawEmployees = Array.isArray(employees) ? employees : (employees as any).data || (employees as any).employees || [];
                    const normalizedEmployees = rawEmployees.map((e: any, idx: number) => ({
                        ...e,
                        _id: e._id || e.id || `emp-${idx}`
                    }));
                    setCompanyEmployees(normalizedEmployees);
                } catch (error) {
                    console.error('Failed to fetch company employees:', error);
                    setCompanyEmployees([]);
                }
            } else {
                setCompanyEmployees([]);
            }
        };

        fetchCompanyEmployees();
    }, [departmentData.company_id]);

    const handleCreateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', companyData.name);
            formData.append('address', companyData.address);
            if (companyData.logo instanceof File) {
                formData.append('logo', companyData.logo);
            }

            await companyApi.create(formData);
            alert('Company created successfully');
            setCompanyData({ name: '', address: '', logo: null });
            fetchData(); // Refresh data
        } catch (error) {
            console.error(error);
            alert('Failed to create company');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCompany = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
            return;
        }

        setLoading(true);
        try {
            await companyApi.delete(id);
            alert('Company deleted successfully');
            fetchData(); // Refresh list
        } catch (error) {
            console.error('Failed to delete company:', error);
            alert('Failed to delete company. It may have associated departments or employees.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDepartment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!departmentData.company_id) {
            alert('Please select a company');
            return;
        }

        setLoading(true);
        try {
            await departmentApi.create({
                name: departmentData.name,
                company_id: departmentData.company_id,
                head_id: departmentData.head_id || null
            });

            alert('Department created successfully');
            setDepartmentData({ name: '', company_id: '', head_id: '' });
            fetchData(); // Refresh data
        } catch (error) {
            console.error(error);
            alert('Failed to create department');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBranch = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        try {
            await branchApi.create({
                ...branchData,
                gps_lat: parseFloat(branchData.gps_lat),
                gps_long: parseFloat(branchData.gps_long),
            });
            alert('Branch created successfully');
            setBranchData({ name: '', address: '', location_city: '', gps_lat: '', gps_long: '', radius_meters: '' });
            fetchData(); // Refresh data
        } catch (error) {
            console.error(error);
            alert('Failed to create branch');
        } finally {
            setLoading(false);
        }
    };

    const getLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        alert('Fetching your location...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setBranchData(prev => ({
                    ...prev,
                    gps_lat: position.coords.latitude.toString(),
                    gps_long: position.coords.longitude.toString()
                }));
                alert('Location fetched successfully');
            },
            (error) => {
                console.error(error);
                alert('Unable to retrieve your location');
            }
        );
    };

    const tabs = [
        { id: 'company', label: 'Company', icon: Building2 },
        { id: 'department', label: 'Department', icon: Briefcase },
        { id: 'branch', label: 'Branch', icon: MapPin },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Organization Management</h1>
                <p className="mt-2 text-muted-foreground">
                    Create and manage companies, departments, and branches.
                </p>
            </div>

            <div className="flex space-x-1 rounded-xl bg-gray-100 p-1 dark:bg-zinc-800">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                                isActive
                                    ? "bg-white text-foreground shadow-sm dark:bg-zinc-900"
                                    : "text-muted-foreground hover:bg-white/50 hover:text-foreground dark:hover:bg-zinc-700/50"
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                {activeTab === 'company' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Creation Form */}
                        <form onSubmit={handleCreateCompany} className="space-y-4">
                            <h2 className="text-xl font-semibold">Create New Company</h2>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Company Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Acme Corp"
                                    value={companyData.name}
                                    onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                                    required
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700 sm:text-sm p-2 border"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Company Logo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setCompanyData({ ...companyData, logo: e.target.files?.[0] || null })}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 dark:text-gray-400"
                                />
                                <p className="text-xs text-muted-foreground">Upload a logo image for the company</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Address</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 123 Business St, City"
                                    value={companyData.address}
                                    onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                                    required
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700 sm:text-sm p-2 border"
                                />
                            </div>

                            <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3">
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                    <strong>Note:</strong> The company abbreviation will be automatically generated by the system.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Create Company
                            </button>
                        </form>

                        {/* Existing Companies List */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Existing Companies</h3>
                            <div className="grid gap-4">
                                {companies.map((company, index) => (
                                    <div key={company._id || `list-comp-${index}`} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-transparent hover:border-gray-200 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-primary font-black shadow-sm">
                                                {company.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground leading-none">{company.name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">{company.abbreviation || 'ID: ' + company._id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteCompany(company._id)}
                                            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                                            title="Delete Company"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                                {companies.length === 0 && (
                                    <p className="text-sm text-gray-400 italic py-4 text-center">No companies found.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'department' && (
                    <form onSubmit={handleCreateDepartment} className="space-y-4 max-w-md">
                        <h2 className="text-xl font-semibold">Create New Department</h2>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Department Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Sales Department"
                                value={departmentData.name}
                                onChange={(e) => setDepartmentData({ ...departmentData, name: e.target.value })}
                                required
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700 sm:text-sm p-2 border"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Company</label>
                            <select
                                value={departmentData.company_id}
                                onChange={(e) => setDepartmentData({ ...departmentData, company_id: e.target.value, head_id: '' })}
                                required
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700 sm:text-sm p-2 border"
                            >
                                <option value="">Select a company...</option>
                                {companies.map((company, index) => (
                                    <option key={company._id || `comp-opt-${index}`} value={company._id}>
                                        {company.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Department Head</label>
                            <select
                                value={departmentData.head_id}
                                onChange={(e) => setDepartmentData({ ...departmentData, head_id: e.target.value })}
                                disabled={!departmentData.company_id || companyEmployees.length === 0}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700 sm:text-sm p-2 border disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">
                                    {!departmentData.company_id
                                        ? 'Select a company first...'
                                        : companyEmployees.length === 0
                                            ? 'No employees in this company'
                                            : 'Select department head...'}
                                </option>
                                {companyEmployees.map((person: Staff, index) => (
                                    <option key={person._id || `head-opt-${index}`} value={person._id}>
                                        {person.name} ({person.role || 'Staff'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create Department
                        </button>
                    </form>
                )}

                {activeTab === 'branch' && (
                    <form onSubmit={handleCreateBranch} className="space-y-4 max-w-md">
                        <h2 className="text-xl font-semibold">Create New Branch</h2>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Branch Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Downtown Office"
                                value={branchData.name}
                                onChange={(e) => setBranchData({ ...branchData, name: e.target.value })}
                                required
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700 sm:text-sm p-2 border"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Address</label>
                            <input
                                type="text"
                                placeholder="123 Main St, City"
                                value={branchData.address}
                                onChange={(e) => setBranchData({ ...branchData, address: e.target.value })}
                                required
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700 sm:text-sm p-2 border"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">City</label>
                            <input
                                type="text"
                                placeholder="e.g. Lugbe"
                                value={branchData.location_city}
                                onChange={(e) => setBranchData({ ...branchData, location_city: e.target.value })}
                                required
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700 sm:text-sm p-2 border"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Latitude</label>
                                <input
                                    type="text"
                                    placeholder="0.000000"
                                    value={branchData.gps_lat}
                                    onChange={(e) => setBranchData({ ...branchData, gps_lat: e.target.value })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700 sm:text-sm p-2 border"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Longitude</label>
                                <input
                                    type="text"
                                    placeholder="0.000000"
                                    value={branchData.gps_long}
                                    onChange={(e) => setBranchData({ ...branchData, gps_long: e.target.value })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700 sm:text-sm p-2 border"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Radius (meters)</label>
                            <input
                                type="text"
                                placeholder="e.g. 50"
                                value={branchData.radius_meters}
                                onChange={(e) => setBranchData({ ...branchData, radius_meters: e.target.value })}
                                required
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700 sm:text-sm p-2 border"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={getLocation}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700"
                        >
                            <Map className="h-4 w-4" />
                            Use My Location
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create Branch
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
