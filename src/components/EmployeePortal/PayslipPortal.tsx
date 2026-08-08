import React, { useState } from 'react';
import { Employee } from '../../types';
import { CurrencyCode, formatCurrency, CURRENCIES } from '../../lib/currency';
import { getEmploymentStatus } from '../../lib/employmentStatus';
import { Briefcase, Printer, Download, Building, CheckCircle2, Shield } from 'lucide-react';

interface PayslipPortalProps {
  currentUser: Employee;
  autoOpenPdf?: boolean;
  currency?: CurrencyCode;
}

export const PayslipPortal: React.FC<PayslipPortalProps> = ({
  currentUser,
  autoOpenPdf = false,
  currency = 'INR' as CurrencyCode,
}) => {
  const [showPdfModal, setShowPdfModal] = useState(autoOpenPdf);

  // Sync autoOpenPdf prop if changed
  React.useEffect(() => {
    if (autoOpenPdf) {
      setShowPdfModal(true);
    }
  }, [autoOpenPdf]);
  const salary = currentUser.salary;
  const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const grossEarnings = salary.basic + salary.hra + salary.specialAllowance;
  const totalDeductions = salary.pf + salary.tax;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Payslip & Payroll Portal</h2>
          <p className="text-xs text-slate-500 mt-1">Monthly salary breakups & downloadable PDF statements</p>
        </div>
        <button
          onClick={() => setShowPdfModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-2xl transition-all cursor-pointer shadow-md shadow-blue-500/20 flex items-center space-x-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save PDF Payslip</span>
        </button>
      </div>

      {/* Salary Overview Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Salary */}
        <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white p-6 rounded-3xl shadow-lg shadow-blue-500/10 space-y-1">
          <span className="text-xs font-bold text-blue-200 uppercase">Net Take-Home Salary</span>
          <p className="text-3xl font-black">{formatCurrency(salary.netPay, currency)}</p>
          <p className="text-[11px] text-blue-200 pt-2 border-t border-blue-500/40">
            Deposited into: {salary.bankAccount}
          </p>
        </div>

        {/* Basic Salary */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Basic Component</span>
          <p className="text-2xl font-black text-slate-900">{formatCurrency(salary.basic, currency)}</p>
          <p className="text-[11px] text-slate-500">Base salary tier</p>
        </div>

        {/* Allowances */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">HRA + Special Allowances</span>
          <p className="text-2xl font-black text-emerald-700">
            {formatCurrency(salary.hra + salary.specialAllowance, currency)}
          </p>
          <p className="text-[11px] text-slate-500">HRA: {formatCurrency(salary.hra, currency)} | Spl: {formatCurrency(salary.specialAllowance, currency)}</p>
        </div>

        {/* Deductions */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Statutory Deductions</span>
          <p className="text-2xl font-black text-rose-700">{formatCurrency(totalDeductions, currency)}</p>
          <p className="text-[11px] text-slate-500">PF: {formatCurrency(salary.pf, currency)} | Tax: {formatCurrency(salary.tax, currency)}</p>
        </div>
      </div>

      {/* Salary Breakup Card Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Salary Breakdown for {currentMonthYear}</h3>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
            Paid & Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earnings */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-emerald-700">
              Earnings (Credit)
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 bg-white rounded-xl border border-slate-100">
                <span className="text-slate-600">Basic Salary</span>
                <span className="font-bold text-slate-900">{formatCurrency(salary.basic, currency)}</span>
              </div>
              <div className="flex justify-between p-2 bg-white rounded-xl border border-slate-100">
                <span className="text-slate-600">House Rent Allowance (HRA)</span>
                <span className="font-bold text-slate-900">{formatCurrency(salary.hra, currency)}</span>
              </div>
              <div className="flex justify-between p-2 bg-white rounded-xl border border-slate-100">
                <span className="text-slate-600">Special Enterprise Allowance</span>
                <span className="font-bold text-slate-900">{formatCurrency(salary.specialAllowance, currency)}</span>
              </div>
              <div className="flex justify-between p-2 bg-emerald-50 rounded-xl font-bold text-emerald-900">
                <span>Total Gross Earnings</span>
                <span>{formatCurrency(grossEarnings, currency)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-rose-700">
              Deductions (Debit)
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 bg-white rounded-xl border border-slate-100">
                <span className="text-slate-600">Provident Fund (PF)</span>
                <span className="font-bold text-slate-900">{formatCurrency(salary.pf, currency)}</span>
              </div>
              <div className="flex justify-between p-2 bg-white rounded-xl border border-slate-100">
                <span className="text-slate-600">Income Tax / Professional Tax</span>
                <span className="font-bold text-slate-900">{formatCurrency(salary.tax, currency)}</span>
              </div>
              <div className="flex justify-between p-2 bg-rose-50 rounded-xl font-bold text-rose-900 mt-8">
                <span>Total Deductions</span>
                <span>{formatCurrency(totalDeductions, currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Downloadable Printable PDF-Style Modal Preview */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
            {/* Modal Controls Bar */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
              <span className="text-xs font-bold">Payslip Preview - Vianinfo Solutions</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Print Document Content Sheet */}
            <div className="p-8 space-y-6 text-slate-800 font-sans print:p-0">
              {/* Company Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-xl font-black text-blue-900 uppercase tracking-tight">
                    Vianinfo Solutions Pvt Ltd
                  </h1>
                  <p className="text-xs text-slate-600">Enterprise Software & AI Solutions</p>
                  <p className="text-[10px] text-slate-400">Infopark Campus, Kochi, Kerala &bull; PAN: VIAN12345K</p>
                </div>
                <div className="text-right">
                  <span className="bg-blue-900 text-white text-xs font-bold px-3 py-1 rounded-md uppercase">
                    Payslip
                  </span>
                  <p className="text-xs font-bold text-slate-800 mt-2">{currentMonthYear}</p>
                </div>
              </div>

              {/* Employee & Bank Meta Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs border border-slate-200">
                <div>
                  <p><span className="font-bold text-slate-500">Employee Name:</span> {currentUser.name}</p>
                  <p><span className="font-bold text-slate-500">Designation:</span> {currentUser.designation}</p>
                  <p><span className="font-bold text-slate-500">Department:</span> {currentUser.department}</p>
                  <p><span className="font-bold text-slate-500">Date of Joining:</span> {currentUser.joinDate}</p>
                </div>
                <div>
                  <p><span className="font-bold text-slate-500">Employment Status:</span> <span className="font-bold text-indigo-900 uppercase">{getEmploymentStatus(currentUser.joinDate).status}</span></p>
                  <p><span className="font-bold text-slate-500">Bank Account:</span> {salary.bankAccount}</p>
                  <p><span className="font-bold text-slate-500">PAN Number:</span> {salary.panNumber}</p>
                  <p><span className="font-bold text-slate-500">Payment Status:</span> Paid / Credited</p>
                </div>
              </div>

              {/* Earnings & Deductions Table */}
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="p-2 border border-slate-900">Earnings</th>
                    <th className="p-2 border border-slate-900 text-right">Amount (₹)</th>
                    <th className="p-2 border border-slate-900">Deductions</th>
                    <th className="p-2 border border-slate-900 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 border border-slate-300">
                  <tr>
                    <td className="p-2 border-r">Basic Salary</td>
                    <td className="p-2 border-r text-right">{salary.basic.toLocaleString()}</td>
                    <td className="p-2 border-r">Provident Fund (PF)</td>
                    <td className="p-2 text-right">{salary.pf.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r">HRA</td>
                    <td className="p-2 border-r text-right">{salary.hra.toLocaleString()}</td>
                    <td className="p-2 border-r">Income / Prof Tax</td>
                    <td className="p-2 text-right">{salary.tax.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r">Special Allowance</td>
                    <td className="p-2 border-r text-right">{salary.specialAllowance.toLocaleString()}</td>
                    <td className="p-2 border-r">-</td>
                    <td className="p-2 text-right">-</td>
                  </tr>
                  <tr className="font-bold bg-slate-100">
                    <td className="p-2 border-r">Gross Earnings</td>
                    <td className="p-2 border-r text-right">{grossEarnings.toLocaleString()}</td>
                    <td className="p-2 border-r">Total Deductions</td>
                    <td className="p-2 text-right">{totalDeductions.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              {/* Net Pay Box */}
              <div className="bg-blue-50 border-2 border-blue-600 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-900 uppercase">Net Payable Amount</p>
                  <p className="text-xl font-black text-blue-900">
                    {formatCurrency(salary.netPay, currency)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 italic block">Authorized Signature</span>
                  <p className="text-xs font-bold text-slate-800">Vianinfo Finance Dept</p>
                </div>
              </div>

              {/* Footer Stamp */}
              <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                This is a computer generated document crafted by Vianinfo Solutions Enterprise ERP. No physical signature required.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
