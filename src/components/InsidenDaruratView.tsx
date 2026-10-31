import React, { useState } from 'react';
import { INCIDENTS, IncidentItem, SITES } from '../data/mockData';

interface InsidenDaruratViewProps {
  selectedSite: string;
}

export const InsidenDaruratView: React.FC<InsidenDaruratViewProps> = ({ selectedSite }) => {
  const [incidents, setIncidents] = useState<IncidentItem[]>(INCIDENTS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRadioMessage, setNewRadioMessage] = useState('');
  const [activeIncidentId, setActiveIncidentId] = useState<string>(INCIDENTS[0].id);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // New incident state
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    siteId: 'site-a',
    location: '',
    severity: 'Kritis' as IncidentItem['severity'],
  });

  const activeIncident = incidents.find((i) => i.id === activeIncidentId) || incidents[0];

  const filteredIncidents = incidents.filter((i) => {
    if (selectedSite !== 'all' && i.siteId !== selectedSite) return false;
    return true;
  });

  const playAlarmSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {
      // AudioContext fallback
    }
  };

  const handleSendRadio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRadioMessage.trim() || !activeIncident) return;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const newLog = {
      time: timeStr,
      caller: 'Superintendent (Komando-01)',
      message: newRadioMessage.trim(),
    };

    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === activeIncident.id) {
          return {
            ...inc,
            radioLog: [...inc.radioLog, newLog],
          };
        }
        return inc;
      })
    );

    setNewRadioMessage('');
  };

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const siteObj = SITES.find((s) => s.id === newIncident.siteId) || SITES[1];
    const newId = `INC-2025-${String(incidents.length + 15).padStart(3, '0')}`;

    const created: IncidentItem = {
      id: newId,
      title: newIncident.title,
      description: newIncident.description,
      siteId: newIncident.siteId,
      siteName: siteObj.name.replace(/^Site [A-D] - /, ''),
      location: newIncident.location || 'Posko Pengamanan',
      severity: newIncident.severity,
      reportedBy: 'Bambang Prasetyo (Superintendent)',
      reportedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      responseTime: 'Baru Diterima',
      status: 'Darurat Kritis',
      trcDispatched: true,
      trcUnits: ['TRC Siaga 1 (4 Personel)'],
      externalAuthoritiesContacted: [],
      radioLog: [
        {
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          caller: 'Komando Posko',
          message: `Insiden ${newId} dibuka: ${newIncident.title}. Seluruh regu siaga di kanal darurat.`,
        },
      ],
    };

    playAlarmSound();
    setIncidents([created, ...incidents]);
    setActiveIncidentId(newId);
    setIsAddModalOpen(false);
    setActionToast(`ALARM DARURAT AKTIF: ${newId} - ${created.title}!`);
    setTimeout(() => setActionToast(null), 4000);
  };

  const handleResolveIncident = (incidentId: string) => {
    setIncidents((prev) =>
      prev.map((i) => {
        if (i.id === incidentId) {
          return { ...i, status: 'Terkendali & Teratasi' };
        }
        return i;
      })
    );
    setActionToast(`Insiden ${incidentId} berhasil diselesaikan dan status ditutup.`);
    setTimeout(() => setActionToast(null), 3500);
  };

  const handleDispatchAuthority = (authorityName: string) => {
    if (!activeIncident) return;
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === activeIncident.id) {
          if (inc.externalAuthoritiesContacted.includes(authorityName)) return inc;
          return {
            ...inc,
            externalAuthoritiesContacted: [...inc.externalAuthoritiesContacted, authorityName],
          };
        }
        return inc;
      })
    );
    setActionToast(`Panggilan koordinasi darurat berhasil disambungkan ke ${authorityName}!`);
    setTimeout(() => setActionToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {actionToast && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded text-xs text-rose-800 font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600 text-base">emergency</span>
            <span>{actionToast}</span>
          </div>
          <button onClick={() => setActionToast(null)} className="text-rose-700 hover:text-rose-900">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
              Pusat Respons Insiden Darurat &amp; Alarm SOS
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
              Pusat Komando Siaga
            </span>
          </div>
          <p className="text-xs text-[#64748b] mt-1">
            Monitoring penanganan darurat real-time, tombol panik petugas lapangan, eskalasi komando keamanan, dan investigasi pasca-kejadian.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={playAlarmSound}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e2e8f0] text-[#0f172a] rounded text-xs font-semibold hover:bg-[#f8fafc] transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-sm text-rose-600">volume_up</span>
            <span>Uji Sirine Audio</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#dc2626] text-white rounded text-xs font-bold hover:bg-[#b91c1c] transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">add_alert</span>
            <span>+ Laporkan Insiden Manual</span>
          </button>
        </div>
      </div>

      {/* Main Crisis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Incident Dashboard & Radio Transceiver */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Incident Banner */}
          {activeIncident && (
            <div
              className={`border rounded-lg p-5 shadow-xs transition-all ${
                activeIncident.status !== 'Terkendali & Teratasi'
                  ? 'bg-rose-50/50 border-rose-300'
                  : 'bg-white border-[#e2e8f0]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white border border-rose-200 text-rose-700">
                    {activeIncident.id}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                    {activeIncident.severity}
                  </span>
                  <span className="text-xs text-[#64748b]">{activeIncident.siteName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      activeIncident.status === 'Terkendali & Teratasi'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800 animate-pulse'
                    }`}
                  >
                    {activeIncident.status}
                  </span>
                  {activeIncident.status !== 'Terkendali & Teratasi' && (
                    <button
                      onClick={() => handleResolveIncident(activeIncident.id)}
                      className="px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold shadow-xs"
                    >
                      Selesaikan Insiden
                    </button>
                  )}
                </div>
              </div>

              <h2 className="text-base font-bold text-[#0f172a] mb-1.5">{activeIncident.title}</h2>
              <p className="text-xs text-[#334155] leading-relaxed mb-4">{activeIncident.description}</p>

              {/* Status Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-white border border-[#e2e8f0] rounded text-xs mb-4">
                <div>
                  <span className="text-[10px] text-[#64748b] uppercase block">Lokasi Insiden:</span>
                  <strong className="text-[#0f172a] font-semibold">{activeIncident.location}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748b] uppercase block">Waktu Lapor:</span>
                  <strong className="text-[#0f172a] font-semibold">{activeIncident.reportedAt}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748b] uppercase block">Waktu Respon TRC:</span>
                  <strong className="text-emerald-700 font-semibold">{activeIncident.responseTime}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748b] uppercase block">Pelapor:</span>
                  <strong className="text-[#0f172a] font-semibold">{activeIncident.reportedBy}</strong>
                </div>
              </div>

              {/* TRC and External Authorities Strip */}
              <div className="space-y-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#0f172a]">Unit TRC Dikerahkan:</span>
                  {activeIncident.trcUnits.map((unit, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                      {unit}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#f1f5f9]">
                  <span className="font-semibold text-[#0f172a]">Koordinasi Eksternal:</span>
                  {activeIncident.externalAuthoritiesContacted.length > 0 ? (
                    activeIncident.externalAuthoritiesContacted.map((auth, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">call</span>
                        <span>{auth}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-[#94a3b8] text-[11px]">Belum ada panggilan keluar</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Live Two-Way Radio HT Transceiver Transcript */}
          {activeIncident && (
            <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden shadow-xs">
              <div className="px-4 py-3 bg-[#101b35] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400 text-lg animate-pulse">radio</span>
                  <h3 className="text-xs font-bold uppercase tracking-wider">Kanal Radio Komando Taktis (CH-01 Darurat)</h3>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-[#0b132b] px-2 py-0.5 rounded">
                  Freq: 146.520 MHz
                </span>
              </div>

              {/* Radio Log Stream */}
              <div className="p-4 space-y-3 max-h-56 overflow-y-auto bg-[#faf8ff] text-xs font-mono">
                {activeIncident.radioLog.map((log, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-white border border-[#e2e8f0] shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] text-[#64748b] mb-1">
                      <span className="font-bold text-[#2563eb]">{log.caller}</span>
                      <span className="text-[#94a3b8]">{log.time}</span>
                    </div>
                    <p className="text-[#0f172a] font-sans text-xs leading-relaxed">{log.message}</p>
                  </div>
                ))}
              </div>

              {/* Radio Input Box */}
              <form onSubmit={handleSendRadio} className="p-3 bg-white border-t border-[#e2e8f0] flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ketik instruksi siaran radio (misal: 'Amankan perimeter selatan sekarang')..."
                  value={newRadioMessage}
                  onChange={(e) => setNewRadioMessage(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#2563eb] text-white rounded text-xs font-semibold hover:bg-[#1d4ed8] flex items-center gap-1 shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  <span>Siarkan HT</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Emergency Hotlines & Incident List */}
        <div className="space-y-6">
          {/* External Emergency Dispatch Hotlines */}
          <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f172a]">
              Hubungi Otoritas Eksternal
            </h3>
            <p className="text-[11px] text-[#64748b]">
              Koneksi telepon darurat langsung ke instansi terkait di wilayah hukum operasional:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleDispatchAuthority('Polsek Setiabudi / Polsek Cakung')}
                className="w-full p-2.5 rounded border border-[#e2e8f0] hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    110
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0f172a] block">Kepolisian RI (Polsek)</span>
                    <span className="text-[10px] text-[#64748b]">Pemberitahuan ancaman kriminal</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-blue-600 text-lg">call</span>
              </button>

              <button
                onClick={() => handleDispatchAuthority('Damkar Sektor Jakarta')}
                className="w-full p-2.5 rounded border border-[#e2e8f0] hover:border-rose-300 hover:bg-rose-50 transition-all flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                    113
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0f172a] block">Pemadam Kebakaran (Damkar)</span>
                    <span className="text-[10px] text-[#64748b]">Evakuasi &amp; kebakaran fasilitas</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-rose-600 text-lg">call</span>
              </button>

              <button
                onClick={() => handleDispatchAuthority('Ambulans Gawat Darurat (AGD)')}
                className="w-full p-2.5 rounded border border-[#e2e8f0] hover:border-emerald-300 hover:bg-emerald-50 transition-all flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    119
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0f172a] block">Ambulans Medis (AGD 119)</span>
                    <span className="text-[10px] text-[#64748b]">Pertolongan pertama &amp; evakuasi korban</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-emerald-600 text-lg">call</span>
              </button>
            </div>
          </div>

          {/* All Incidents Register */}
          <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
              <span className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
                Daftar Kasus Insiden ({filteredIncidents.length})
              </span>
            </div>

            <div className="divide-y divide-[#f1f5f9] max-h-80 overflow-y-auto">
              {filteredIncidents.map((inc) => {
                const isSelected = activeIncidentId === inc.id;
                return (
                  <div
                    key={inc.id}
                    onClick={() => setActiveIncidentId(inc.id)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-rose-50/70 border-l-4 border-l-rose-600' : 'hover:bg-[#f8fafc]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-xs font-semibold text-[#0f172a]">{inc.id}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inc.status === 'Terkendali & Teratasi'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-[#0f172a] mt-1 line-clamp-1">{inc.title}</h4>
                    <div className="text-[11px] text-[#64748b] mt-1 flex items-center justify-between">
                      <span>{inc.siteName}</span>
                      <span>{inc.reportedAt}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Input Insiden Manual */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-[#cbd5e1] overflow-hidden animate-in fade-in">
            <div className="px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between bg-rose-50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-600 text-lg">emergency</span>
                <h3 className="text-sm font-bold text-rose-900">Laporkan Insiden &amp; Aktifkan Alarm Darurat</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#94a3b8] hover:text-[#0f172a]">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                  Judul Kejadian Darurat
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Terdeteksi Percikan Api di Trafo Gardu Utama"
                  value={newIncident.title}
                  onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#dc2626]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                  Deskripsi Kronologis Situasi
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan kondisi di lokasi, potensi ancaman jiwa/aset, dan tindakan awal..."
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#dc2626]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                    Lokasi Site
                  </label>
                  <select
                    value={newIncident.siteId}
                    onChange={(e) => setNewIncident({ ...newIncident, siteId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#dc2626]"
                  >
                    {SITES.filter((s) => s.id !== 'all').map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                    Titik Lokasi Spesifik
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pintu Keluar Timur Lt. 2"
                    value={newIncident.location}
                    onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#dc2626]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                  Tingkat Bahaya
                </label>
                <select
                  value={newIncident.severity}
                  onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#dc2626]"
                >
                  <option value="Kritis">Kritis (Ancaman Jiwa &amp; Api Besar - Kerahkan TRC)</option>
                  <option value="Tinggi">Tinggi (Penyusupan / Kerusakan Fasilitas Utama)</option>
                  <option value="Sedang">Sedang (Keributan / Gangguan Ketertiban)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-[#e2e8f0] text-[#334155] font-medium hover:bg-[#f8fafc]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#dc2626] text-white font-bold hover:bg-[#b91c1c] shadow-xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">e911_emergency</span>
                  <span>Aktifkan Status Darurat</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
