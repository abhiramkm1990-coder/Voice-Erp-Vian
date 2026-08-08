import React, { useState, useEffect } from 'react';
import { Employee, AttendanceRecord } from '../../types';
import { Clock, Play, Square, Coffee, Calendar, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface AttendanceTrackerProps {
  currentUser: Employee;
  todayAttendance?: AttendanceRecord;
  onPunchIn: () => void;
  onPunchOut: () => void;
  onStartBreak: () => void;
  onEndBreak: () => void;
  allAttendanceLogs: AttendanceRecord[];
}

export const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  currentUser,
  todayAttendance,
  onPunchIn,
  onPunchOut,
  onStartBreak,
  onEndBreak,
  allAttendanceLogs,
}) => {
  const [secondsWorked, setSecondsWorked] = useState(0);
  const [secondsBreak, setSecondsBreak] = useState(0);

  const isClockedIn = todayAttendance && todayAttendance.status !== 'absent';
  const isOnBreak = todayAttendance?.status === 'on_break';

  // Live Timer Effect
  useEffect(() => {
    let interval: any = null;

    if (isClockedIn && !isOnBreak) {
      interval = setInterval(() => {
        setSecondsWorked((prev) => prev + 1);
      }, 1000);
    } else if (isOnBreak) {
      interval = setInterval(() => {
        setSecondsBreak((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isClockedIn, isOnBreak]);

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const myLogs = allAttendanceLogs.filter((a) => a.employeeId === currentUser.id);

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Attendance & Time Tracker</h2>
          <p className="text-xs text-slate-500 mt-1">Real-time punch in/out logs & break timers</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Today: {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Main Punch & Timer Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Stopwatch Card (2 Cols) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Live Attendance Stopwatch
              </span>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
              isOnBreak
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : isClockedIn
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-700 text-slate-300'
            }`}>
              {isOnBreak ? 'On Break' : isClockedIn ? 'Clocked In' : 'Not Punched In'}
            </span>
          </div>

          {/* Large Digit Counter */}
          <div className="text-center py-4 space-y-2">
            <div className="font-mono text-4xl sm:text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-200 to-white">
              {formatTime(secondsWorked)}
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Total Work Time Elapsed Today
            </p>

            {isOnBreak && (
              <div className="mt-4 pt-3 border-t border-slate-700/60 inline-flex items-center space-x-2 text-amber-300 font-mono text-sm bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
                <Coffee className="w-4 h-4 animate-bounce" />
                <span>Active Break Timer: {formatTime(secondsBreak)}</span>
              </div>
            )}
          </div>

          {/* Punch Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            {/* Punch In/Out Toggle */}
            {!isClockedIn ? (
              <button
                onClick={onPunchIn}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm py-3.5 px-6 rounded-2xl transition-all cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Punch In (Start Shift)</span>
              </button>
            ) : (
              <button
                onClick={onPunchOut}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm py-3.5 px-6 rounded-2xl transition-all cursor-pointer shadow-lg shadow-rose-500/20 flex items-center justify-center space-x-2"
              >
                <Square className="w-5 h-5 fill-current" />
                <span>Punch Out (End Shift)</span>
              </button>
            )}

            {/* Break Toggle */}
            <button
              onClick={isOnBreak ? onEndBreak : onStartBreak}
              disabled={!isClockedIn}
              className={`w-full font-bold text-sm py-3.5 px-6 rounded-2xl transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                !isClockedIn
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : isOnBreak
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
            >
              <Coffee className="w-5 h-5" />
              <span>{isOnBreak ? 'End Break & Resume Work' : 'Start Coffee/Tea Break'}</span>
            </button>
          </div>
        </div>

        {/* Attendance Summary Stat Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Today's Session Log
            </h3>
            <div className="space-y-3 mt-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Clock In Time:</span>
                <span className="font-bold text-slate-900">{todayAttendance?.clockIn || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Clock Out Time:</span>
                <span className="font-bold text-slate-900">{todayAttendance?.clockOut || 'Shift Active'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Break Duration:</span>
                <span className="font-bold text-amber-700">
                  {todayAttendance?.breakTimeMinutes || 0} mins
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 space-y-1">
            <p className="text-[11px] font-bold text-blue-800 uppercase">Monthly Attendance Score</p>
            <p className="text-xl font-black text-blue-900">98.5% On-Time</p>
            <p className="text-[11px] text-blue-600">Great punctuality record this month!</p>
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">My Attendance Logs History</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-3">Date</th>
                <th className="p-3">Clock In</th>
                <th className="p-3">Clock Out</th>
                <th className="p-3">Break Mins</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-semibold text-slate-800">{log.date}</td>
                  <td className="p-3 text-slate-700">{log.clockIn}</td>
                  <td className="p-3 text-slate-700">{log.clockOut || 'Shift Active'}</td>
                  <td className="p-3 text-slate-700">{log.breakTimeMinutes} mins</td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        log.status === 'present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'on_break'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {log.status.replace('_', ' ')}
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
};
