'use client';

import { useState, useEffect } from 'react';
import { Building2, MapPin, Briefcase, Loader2, Map, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { companyApi, departmentApi, branchApi } from '@/lib/api';
import { Branch, Company } from '@/app/types';

export default function OrganizationPage() {
    const [activeTab, setActiveTab] = useState<'company' | 'department' | 'branch'>('company');
    const [loading, setLoading] = useState(false);

    // Data state
    const [branches, setBranches] = useState<Branch[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);

    // Forms state
    const [companyName, setCompanyName] = useState('');

    // Department Form State
    const [selectedCompanyIdForDepartment, setSelectedCompanyIdForDepartment] = useState('');
    const [departmentNames, setDepartmentNames] = useState<string[]>(['']);

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
            setBranches(branchesData);
            setCompanies(companiesData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    const handleCreateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await companyApi.create({ name: companyName });
            alert('Company created successfully');
            setCompanyName('');
            fetchData(); // Refresh data
        } catch (error) {
            console.error(error);
            alert('Failed to create company');
        } finally {
            setLoading(false);
        }
    };

    const handleAddDepartmentInput = () => {
        setDepartmentNames([...departmentNames, '']);
    };

    const handleDepartmentNameChange = (index: number, value: string) => {
        const newNames = [...departmentNames];
        newNames[index] = value;
        setDepartmentNames(newNames);
    };

    const handleRemoveDepartmentInput = (index: number) => {
        if (departmentNames.length > 1) {
            const newNames = departmentNames.filter((_, i) => i !== index);
            setDepartmentNames(newNames);
        }
    };

    const handleCreateDepartment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCompanyIdForDepartment) {
            alert('Please select a company');
            return;
        }

        const validNames = departmentNames.filter(name => name.trim() !== '');
        if (validNames.length === 0) {
            alert('Please enter at least one department name');
            return;
        }

        setLoading(true);
        try {
            // Create departments sequentially or in parallel
            await Promise.all(validNames.map(name =>
                departmentApi.create({
                    name: name,
                    company_id: selectedCompanyIdForDepartment
                })
            ));

            alert('Departments created successfully');
            setDepartmentNames(['']);
            // Keep selection or reset? Resetting specifically might be annoying if bulk creating for same branch,
            // but requirements usually imply fresh start. Let's keep selection for convenience or reset?
            // Let's reset for now to be safe.
            // setSelectedBranchId('');
        } catch (error) {
            console.error(error);
            alert('Failed to create one or more departments');
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
                    <form onSubmit={handleCreateCompany} className="space-y-4 max-w-md">
                        <h2 className="text-xl font-semibold">Create New Company</h2>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Company Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Acme Corp"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                required
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700 sm:text-sm p-2 border"
                            />
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
                )}

                {activeTab === 'department' && (
                    <form onSubmit={handleCreateDepartment} className="space-y-6 max-w-md">
                        <h2 className="text-xl font-semibold">Create New Departments</h2>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Company</label>
                            <select
                                value={selectedCompanyIdForDepartment}
                                onChange={(e) => {
                                    setSelectedCompanyIdForDepartment(e.target.value);
                                }}
                                required
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700 sm:text-sm p-2 border"
                            >
                                <option value="">Select a company...</option>
                                {companies.map((company) => (
                                    <option key={company._id} value={company._id}>
                                        {company.name}
                                    </option>
                                ))}
                            </select>
                        </div>


                        <div className="space-y-3">
                            <label className="text-sm font-medium">Department Names</label>
                            {departmentNames.map((name, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder={`Department Name ${index + 1}`}
                                        value={name}
                                        onChange={(e) => handleDepartmentNameChange(index, e.target.value)}
                                        required={index === 0} // Only first one required essentially
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700 sm:text-sm p-2 border"
                                    />
                                    {departmentNames.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveDepartmentInput(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddDepartmentInput}
                                className="inline-flex items-center text-sm text-primary hover:text-primary/80"
                            >
                                <Plus className="mr-1 h-4 w-4" />
                                Add another department
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create Departments
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
