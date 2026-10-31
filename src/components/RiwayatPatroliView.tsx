import React, { useState } from 'react';
import { PATROL_LOGS, PatrolLogHistory } from '../data/mockData';

interface RiwayatPatroliViewProps {
  selectedSite: string;
}

export const RiwayatPatroliView: React.FC<RiwayatPatroliViewProps> = ({ selectedSite }) => {
  const [logs] = useState<PatrolLogHistory[]>(PATROL_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDetailLog, setSelectedDetailLog] = useState<PatrolLogHistory | null>(null);

  const filteredLogs = logs.filter((l) => {
    if (selectedSite !== 'all' && l.siteId !== selectedSite) return false;
    if (selectedStatus !== 'all' && l.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        l.id.toLowerCase().includes(q) ||
        l.squad.toLowerCase().includes(q) ||
        l.danru.toLowerCase().includes(q) ||
        l.siteName.toLowerCase().includes(q) ||
        l.notes.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
            Riwayat Patroli Keamanan &amp; Audit Trail
          </h1>
          <p className="text-xs text-[#64748b] mt-1">
            Arsip terverifikasi pelaksanaan patroli keamanan, persentase kepatuhan rute, catatan anomali, dan tanda tangan verifikasi pengawas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const csvContent =
                'data:text/csv;charset=utf-8,ID,Site,Squad,Danru,Date,Duration,Compliance,Supervisor,Notes\n' +
                logs.map((l) => `${l.id},"${l.siteName}",${l.squad},${l.danru},"${l.date} ${l.startTime}-${l.endTime}",${l.durationMinutes}m,${l.complianceRate}%,"${l.supervisorSignOff}","${l.notes}"`).join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', 'Riwayat_Patroli_PAMAREA.csv');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e2e8f0] text-[#0f172a] rounded text-xs font-medium hover:bg-[#f8fafc] transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-sm text-[#64748b]">download</span>
            <span>Unduh Laporan Audit (.csv)</span>
          </button>
        </div>
      </div>

      {/* Metric Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white border border-[#e2e8f0] rounded-lg p-3 shadow-xs">
        <div className="p-3 border-r border-[#f1f5f9] last:border-none">
          <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider block">Total Sesi Patroli</span>
          <span className="text-xl font-bold text-[#0f172a] mt-1 block">42 Sesi</span>
          <span className="text-[11px] text-[#64748b]">Tercatat dalam 24 jam terakhir</span>
        </div>
        <div className="p-3 border-r border-[#f1f5f9] last:border-none">
          <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider block">Rata-rata Kepatuhan Rute</span>
          <span className="text-xl font-bold text-emerald-600 mt-1 block">98.4%</span>
          <span className="text-[11px] text-emerald-700 font-medium">Melampaui KPI 95%</span>
        </div>
        <div className="p-3 border-r border-[#f1f5f9] last:border-none">
          <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider block">Rata-rata Durasi Patroli</span>
          <span className="text-xl font-bold text-[#0f172a] mt-1 block">82 Menit</span>
          <span className="text-[11px] text-[#64748b]">Per putaran rute standar</span>
        </div>
        <div className="p-3">
          <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider block">Integritas Audit Trail</span>
          <span className="text-xl font-bold text-[#2563eb] mt-1 block">100% Valid</span>
          <span className="text-[11px] text-[#64748b]">Terverifikasi tanda tangan digital</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-[#94a3b8]">
              search
            </span>
            <input
              type="text"
              placeholder="Cari ID sesi, regu, Danru, catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
          >
            <option value="all">Semua Status Hasil</option>
            <option value="Lengkap Tuntas">Lengkap Tuntas (100%)</option>
            <option value="Sebagian Terlewat">Sebagian Terlewat (&lt;100%)</option>
          </select>
        </div>

        <div className="text-xs text-[#64748b]">
          Menampilkan <strong className="text-[#0f172a]">{filteredLogs.length}</strong> catatan log riwayat
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[11px] font-semibold text-[#64748b] uppercase tracking-wider h-10">
                <th className="px-4 py-2">ID Sesi Patroli</th>
                <th className="px-4 py-2">Site / Wilayah</th>
                <th className="px-4 py-2">Regu &amp; Danru</th>
                <th className="px-4 py-2">Waktu &amp; Durasi</th>
                <th className="px-4 py-2 text-center">Titik Terpindai</th>
                <th className="px-4 py-2 text-center">Kepatuhan</th>
                <th className="px-4 py-2">Verifikasi Pengawas</th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9] text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#94a3b8]">
                    Tidak ada riwayat patroli yang cocok dengan kriteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-[#2563eb]">
                      {log.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#0f172a]">{log.siteName}</div>
                      <div className="text-[11px] text-[#64748b] truncate max-w-xs">{log.notes}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#0f172a]">{log.squad}</div>
                      <div className="text-[11px] text-[#64748b]">Danru: {log.danru}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#0f172a]">{log.date}</div>
                      <div className="text-[11px] text-[#64748b]">
                        {log.startTime} - {log.endTime} ({log.durationMinutes} menit)
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-semibold text-[#0f172a]">
                      {log.scannedPoints} / {log.totalPoints} Titik
                      {log.missedPoints > 0 && (
                        <span className="block text-[10px] text-rose-600 font-bold">
                          ({log.missedPoints} Terlewat)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          log.complianceRate === 100
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {log.complianceRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[#0f172a] font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                        <span>{log.supervisorSignOff}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedDetailLog(log)}
                        className="px-2.5 py-1 rounded border border-[#e2e8f0] text-[#334155] hover:bg-[#f8fafc] text-xs font-semibold"
                      >
                        Lihat Log
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Log */}
      {selectedDetailLog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full border border-[#cbd5e1] overflow-hidden animate-in fade-in">
            <div className="px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563eb] text-lg">history_edu</span>
                <h3 className="text-sm font-bold text-[#0f172a]">Detail Audit Sesi Patroli: {selectedDetailLog.id}</h3>
              </div>
              <button onClick={() => setSelectedDetailLog(null)} className="text-[#94a3b8] hover:text-[#0f172a]">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded">
                <div>
                  <span className="text-[#64748b]">Site Lokasi:</span>
                  <p className="font-semibold text-[#0f172a] mt-0.5">{selectedDetailLog.siteName}</p>
                </div>
                <div>
                  <span className="text-[#64748b]">Regu Pelaksana:</span>
                  <p className="font-semibold text-[#0f172a] mt-0.5">{selectedDetailLog.squad}</p>
                </div>
                <div>
                  <span className="text-[#64748b]">Waktu Pelaksanaan:</span>
                  <p className="font-semibold text-[#0f172a] mt-0.5">{selectedDetailLog.date}, {selectedDetailLog.startTime} - {selectedDetailLog.endTime}</p>
                </div>
                <div>
                  <span className="text-[#64748b]">Tingkat Kepatuhan:</span>
                  <p className="font-bold text-emerald-600 mt-0.5">{selectedDetailLog.complianceRate}% ({selectedDetailLog.scannedPoints}/{selectedDetailLog.totalPoints} Titik)</p>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase text-[#64748b] block mb-2">Catatan Lapangan &amp; Temuan:</span>
                <p className="p-3 bg-[#faf8ff] border border-[#eaedff] rounded text-[#334155] leading-relaxed">
                  {selectedDetailLog.notes}
                </p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-800 uppercase font-bold block">Tanda Tangan Verifikasi Pengawas (SPV)</span>
                  <span className="text-xs font-semibold text-emerald-950">{selectedDetailLog.supervisorSignOff}</span>
                </div>
                <span className="material-symbols-outlined text-2xl text-emerald-600">verified_user</span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setSelectedDetailLog(null)}
                  className="px-3 py-1.5 rounded bg-[#2563eb] text-white font-semibold hover:bg-[#1d4ed8]"
                >
                  Tutup Rincian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
