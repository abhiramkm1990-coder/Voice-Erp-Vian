import React, { useState } from 'react';
import { Employee, UserRole } from '../../types';
import { CurrencyCode, formatCurrency } from '../../lib/currency';
import { getEmploymentStatus } from '../../lib/employmentStatus';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Heart,
  ShieldAlert,
  Briefcase,
  Calendar,
  Building,
  CreditCard,
  Edit3,
  X,
  CheckCircle2,
  DollarSign,
  UserCheck,
  FileText,
} from 'lucide-react';

interface EmployeeProfileSelfServiceProps {
  currentUser: Employee;
  currentRole: UserRole;
  currency: CurrencyCode;
  onUpdateProfile: (updatedEmployee: Employee) => void;
}

export const EmployeeProfileSelfService: React.FC<EmployeeProfileSelfServiceProps> = ({
  currentUser,
  currentRole,
  currency,
  onUpdateProfile,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);

  // Form State
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [personalEmail, setPersonalEmail] = useState(currentUser.personalEmail || '');
  const [address, setAddress] = useState(currentUser.address || '');
  const [emergencyContactName, setEmergencyContactName] = useState(currentUser.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(currentUser.emergencyContactPhone || '');
  const [bloodGroup, setBloodGroup] = useState(currentUser.bloodGroup || 'O+');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: Employee = {
      ...currentUser,
      phone: phone.trim(),
      personalEmail: personalEmail.trim(),
      address: address.trim(),
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
      bloodGroup: bloodGroup.trim(),
    };

    onUpdateProfile(updated);
    setShowEditModal(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Profile Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center space-x-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-20 h-20 rounded-3xl object-cover ring-4 ring-blue-50 shadow-md"
            />
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h1 className="text-xl font-black text-slate-900">{currentUser.name}</h1>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    currentUser.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : currentUser.role === 'it_support'
                      ? 'bg-cyan-100 text-cyan-800'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {currentUser.role === 'it_support' ? 'IT Support' : currentUser.role}
                </span>

                {(() => {
                  const tenure = getEmploymentStatus(currentUser.joinDate);
                  return (
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${tenure.badgeBg} ${tenure.badgeText} ${tenure.badgeBorder}`}
                    >
                      {tenure.status} ({tenure.monthsCompleted}m Tenure)
                    </span>
                  );
                })()}
              </div>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">{currentUser.designation}</p>
              <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1.5">
                <span className="flex items-center space-x-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentUser.department}</span>
                </span>
                <span>&bull;</span>
                <span className="font-mono text-slate-400">ID: {currentUser.id}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setPhone(currentUser.phone || '');
              setPersonalEmail(currentUser.personalEmail || '');
              setAddress(currentUser.address || '');
              setEmergencyContactName(currentUser.emergencyContactName || '');
              setEmergencyContactPhone(currentUser.emergencyContactPhone || '');
              setBloodGroup(currentUser.bloodGroup || 'O+');
              setShowEditModal(true);
            }}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-md transition-all cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-blue-400" />
            <span>Edit Contact & Emergency Info</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-emerald-800 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profile contact details updated successfully!</span>
          </div>
        )}

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: Contact & Personal Info */}
          <div className="space-y-4">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <User className="w-4 h-4 text-blue-600" />
              <span>Contact & Personal Details</span>
            </h2>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Phone Number</span>
                </span>
                <span className="font-bold text-slate-800">{currentUser.phone}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Official Email</span>
                </span>
                <span className="font-bold text-slate-800">{currentUser.email}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Personal Email</span>
                </span>
                <span className="font-bold text-slate-800">{currentUser.personalEmail || 'Not Provided'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium flex items-center space-x-2">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Blood Group</span>
                </span>
                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  {currentUser.bloodGroup || 'O+'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-medium flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Residential Address</span>
                </span>
                <p className="font-medium text-slate-800 pl-5 bg-white p-2.5 rounded-xl border border-slate-200/60 leading-relaxed">
                  {currentUser.address || 'Address not updated yet.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Emergency Contact & Work Info */}
          <div className="space-y-4">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Emergency Contact & Employment</span>
            </h2>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium flex items-center space-x-2">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Emergency Contact Person</span>
                </span>
                <span className="font-bold text-slate-800">
                  {currentUser.emergencyContactName || 'Not Provided'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Emergency Phone</span>
                </span>
                <span className="font-bold text-amber-700">
                  {currentUser.emergencyContactPhone || 'Not Provided'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Date of Joining</span>
                </span>
                <span className="font-bold text-slate-800">{currentUser.joinDate}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium flex items-center space-x-2">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Salary Account</span>
                </span>
                <span className="font-bold text-slate-800">{currentUser.salary.bankAccount}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center space-x-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>PAN Number</span>
                </span>
                <span className="font-mono font-bold text-slate-800 uppercase">{currentUser.salary.panNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Salary & Leave Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-md space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold uppercase tracking-wider">Monthly Net Salary</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-300">
              {formatCurrency(currentUser.salary.netPay, currency)}
            </p>
            <p className="text-[11px] text-slate-400">
              Basic: {formatCurrency(currentUser.salary.basic, currency)} | HRA: {formatCurrency(currentUser.salary.hra, currency)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-2xl p-4 shadow-md space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold uppercase tracking-wider">Leave Balance Remaining</span>
              <Calendar className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-cyan-300">
              {currentUser.leaveBalance.casual + currentUser.leaveBalance.sick + currentUser.leaveBalance.earned} Days
            </p>
            <p className="text-[11px] text-slate-400">
              Casual: {currentUser.leaveBalance.casual}d | Sick: {currentUser.leaveBalance.sick}d | Earned: {currentUser.leaveBalance.earned}d
            </p>
          </div>
        </div>
      </div>

      {/* EDIT CONTACT INFO MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Edit3 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Edit Contact & Emergency Details</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Personal Email
                  </label>
                  <input
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Spouse / Brother Name"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="text"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-hidden"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Residential Address
                </label>
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow-md cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
