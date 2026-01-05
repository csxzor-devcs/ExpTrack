import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Calendar, TrendingUp, PieChart as PieChartIcon, BarChart3, Search, FileText, ArrowUpRight, Download, Upload, Moon, Sun, Utensils, Car, Home, Zap, Film, HeartPulse, ShoppingBag, Layers, ChevronRight, Edit2, LogOut, Loader2, UserX, User } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabaseClient';

const ExpenseTracker = () => {
    // --- Helpers ---
    const formatToLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const parseLocalDate = (dateStr) => {
        if (!dateStr) return new Date();
        const cleanStr = dateStr.substring(0, 10);
        const [year, month, day] = cleanStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    // --- State ---
    // --- State ---
    const { user, signOut } = useAuth();
    const [loadingData, setLoadingData] = useState(true);
    const [expenses, setExpenses] = useState([]);

    // Dark Mode State
    const [darkMode, setDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark';
    });

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [viewingHistory, setViewingHistory] = useState(null); // 'weekly' or 'monthly'
    const [editingExpense, setEditingExpense] = useState(null);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const fileInputRef = useRef(null);
    const menuRef = useRef(null); // Ref for the profile menu container

    const [newExpense, setNewExpense] = useState({
        date: formatToLocalDate(new Date()),
        category: 'Food',
        amount: '',
        description: ''
    });

    // --- Effects ---
    useEffect(() => {
        if (!user) return;

        const fetchExpenses = async () => {
            setLoadingData(true);
            try {
                if (user.isGuest) {
                    // Guest Mode: Load from LocalStorage
                    const localData = JSON.parse(localStorage.getItem('guest_expenses') || '[]');
                    setExpenses(localData);
                } else {
                    // Authenticated Mode: Load from Supabase
                    const { data, error } = await supabase
                        .from('expenses')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('date', { ascending: false });

                    if (error) throw error;
                    setExpenses(data || []);
                }
            } catch (error) {
                console.error('Error fetching expenses:', error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchExpenses();
    }, [user]);

    useEffect(() => {
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');
        // We handle body classes here to ensure the gradient looks right on the full page
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // --- Helpers & Config ---
    const categories = ['Food', 'Transport', 'Housing', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'];
    // Brighter, more vibrant colors for the glass theme
    // Brighter, more vibrant colors for the glass theme
    const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#F43F5E', '#D946EF', '#6366F1', '#14B8A6'];

    const getCategoryDetails = (cat) => {
        const map = {
            'Food': { color: '#10B981', icon: <Utensils size={14} /> },        // Green
            'Transport': { color: '#8B5CF6', icon: <Car size={14} /> },       // Purple
            'Housing': { color: '#06B6D4', icon: <Home size={14} /> },        // Cyan
            'Utilities': { color: '#3B82F6', icon: <Zap size={14} /> },        // Blue
            'Entertainment': { color: '#F59E0B', icon: <Film size={14} /> },   // Orange
            'Health': { color: '#F43F5E', icon: <HeartPulse size={14} /> },   // Rose
            'Shopping': { color: '#EC4899', icon: <ShoppingBag size={14} /> }, // Pink
            'Other': { color: '#94A3B8', icon: <Layers size={14} /> }         // Slate
        };
        return map[cat] || { color: '#94A3B8', icon: <Layers size={14} /> };
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    const getWeekNumber = (d) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };

    // --- Calculations ---
    const stats = useMemo(() => {
        const now = new Date();
        const todayStr = formatToLocalDate(now);
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const currentWeek = getWeekNumber(now);

        let daily = 0;
        let weekly = 0;
        let monthly = 0;
        let total = 0;

        const categoryMap = {};
        const last7DaysMap = {};
        const monthlyMap = {};
        const weeklyMap = {};
        const anchorDate = new Date();
        anchorDate.setHours(0, 0, 0, 0);
        const chartKeys = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(anchorDate);
            d.setDate(anchorDate.getDate() - i);
            const dateKey = formatToLocalDate(d);
            last7DaysMap[dateKey] = 0;
            chartKeys.push(dateKey);
        }

        expenses.forEach(exp => {
            const expDate = parseLocalDate(exp.date);
            const val = parseFloat(exp.amount) || 0;
            total += val;

            const monthKey = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`;
            const weekNum = getWeekNumber(expDate);
            const weekKey = `${expDate.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

            if (exp.date === todayStr) daily += val;
            if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) monthly += val;
            if (weekNum === currentWeek && expDate.getFullYear() === currentYear) weekly += val;

            if (categoryMap[exp.category]) categoryMap[exp.category] += val;
            else categoryMap[exp.category] = val;

            const normalizedKey = formatToLocalDate(expDate);
            if (last7DaysMap.hasOwnProperty(normalizedKey)) last7DaysMap[normalizedKey] += val;

            // Monthly History
            if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { total: 0, count: 0, items: [] };
            monthlyMap[monthKey].total += val;
            monthlyMap[monthKey].count += 1;
            monthlyMap[monthKey].items.push(exp);

            // Weekly History
            if (!weeklyMap[weekKey]) weeklyMap[weekKey] = { total: 0, count: 0, items: [] };
            weeklyMap[weekKey].total += val;
            weeklyMap[weekKey].count += 1;
            weeklyMap[weekKey].items.push(exp);
        });

        const categoryData = Object.keys(categoryMap).map((cat) => ({
            name: cat,
            value: categoryMap[cat],
            color: getCategoryDetails(cat).color
        })).sort((a, b) => b.value - a.value);

        const dailyActivityData = chartKeys.map(dateStr => {
            const d = parseLocalDate(dateStr);
            return {
                day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                fullDate: dateStr,
                value: last7DaysMap[dateStr]
            };
        });

        const monthlyHistory = Object.keys(monthlyMap).map(key => ({
            period: key,
            label: new Date(key + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            ...monthlyMap[key]
        })).sort((a, b) => b.period.localeCompare(a.period));

        const weeklyHistory = Object.keys(weeklyMap).map(key => ({
            period: key,
            label: `Week ${key.split('-W')[1]}, ${key.split('-')[0]}`,
            ...weeklyMap[key]
        })).sort((a, b) => b.period.localeCompare(a.period));

        return { daily, weekly, monthly, total, categoryData, dailyActivityData, monthlyHistory, weeklyHistory };
    }, [expenses]);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(exp => {
            const matchesText = exp.description.toLowerCase().includes(filterText.toLowerCase()) ||
                exp.category.toLowerCase().includes(filterText.toLowerCase());
            const matchesCategory = !selectedCategory || exp.category === selectedCategory;
            const matchesDate = !selectedDate || exp.date === selectedDate;
            return matchesText && matchesCategory && matchesDate;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [expenses, filterText, selectedCategory, selectedDate]);

    // --- Handlers ---
    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!newExpense.amount || !newExpense.date) return;
        if (!user) return;

        const expenseData = {
            user_id: user.id,
            date: newExpense.date,
            category: newExpense.category,
            amount: parseFloat(newExpense.amount),
            description: newExpense.description
        };

        // --- GUEST MODE LOGIC ---
        if (user.isGuest) {
            try {
                const localData = JSON.parse(localStorage.getItem('guest_expenses') || '[]');
                let updatedData;

                if (editingExpense) {
                    updatedData = localData.map(exp =>
                        exp.id === editingExpense.id
                            ? { ...exp, ...expenseData, id: exp.id } // Keep original ID
                            : exp
                    );
                    setExpenses(updatedData);
                    localStorage.setItem('guest_expenses', JSON.stringify(updatedData));
                    setEditingExpense(null);
                } else {
                    const newId = Date.now(); // Simple ID generation
                    const newRecord = { ...expenseData, id: newId };
                    updatedData = [newRecord, ...localData];
                    setExpenses(updatedData);
                    localStorage.setItem('guest_expenses', JSON.stringify(updatedData));
                }
            } catch (error) {
                console.error("Error saving guest expense:", error);
                alert("Failed to save to local storage.");
            }
        }
        // --- AUTHENTICATED MODE LOGIC ---
        else {
            try {
                if (editingExpense) {
                    const { error } = await supabase
                        .from('expenses')
                        .update(expenseData)
                        .eq('id', editingExpense.id)
                        .eq('user_id', user.id);

                    if (error) throw error;

                    setExpenses(expenses.map(exp =>
                        exp.id === editingExpense.id
                            ? { ...exp, ...expenseData }
                            : exp
                    ));
                    setEditingExpense(null);
                } else {
                    const { data, error } = await supabase
                        .from('expenses')
                        .insert([expenseData])
                        .select();

                    if (error) throw error;
                    if (data) {
                        setExpenses([data[0], ...expenses]);
                    }
                }
            } catch (error) {
                console.error("Error saving expense:", error);
                alert("Failed to save expense. Please try again.");
            }
        }

        setNewExpense({
            date: formatToLocalDate(new Date()),
            category: 'Food',
            amount: '',
            description: ''
        });
        setIsFormOpen(false);
    };

    const handleEditClick = (expense) => {
        setEditingExpense(expense);
        setNewExpense({
            date: expense.date,
            category: expense.category,
            amount: expense.amount.toString(),
            description: expense.description
        });
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingExpense(null);
        setNewExpense({
            date: formatToLocalDate(new Date()),
            category: 'Food',
            amount: '',
            description: ''
        });
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this expense?")) return;

        if (user.isGuest) {
            const updatedExpenses = expenses.filter(e => e.id !== id);
            setExpenses(updatedExpenses);
            localStorage.setItem('guest_expenses', JSON.stringify(updatedExpenses));
            return;
        }

        try {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;
            setExpenses(expenses.filter(e => e.id !== id));
        } catch (error) {
            console.error("Error deleting expense:", error);
            alert("Failed to delete expense.");
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm("Are you sure you want to delete your account? This action cannot be undone and will delete all your data.")) return;

        if (user.isGuest) {
            localStorage.removeItem('guest_expenses');
            setExpenses([]);
            alert("Local guest data cleared.");
            signOut(); // Resets user state
            return;
        }

        const doubleCheck = confirm("Please confirm again. All your expenses will be lost forever. Are you absolutely sure?");
        if (!doubleCheck) return;

        try {
            setLoadingData(true);
            // 1. Delete all expenses for the user
            const { error: deleteDataError } = await supabase
                .from('expenses')
                .delete()
                .eq('user_id', user.id);

            if (deleteDataError) throw deleteDataError;

            // 2. Sign out the user
            await signOut();
            alert("Account data deleted and you have been logged out.");

        } catch (error) {
            console.error("Error deleting account data:", error);
            alert("Error deleting account data.");
            setLoadingData(false);
        }
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(expenses, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `expense_tracker_backup_${formatToLocalDate(new Date())}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (!Array.isArray(importedData)) {
                    alert("Invalid file format. Expected a JSON array.");
                    return;
                }

                if (!user) {
                    alert("You must be logged in to import data.");
                    return;
                }

                if (!confirm(`Importing ${importedData.length} records. This will be added to your account. Continue?`)) {
                    event.target.value = null; // Reset input
                    return;
                }

                setLoadingData(true);

                // GUEST IMPORT
                if (user.isGuest) {
                    const localData = JSON.parse(localStorage.getItem('guest_expenses') || '[]');

                    const newRecords = importedData.map(item => ({
                        id: Date.now() + Math.random(), // Simple ID gen
                        user_id: 'guest',
                        date: item.date || formatToLocalDate(new Date()),
                        category: item.category || 'Other',
                        amount: parseFloat(item.amount) || 0,
                        description: item.description || 'Imported Expense'
                    }));

                    const updatedData = [...newRecords, ...localData];
                    localStorage.setItem('guest_expenses', JSON.stringify(updatedData));
                    setExpenses(updatedData);
                    alert(`Successfully imported ${newRecords.length} expenses locally!`);
                }
                // AUTH IMPORT
                else {
                    const recordsToInsert = importedData.map(item => ({
                        user_id: user.id, // FORCE current user ownership
                        date: item.date || formatToLocalDate(new Date()),
                        category: item.category || 'Other',
                        amount: parseFloat(item.amount) || 0,
                        description: item.description || 'Imported Expense'
                    }));

                    const { data, error } = await supabase
                        .from('expenses')
                        .insert(recordsToInsert)
                        .select();

                    if (error) throw error;

                    if (data) {
                        setExpenses(prev => [...data, ...prev]);
                        alert(`Successfully imported ${data.length} expenses!`);
                    }
                }

            } catch (error) {
                console.error("Error importing file:", error);
                alert("Failed to import data. Please check the file format.");
            } finally {
                setLoadingData(false);
                event.target.value = null; // Reset input allows same file selection again
            }
        };
        reader.readAsText(file);
    };

    // --- Glassmorphism Theme Classes ---
    const glassTheme = {
        pageBg: darkMode ? 'bg-[#010208]' : 'bg-[#f0f2f5]',

        card: `backdrop-blur-3xl border transition-all duration-300 ${darkMode
            ? 'bg-white/[0.03] border-white/[0.08] text-slate-100 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)]'
            : 'bg-white/70 border-white/60 text-slate-900 shadow-xl shadow-slate-200/50'
            }`,

        input: `w-full px-4 py-3 rounded-2xl border outline-none focus:ring-2 transition-all duration-300 ${darkMode
            ? 'bg-slate-800/40 border-slate-700 focus:ring-blue-500/50 text-white placeholder-slate-500'
            : 'bg-white/50 border-slate-200 focus:ring-blue-500/30 text-slate-900 placeholder-slate-400 focus:bg-white/80'
            }`,

        buttonSec: `p-3 rounded-2xl border backdrop-blur-md font-semibold transition-all duration-300 active:scale-95 ${darkMode
            ? 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-700/60 hover:text-white'
            : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white hover:text-blue-600 hover:border-blue-200'
            }`,

        buttonPri: `px-6 py-3 rounded-2xl font-bold text-white shadow-lg transition-all duration-300 active:scale-95 hover:shadow-xl hover:scale-[1.02] ${darkMode
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-900/20'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-200/50'
            }`,

        textMuted: darkMode ? 'text-slate-400' : 'text-slate-500',
        divider: darkMode ? 'divide-slate-800/50' : 'divide-slate-200/50',
        listHover: darkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50/50',
    };

    return (
        // Outer container with Animated Gradient Mesh
        <div className={`min-h-screen font-sans p-4 md:p-8 transition-colors duration-500 ease-in-out relative overflow-hidden ${glassTheme.pageBg}`}>
            {/* Dynamic Style for Animation */}
            <style>{`
        @keyframes gradient-xy {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-mesh {
          background-size: 400% 400%;
          animation: gradient-xy 15s ease infinite;
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .pop-in {
          animation: popIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.3);
          border-radius: 20px;
        }
      `}</style>

            {/* The Animated Gradient Background Layer */}
            {/* The Animated Gradient Background Layer */}
            <div
                className={`absolute inset-0 animate-gradient-mesh pointer-events-none fixed ${darkMode
                    ? 'bg-gradient-to-br from-[#010208] via-[#0c0e1a] via-[#141829] to-[#010208] opacity-60'
                    : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-pink-50 opacity-80'
                    }`}
            />
            {/* Ambient "Orbs" for depth in both modes */}
            <div className={`absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-screen animate-pulse duration-[10s] ${darkMode ? 'bg-indigo-900/20' : 'bg-purple-200/30'}`} />
            <div className={`absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none mix-blend-screen animate-pulse duration-[8s] ${darkMode ? 'bg-blue-900/20' : 'bg-blue-200/30'}`} />

            {/* Main Content (Relative z-10 so it sits on top of background) */}
            <div className="relative z-10 max-w-6xl mx-auto space-y-8">

                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />

                {/* Header */}
                <header className="relative z-50 flex flex-col md:flex-row md:items-center justify-between gap-6 pop-in" style={{ animationDelay: '0ms' }}>
                    <div>
                        <h1 className={`text-4xl font-extrabold tracking-tight flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            <div className={`p-3 rounded-2xl text-white shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 transition-transform hover:scale-110 duration-300`}>
                                <TrendingUp size={28} strokeWidth={2.5} />
                            </div>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                                Exp<span className={darkMode ? 'text-white' : 'text-slate-800'}>Track</span>
                            </span>
                        </h1>
                        <p className={`${glassTheme.textMuted} mt-2 font-medium text-lg ml-1`}>Your financial clarity, reimagined.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
                        {/* Theme Toggle */}
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={glassTheme.buttonSec}
                            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <button onClick={handleExport} className={`${glassTheme.buttonSec} flex items-center gap-2`} title="Export Data">
                            <Download size={20} />
                            <span className="hidden sm:inline">Export</span>
                        </button>

                        <button onClick={handleImportClick} className={`${glassTheme.buttonSec} flex items-center gap-2`} title="Import Data">
                            <Upload size={20} />
                            <span className="hidden sm:inline">Import</span>
                        </button>

                        <button
                            onClick={() => setIsFormOpen(true)}
                            className={`${glassTheme.buttonPri} flex-1 sm:flex-none flex items-center gap-2 justify-center ml-0 sm:ml-2 mr-0 sm:mr-2 order-last sm:order-none min-w-[120px]`}
                        >
                            <Plus size={22} strokeWidth={3} />
                            <span className="whitespace-nowrap">Add New</span>
                        </button>

                        <div className={`hidden sm:block h-8 w-[1px] mx-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

                        {/* Profile Menu Dropdown */}
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className={`${glassTheme.buttonSec} ${isProfileMenuOpen ? (darkMode ? 'bg-slate-700/60 text-white' : 'bg-white text-blue-600 border-blue-200') : ''}`}
                                title="Profile"
                            >
                                <User size={20} />
                            </button>

                            {isProfileMenuOpen && (
                                <div className={`absolute right-0 mt-3 w-56 rounded-2xl shadow-2xl border backdrop-blur-xl z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right ${darkMode ? 'bg-[#0c0e1a]/95 border-slate-700/60 shadow-black/50' : 'bg-white/95 border-slate-200/60 shadow-xl'}`}>
                                    <div className="p-2 border-b border-dashed border-slate-200 dark:border-slate-700 mb-1">
                                        <p className={`text-xs font-bold px-2 py-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Signed in as <br />
                                            <span className={darkMode ? 'text-slate-200' : 'text-slate-800'}>{user?.email}</span>
                                        </p>
                                    </div>
                                    <div className="p-1 space-y-1">
                                        <button
                                            onClick={() => {
                                                setIsProfileMenuOpen(false);
                                                handleDeleteAccount();
                                            }}
                                            className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all ${darkMode ? 'text-rose-400 hover:bg-rose-500/10' : 'text-rose-500 hover:bg-rose-50'}`}
                                        >
                                            <div className="p-1.5 rounded-lg bg-rose-500/10">
                                                <UserX size={14} />
                                            </div>
                                            Delete Account
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsProfileMenuOpen(false);
                                                signOut();
                                            }}
                                            className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all ${darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
                                        >
                                            <div className="p-1.5 rounded-lg bg-slate-500/10 text-slate-500">
                                                <LogOut size={14} />
                                            </div>
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Top Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Daily Total"
                        amount={stats.daily}
                        icon={<Calendar size={22} className="text-blue-500" />}
                        trend="Today"
                        glassTheme={glassTheme}
                        delay="100ms"
                        darkMode={darkMode}
                        gradient="from-blue-500/10 to-cyan-500/10"
                    />
                    <StatCard
                        title="Weekly Total"
                        amount={stats.weekly}
                        icon={<ArrowUpRight size={22} className="text-purple-500" />}
                        trend="This Week"
                        glassTheme={glassTheme}
                        delay="200ms"
                        darkMode={darkMode}
                        gradient="from-purple-500/10 to-pink-500/10"
                        onClick={() => setViewingHistory('weekly')}
                        interactive
                    />
                    <StatCard
                        title="Monthly Total"
                        amount={stats.monthly}
                        icon={<PieChartIcon size={22} className="text-emerald-500" />}
                        trend="This Month"
                        glassTheme={glassTheme}
                        delay="300ms"
                        darkMode={darkMode}
                        gradient="from-emerald-500/10 to-teal-500/10"
                        onClick={() => setViewingHistory('monthly')}
                        interactive
                    />
                </div>

                {/* Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Bar Chart Container */}
                    <div className={`${glassTheme.card} rounded-3xl p-6 sm:p-8 pop-in flex flex-col`} style={{ animationDelay: '400ms' }}>
                        <div className="flex items-center gap-3 mb-8">
                            <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                <BarChart3 size={22} />
                            </div>
                            <h3 className={`font-bold text-xl ${darkMode ? 'text-white' : 'text-slate-800'}`}>Activity</h3>
                        </div>
                        <div className="flex-1 relative h-64 mt-4">
                            {/* Subtle Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={`w-full border-t border-dashed ${darkMode ? 'border-slate-700' : 'border-slate-300'}`} />
                                ))}
                            </div>

                            <div className={`absolute inset-0 flex items-end justify-between gap-1 md:gap-3`}>
                                {stats.dailyActivityData.length > 0 ? (
                                    <SimpleBarChart
                                        data={stats.dailyActivityData}
                                        darkMode={darkMode}
                                        selectedDate={selectedDate}
                                        onBarClick={(date) => setSelectedDate(selectedDate === date ? null : date)}
                                    />
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center text-sm ${glassTheme.textMuted}`}>No recent activity</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pie Chart Container */}
                    <div className={`${glassTheme.card} rounded-3xl p-6 sm:p-8 pop-in flex flex-col`} style={{ animationDelay: '500ms' }}>
                        <div className="flex items-center gap-3 mb-8">
                            <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-50 text-pink-600'}`}>
                                <PieChartIcon size={22} />
                            </div>
                            <h3 className={`font-bold text-xl ${darkMode ? 'text-white' : 'text-slate-800'}`}>Breakdown</h3>
                        </div>
                        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-10 min-h-[300px] lg:h-56">
                            {stats.categoryData.length > 0 ? (
                                <>
                                    <div className="w-48 h-48 shrink-0 relative hover:scale-105 transition-transform duration-500 ease-out bg-transparent select-none">
                                        <SimplePieChart
                                            data={stats.categoryData}
                                            darkMode={darkMode}
                                            onSliceClick={(name) => setSelectedCategory(selectedCategory === name ? null : name)}
                                            selectedCategory={selectedCategory}
                                        />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-slate-200' : 'text-black'} mb-0.5`}>Total</span>
                                            <span className={`text-xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-950'}`}>{formatCurrency(stats.total)}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 w-full overflow-y-auto max-h-48 pr-2 custom-scrollbar">
                                        <div className="space-y-1">
                                            {stats.categoryData.map((cat, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                                                    className={`w-full flex items-center justify-between text-sm group p-2 rounded-xl transition-all duration-200 ${selectedCategory === cat.name
                                                        ? (darkMode ? 'bg-white/10' : 'bg-black/5')
                                                        : 'hover:translate-x-1'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={`w-3.5 h-3.5 rounded-full shadow-sm ring-2 ring-white/10 transition-transform ${selectedCategory === cat.name ? 'scale-125' : ''}`}
                                                            style={{ backgroundColor: cat.color }}
                                                        ></span>
                                                        <span className={`${selectedCategory === cat.name ? (darkMode ? 'text-white' : 'text-slate-900 font-bold') : glassTheme.textMuted} transition-colors uppercase text-[11px] font-black tracking-wider`}>
                                                            {cat.name}
                                                        </span>
                                                    </div>
                                                    <span className={`font-bold ${selectedCategory === cat.name ? (darkMode ? 'text-blue-400' : 'text-blue-600') : (darkMode ? 'text-slate-300' : 'text-slate-600')}`}>
                                                        {formatCurrency(cat.value)}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center text-sm ${glassTheme.textMuted}`}>No expenses yet</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main List */}
                <div className={`${glassTheme.card} rounded-3xl overflow-hidden pop-in`} style={{ animationDelay: '600ms' }}>
                    {/* Toolbar */}
                    <div className={`p-6 border-b ${darkMode ? 'border-slate-700/50' : 'border-slate-200/50'} flex flex-col sm:flex-row gap-4 justify-between items-center`}>
                        <div className="relative w-full sm:w-80 group">
                            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${glassTheme.textMuted} transition-colors group-focus-within:text-blue-500`} size={20} />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                className={`${glassTheme.input} pl-12`}
                            />
                        </div>
                        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full">
                            <button
                                onClick={() => setIsFormOpen(true)}
                                className={`hidden lg:flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${glassTheme.buttonPri}`}
                            >
                                <Plus size={16} strokeWidth={3} />
                                Add Expense
                            </button>
                            {(selectedCategory || selectedDate) && (
                                <button
                                    onClick={() => { setSelectedCategory(null); setSelectedDate(null); }}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${darkMode ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-600 border border-rose-100'
                                        } hover:scale-105`}
                                >
                                    Clear ✕
                                </button>
                            )}
                            {selectedCategory && (
                                <div className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${darkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                    }`}>
                                    {selectedCategory}
                                </div>
                            )}
                            {selectedDate && (
                                <div className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${darkMode ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                    }`}>
                                    {selectedDate}
                                </div>
                            )}
                            <div className={`text-[10px] sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl backdrop-blur-md ${darkMode ? 'bg-white/5 text-slate-300' : 'bg-black/5 text-slate-600'}`}>
                                {filteredExpenses.length} Records
                            </div>
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className={`hidden md:grid grid-cols-12 gap-4 p-5 text-[10px] font-black uppercase tracking-[0.15em] ${darkMode ? 'bg-slate-900/50 text-slate-500' : 'bg-slate-50/50 text-slate-400'}`}>
                        <div className="col-span-2 pl-2">Date</div>
                        <div className="col-span-4">Description</div>
                        <div className="col-span-3">Category</div>
                        <div className="col-span-2 text-right">Amount</div>
                        <div className="col-span-1 text-right pr-2">Action</div>
                    </div>

                    {/* Expenses List */}
                    <div className={`divide-y ${glassTheme.divider} max-h-[600px] overflow-y-auto custom-scrollbar pb-24 md:pb-0`}>
                        {loadingData ? (
                            <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                                <Loader2 className="animate-spin" size={40} />
                                <p className="text-sm font-medium">Loading your financial data...</p>
                            </div>
                        ) : filteredExpenses.length > 0 ? (
                            filteredExpenses.map((expense, idx) => {
                                const { color, icon } = getCategoryDetails(expense.category);
                                return (
                                    <div
                                        key={expense.id}
                                        className={`group p-6 md:grid md:grid-cols-12 md:gap-4 items-center transition-all duration-300 ${glassTheme.listHover} hover:bg-gradient-to-r ${darkMode ? 'hover:from-white/5 hover:to-transparent' : 'hover:from-black/5 hover:to-transparent'}`}
                                        style={{ animationDelay: `${idx * 30}ms` }}
                                    >
                                        {/* Mobile View */}
                                        <div className="flex justify-between md:hidden mb-1">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-xl shadow-lg border border-white/10" style={{ backgroundColor: `${color}20`, color: color }}>
                                                    {icon}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`text-base font-black leading-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>{expense.description}</span>
                                                    <span className={`text-[10px] font-bold opacity-60 mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        {new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {expense.category}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`font-black text-lg ${darkMode ? 'text-white' : 'text-slate-800'}`}>{formatCurrency(expense.amount)}</span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEditClick(expense); }}
                                                        className={`p-2 rounded-xl transition-all ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(expense.id); }}
                                                        className={`p-2 rounded-xl transition-all ${darkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'}`}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Desktop View */}
                                        <div className={`col-span-2 text-xs hidden md:flex items-center gap-2 pl-2 ${glassTheme.textMuted} font-bold`}>
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                                            {new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        </div>

                                        <div className={`col-span-4 flex items-center gap-3 hidden md:flex truncate`}>
                                            <div className={`p-2 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${darkMode ? 'bg-slate-800/50' : 'bg-slate-100'}`} style={{ color: color }}>
                                                {icon}
                                            </div>
                                            <span className={`text-sm font-black tracking-tight ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                                {expense.description}
                                            </span>
                                        </div>

                                        <div className="col-span-3 text-sm hidden md:block">
                                            <span
                                                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 group-hover:translate-x-1`}
                                                style={{
                                                    backgroundColor: `${color}15`,
                                                    color: color,
                                                    border: `1px solid ${color}30`
                                                }}
                                            >
                                                {expense.category}
                                            </span>
                                        </div>

                                        <div className={`col-span-2 text-right font-black hidden md:block text-lg tracking-tighter ${darkMode ? 'text-white' : 'text-slate-950'}`}>
                                            {formatCurrency(expense.amount)}
                                        </div>

                                        <div className="col-span-1 text-right hidden md:flex justify-end gap-2 pr-2">
                                            <button
                                                onClick={() => handleEditClick(expense)}
                                                className={`p-2.5 rounded-2xl transition-all duration-200 opacity-0 group-hover:opacity-100 ${darkMode ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'} hover:scale-110 active:scale-90 shadow-lg`}
                                                title="Edit Entry"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(expense.id)}
                                                className={`p-2.5 rounded-2xl transition-all duration-200 opacity-0 group-hover:opacity-100 ${darkMode ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'} hover:scale-110 active:scale-90 shadow-lg`}
                                                title="Delete Entry"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className={`p-16 text-center flex flex-col items-center ${glassTheme.textMuted}`}>
                                <div className={`p-6 rounded-full mb-4 ${darkMode ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                                    <FileText size={48} className="opacity-40" />
                                </div>
                                <p className="text-lg font-medium">No expenses found.</p>
                                <button onClick={() => setIsFormOpen(true)} className="text-blue-500 font-bold hover:text-blue-400 hover:underline mt-2 transition-colors">Start tracking now</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Expense Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300">
                    <div className={`${glassTheme.card} rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300 slide-in-from-bottom-8`}>
                        <div className={`p-6 border-b flex justify-between items-center ${darkMode ? 'border-slate-700/50' : 'border-slate-200/50'}`}>
                            <h2 className={`text-xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                {editingExpense ? 'Edit Transaction' : 'Add Transaction'}
                            </h2>
                            <button onClick={handleCloseForm} className={`p-2 rounded-full hover:bg-black/5 ${glassTheme.textMuted} hover:text-slate-500 transition-all`}>✕</button>
                        </div>

                        <form onSubmit={handleAddExpense} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className={`block text-xs font-bold uppercase tracking-wider ${glassTheme.textMuted}`}>Date</label>
                                <input
                                    type="date"
                                    required
                                    value={newExpense.date}
                                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                                    className={glassTheme.input}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={`block text-xs font-bold uppercase tracking-wider ${glassTheme.textMuted}`}>Description</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Netflix Subscription"
                                    value={newExpense.description}
                                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                    className={glassTheme.input}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className={`block text-xs font-bold uppercase tracking-wider ${glassTheme.textMuted}`}>Amount</label>
                                    <div className="relative">
                                        <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold ${glassTheme.textMuted}`}>₹</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            placeholder="0.00"
                                            value={newExpense.amount}
                                            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                            className={`${glassTheme.input} pl-9 font-bold`}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className={`block text-xs font-bold uppercase tracking-wider ${glassTheme.textMuted}`}>Category</label>
                                    <div className="relative">
                                        <select
                                            value={newExpense.category}
                                            onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                            className={`${glassTheme.input} appearance-none cursor-pointer`}
                                        >
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                            <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex gap-4">
                                <button
                                    type="button"
                                    onClick={handleCloseForm}
                                    className={`flex-1 px-4 py-3 border font-bold rounded-2xl transition-all hover:bg-black/5 ${darkMode ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-600'}`}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className={`flex-1 ${glassTheme.buttonPri}`}>
                                    {editingExpense ? 'Update Entry' : 'Save Entry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Floating Action Button (FAB) for Quick Add */}
            <button
                onClick={() => setIsFormOpen(true)}
                className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 p-3.5 md:p-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-110 active:scale-90 flex items-center justify-center group ${glassTheme.buttonPri}`}
                title="Quick Add Expense"
            >
                <Plus size={window.innerWidth < 768 ? 24 : 28} className="transition-transform duration-500 group-hover:rotate-90" />
                <span className="hidden md:inline-block max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-500 font-bold text-sm uppercase tracking-widest">
                    Quick Add
                </span>
            </button>

            {/* History Modal */}
            {viewingHistory && (
                <HistoryModal
                    type={viewingHistory}
                    data={viewingHistory === 'weekly' ? stats.weeklyHistory : stats.monthlyHistory}
                    onClose={() => setViewingHistory(null)}
                    darkMode={darkMode}
                    glassTheme={glassTheme}
                    formatCurrency={formatCurrency}
                />
            )}
        </div>
    );
};

const StatCard = ({ title, amount, icon, trend, glassTheme, delay, darkMode, gradient, onClick, interactive }) => {
    const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

    return (
        <div
            onClick={onClick}
            className={`relative overflow-hidden p-6 rounded-3xl ${glassTheme.card} pop-in group transition-all duration-500 ${interactive
                ? 'cursor-pointer hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-[1.02]'
                : 'hover:-translate-y-1'
                }`}
            style={{ animationDelay: delay }}
        >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Background Gradient Splash */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-700`} />

            <div className="flex justify-between items-start mb-6 relative z-10 text-slate-100">
                <div className={`p-3.5 rounded-2xl shadow-xl transition-all duration-500 ${darkMode ? 'bg-slate-800 border border-slate-700/50' : 'bg-white border border-slate-100'
                    } group-hover:rotate-[15deg] group-hover:scale-110 group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]`}>
                    {icon}
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full backdrop-blur-md ${darkMode ? 'bg-white/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                        } group-hover:scale-110 transition-transform`}>
                        {trend}
                    </span>
                    {interactive && (
                        <span className={`text-[9px] font-bold uppercase tracking-wider opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all translate-y-0 md:translate-y-1 md:group-hover:translate-y-0 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            Click to View History
                        </span>
                    )}
                </div>
            </div>
            <div className="relative z-10">
                <h3 className={`text-xs font-black uppercase tracking-[0.15em] mb-2 ${glassTheme.textMuted}`}>{title}</h3>
                <p className={`text-5xl font-black tracking-tighter tabular-nums bg-clip-text text-transparent transition-all duration-500 ${darkMode
                    ? 'bg-gradient-to-br from-white via-white to-slate-500 group-hover:to-blue-400'
                    : 'bg-gradient-to-br from-slate-950 to-slate-600 group-hover:to-blue-600'}`}>
                    {formatter.format(amount)}
                </p>
            </div>
        </div>
    );
};

const HistoryModal = ({ type, data, onClose, darkMode, glassTheme, formatCurrency }) => {
    const [selectedPeriod, setSelectedPeriod] = useState(data[0] || null);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className={`${glassTheme.card} rounded-[2rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col pop-in`}>
                {/* Header */}
                <div className={`p-8 border-b flex justify-between items-center ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div>
                        <h2 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {type.charAt(0).toUpperCase() + type.slice(1)} <span className="text-blue-500">History</span>
                        </h2>
                        <p className={`text-sm font-medium mt-1 ${glassTheme.textMuted}`}>Deep dive into your past spending patterns.</p>
                    </div>
                    <button onClick={onClose} className={`p-3 rounded-full hover:bg-black/10 transition-all ${glassTheme.textMuted} hover:text-white`}>✕</button>
                </div>
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Period Sidebar */}
                    <div className={`w-full md:w-1/3 border-b md:border-b-0 md:border-r overflow-y-auto custom-scrollbar h-40 md:h-auto ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                        <div className="p-3 md:p-4 md:space-y-2 flex md:block overflow-x-auto md:overflow-x-visible gap-2 md:gap-0">
                            {data.map((period) => (
                                <button
                                    key={period.period}
                                    onClick={() => setSelectedPeriod(period)}
                                    className={`shrink-0 md:shrink md:w-full p-4 md:p-5 rounded-2xl text-left transition-all relative overflow-hidden group ${selectedPeriod?.period === period.period
                                        ? (darkMode ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-blue-50 text-blue-600 border border-blue-100')
                                        : (darkMode ? 'hover:bg-white/5 border border-transparent' : 'hover:bg-slate-50 border border-transparent')
                                        }`}
                                >
                                    <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-center">
                                        <div>
                                            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5 md:mb-1">{period.period}</p>
                                            <p className="font-bold text-xs md:text-sm whitespace-nowrap">{period.label}</p>
                                        </div>
                                        <p className={`font-black tracking-tighter mt-1 md:mt-0 ${selectedPeriod?.period === period.period ? 'text-blue-500' : (darkMode ? 'text-white' : 'text-slate-900')}`}>
                                            {formatCurrency(period.total)}
                                        </p>
                                    </div>
                                    {selectedPeriod?.period === period.period && (
                                        <div className="absolute left-0 right-0 bottom-0 md:top-0 md:right-auto md:w-1 md:h-auto h-1 bg-blue-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Transaction List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                        {selectedPeriod ? (
                            <div className="space-y-6">
                                <div className="flex justify-between items-end pb-6 border-b border-dashed border-slate-700/50">
                                    <div>
                                        <p className={`text-[11px] font-black uppercase tracking-[0.2em] mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Overview</p>
                                        <h3 className={`text-4xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            {formatCurrency(selectedPeriod.total)}
                                        </h3>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-[11px] font-black uppercase tracking-[0.2em] mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Volume</p>
                                        <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{selectedPeriod.count} Entries</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mt-8">
                                    {selectedPeriod.items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'
                                                } hover:border-blue-500/30 hover:translate-x-1`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600 shadow-sm'
                                                    }`}>
                                                    {item.category}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.description}</p>
                                                    <p className={`text-[10px] font-medium opacity-50 ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>{item.date}</p>
                                                </div>
                                            </div>
                                            <p className={`font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-950'}`}>{formatCurrency(item.amount)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center opacity-30">
                                <p className="text-xl font-black uppercase tracking-widest">Select a period</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};



const SimpleBarChart = ({ data, darkMode, selectedDate, onBarClick }) => {
    const maxValue = Math.max(...data.map(d => d.value)) || 100;

    return (
        <>
            {data.map((item, index) => {
                // Scale to 80% to leave room for the label at the bottom
                const heightPercent = Math.max((item.value / maxValue) * 80, 6);
                const isSelected = selectedDate === item.fullDate;
                const isAnySelected = selectedDate !== null;

                return (
                    <div
                        key={index}
                        onClick={() => onBarClick(item.fullDate)}
                        className="flex flex-col items-center justify-end h-full w-full group relative cursor-pointer"
                    >
                        {/* Redesigned Premium Tooltip */}
                        <div className={`absolute bottom-full mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-30 pointer-events-none`}>
                            <div className={`backdrop-blur-md border rounded-2xl p-3 shadow-2xl flex flex-col items-center min-w-[100px] ${darkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-slate-200'
                                }`}>
                                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Spending</span>
                                <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>₹{item.value.toLocaleString()}</span>
                                <span className={`text-[9px] font-bold mt-1 opacity-60 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.fullDate}</span>
                            </div>
                            <div className={`mx-auto w-3 h-3 rotate-45 -mt-1.5 border-r border-b ${darkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-slate-200'
                                }`}></div>
                        </div>

                        {/* The Bar with Premium Gradient and Shadow */}
                        <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full max-w-[28px] sm:max-w-[36px] md:max-w-[42px] rounded-t-xl md:rounded-t-2xl transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) relative overflow-hidden ${isAnySelected && !isSelected ? 'opacity-30 scale-95' : 'opacity-100'
                                } ${item.value > 0
                                    ? (isSelected
                                        ? 'bg-gradient-to-t from-blue-600 via-indigo-500 to-purple-400 shadow-[0_0_20px_rgba(79,70,229,0.4)]'
                                        : 'bg-gradient-to-t from-blue-600/80 to-blue-400/80 group-hover:from-blue-600 group-hover:to-indigo-400'
                                    )
                                    : (darkMode ? 'bg-slate-800/30' : 'bg-slate-100/50')
                                }`}
                        >
                            {/* Inner Glass Highlight */}
                            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                        </div>

                        <span className={`text-[8px] md:text-[10px] uppercase font-black mt-4 tracking-tighter md:tracking-[0.15em] transition-all duration-300 ${isSelected
                            ? (darkMode ? 'text-blue-400' : 'text-blue-600')
                            : (darkMode ? 'text-slate-600 group-hover:text-slate-400' : 'text-slate-400 group-hover:text-slate-600')
                            }`}>
                            {item.day}
                        </span>

                        {/* Active Indicator Under Text */}
                        {isSelected && (
                            <div className="absolute -bottom-2 w-1 h-1 rounded-full bg-blue-500 animate-ping" />
                        )}
                    </div>
                );
            })}
        </>
    );
};

const SimplePieChart = ({ data, darkMode, onSliceClick, selectedCategory }) => {
    let cumulativePercent = 0;
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    const getCoordinatesForPercent = (percent) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    return (
        <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full overflow-visible outline-none">
            {data.map((slice, i) => {
                const startPercent = cumulativePercent;
                const slicePercent = slice.value / total;
                cumulativePercent += slicePercent;
                const endPercent = cumulativePercent;

                const [startX, startY] = getCoordinatesForPercent(startPercent);
                const [endX, endY] = getCoordinatesForPercent(endPercent);

                const largeArcFlag = slicePercent > 0.5 ? 1 : 0;

                if (slicePercent === 1) return <circle key={i} cx="0" cy="0" r="1" fill={slice.color} />;

                const pathData = `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
                const isSelected = selectedCategory === slice.name;
                const isAnySelected = selectedCategory !== null;

                return (
                    <path
                        key={i}
                        d={pathData}
                        fill={slice.color}
                        onClick={() => onSliceClick(slice.name)}
                        className={`transition-all duration-300 ease-out cursor-pointer ${isAnySelected && !isSelected ? 'opacity-30' : 'opacity-100'} ${isSelected ? 'brightness-125' : 'hover:opacity-80'}`}
                    />
                );
            })}
            <circle cx="0" cy="0" r="0.75" fill={darkMode ? "#1e293b" : "#f1f5f9"} className="transition-colors duration-500 pointer-events-none" style={{ fillOpacity: 0.1 }} />
            <circle cx="0" cy="0" r="0.7" fill="transparent" className="pointer-events-none" />
        </svg>
    );
};

export default ExpenseTracker;
