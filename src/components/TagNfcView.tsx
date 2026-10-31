import React, { useState } from 'react';
import { NFC_TAGS, NfcTagItem, SITES, CHECKPOINTS, CheckpointItem } from '../data/mockData';
import { isValidNfcUid } from '../utils/security-logic';

interface TagNfcViewProps {
  selectedSite: string;
  tags?: NfcTagItem[];
  checkpoints?: CheckpointItem[];
  onUpdateTags?: (tags: NfcTagItem[]) => void;
  onUnassignTag?: (tagUid: string) => void;
  onAssignTag?: (tagUid: string, checkpointId: string) => void;
}

export const TagNfcView: React.FC<TagNfcViewProps> = ({
  selectedSite,
  tags: propTags,
  checkpoints: propCheckpoints,
  onUpdateTags,
  onUnassignTag,
  onAssignTag,
}) => {
  const [localTags, setLocalTags] = useState<NfcTagItem[]>(NFC_TAGS);
  const tags = propTags || localTags;
  const checkpoints = propCheckpoints || CHECKPOINTS;

  const setTagsList = (updater: (prev: NfcTagItem[]) => NfcTagItem[]) => {
    if (onUpdateTags) {
      onUpdateTags(updater(tags));
    } else {
      setLocalTags(updater);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagType, setSelectedTagType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [diagnosingTag, setDiagnosingTag] = useState<NfcTagItem | null>(null);
  const [editingTag, setEditingTag] = useState<NfcTagItem | null>(null);
  const [deletingTag, setDeletingTag] = useState<NfcTagItem | null>(null);
  const [unassigningTag, setUnassigningTag] = useState<NfcTagItem | null>(null);
  const [assigningTag, setAssigningTag] = useState<NfcTagItem | null>(null);
  const [selectedCheckpointToAssign, setSelectedCheckpointToAssign] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Tag form state
  const [newTagUid, setNewTagUid] = useState(
    '04:' + Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0')).join(':')
  );
  const [newTagType, setNewTagType] = useState<NfcTagItem['type']>('NFC NTAG213');
  const [newTagSiteId, setNewTagSiteId] = useState('site-a');
  const [newTagCheckpointId, setNewTagCheckpointId] = useState('CP-SDR-001');

  // Edit Tag form state
  const [editType, setEditType] = useState<NfcTagItem['type']>('NFC NTAG213');
  const [editCheckpointId, setEditCheckpointId] = useState('');
  const [editStatus, setEditStatus] = useState<NfcTagItem['status']>('Terkoneksi Normal');
  const [editEncryption, setEditEncryption] = useState<NfcTagItem['encryption']>('AES-128 Enkripsi Aktif');
  const [editSignalDbm, setEditSignalDbm] = useState(-60);

  const filteredTags = tags.filter((t) => {
    if (selectedSite !== 'all' && t.siteId !== selectedSite) return false;
    if (selectedTagType !== 'all' && t.type !== selectedTagType) return false;
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'unassigned') {
        if (t.linkedCheckpointId && t.linkedCheckpointId !== '-' && t.status !== 'Belum Ditautkan') return false;
      } else if (t.status !== selectedStatus) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        t.uid.toLowerCase().includes(q) ||
        t.linkedCheckpointName.toLowerCase().includes(q) ||
        t.linkedCheckpointId.toLowerCase().includes(q) ||
        t.siteName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleRegisterTag = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidNfcUid(newTagUid)) {
      alert('Format UID tidak valid! Gunakan format hex seperti 04:A2:3B:5F:8C:1D:9E');
      return;
    }

    const siteObj = SITES.find((s) => s.id === newTagSiteId) || SITES[1];
    const cpObj = checkpoints.find((c) => c.id === newTagCheckpointId) || checkpoints[0];

    const created: NfcTagItem = {
      uid: newTagUid.toUpperCase(),
      type: newTagType,
      siteId: newTagSiteId,
      siteName: siteObj.name.replace(/^Site [A-D] - /, ''),
      linkedCheckpointId: cpObj.id,
      linkedCheckpointName: cpObj.name,
      signalDbm: -60,
      batteryPercent: newTagType.includes('RFID') ? 95 : 'Pasif',
      encryption: 'AES-128 Enkripsi Aktif',
      installedDate: '24 Mei 2025',
      status: 'Terkoneksi Normal',
    };

    setTagsList((prev) => [created, ...prev]);
    setIsRegisterModalOpen(false);
    setToastMessage(`Tag ${created.uid} (${created.type}) berhasil didaftarkan dan dihubungkan ke ${cpObj.id}!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenEdit = (tag: NfcTagItem) => {
    setEditingTag(tag);
    setEditType(tag.type);
    setEditCheckpointId(tag.linkedCheckpointId);
    setEditStatus(tag.status);
    setEditEncryption(tag.encryption);
    setEditSignalDbm(tag.signalDbm);
  };

  const handleSaveEditTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag) return;

    const cpObj = checkpoints.find((c) => c.id === editCheckpointId);
    const siteObj = cpObj ? SITES.find((s) => s.id === cpObj.siteId) : SITES[1];

    setTagsList((prev) =>
      prev.map((t) => {
        if (t.uid === editingTag.uid) {
          return {
            ...t,
            type: editType,
            linkedCheckpointId: cpObj ? cpObj.id : '',
            linkedCheckpointName: cpObj ? cpObj.name : 'Belum Ditautkan (Unassigned)',
            siteId: cpObj ? cpObj.siteId : t.siteId,
            siteName: siteObj ? siteObj.name.replace(/^Site [A-D] - /, '') : t.siteName,
            status: editStatus,
            encryption: editEncryption,
            signalDbm: editSignalDbm,
            batteryPercent: editType.includes('RFID') ? (typeof t.batteryPercent === 'number' ? t.batteryPercent : 90) : 'Pasif',
          };
        }
        return t;
      })
    );

    const uid = editingTag.uid;
    setEditingTag(null);
    setToastMessage(`Konfigurasi Tag NFC/RFID ${uid} berhasil diperbarui!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeleteTag = () => {
    if (!deletingTag) return;
    const uid = deletingTag.uid;
    setTagsList((prev) => prev.filter((t) => t.uid !== uid));
    setDeletingTag(null);
    setToastMessage(`Tag ${uid} berhasil dihapus dari inventaris sistem.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  /**
   * Unassign handler for Tag
   */
  const handleConfirmUnassignTag = () => {
    if (!unassigningTag) return;

    const tag = unassigningTag;
    const previousCpName = tag.linkedCheckpointName;

    if (onUnassignTag) {
      onUnassignTag(tag.uid);
    } else {
      setTagsList((prev) =>
        prev.map((t) => {
          if (t.uid === tag.uid) {
            return {
              ...t,
              linkedCheckpointId: '',
              linkedCheckpointName: 'Belum Ditautkan (Unassigned)',
              status: 'Belum Ditautkan',
            };
          }
          return t;
        })
      );
    }

    setUnassigningTag(null);
    setToastMessage(`Tag NFC ${tag.uid} berhasil dilepas (unassign) dari ${previousCpName}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  /**
   * Assign handler for Tag
   */
  const handleConfirmAssignTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTag) return;

    const targetCpId = selectedCheckpointToAssign || checkpoints[0]?.id;
    const targetCp = checkpoints.find((c) => c.id === targetCpId);

    if (!targetCp) {
      alert('Pilih titik checkpoint target yang valid.');
      return;
    }

    if (onAssignTag) {
      onAssignTag(assigningTag.uid, targetCp.id);
    } else {
      setTagsList((prev) =>
        prev.map((t) => {
          if (t.uid === assigningTag.uid) {
            return {
              ...t,
              linkedCheckpointId: targetCp.id,
              linkedCheckpointName: targetCp.name,
              siteId: targetCp.siteId,
              siteName: targetCp.siteName,
              status: 'Terkoneksi Normal',
            };
          }
          return t;
        })
      );
    }

    setAssigningTag(null);
    setToastMessage(`Tag NFC ${assigningTag.uid} berhasil ditautkan ke ${targetCp.name}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const generateRandomUid = () => {
    setNewTagUid('04:' + Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0')).join(':'));
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 font-medium flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
            Manajemen Tag NFC &amp; RFID Checkpoint
          </h1>
          <p className="text-xs text-[#64748b] mt-1">
            Inventaris tag identifikasi fisik, pemantauan kualitas sinyal RF, unassign/assign tautan titik patroli, dan enkripsi anti-spoofing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] text-white rounded text-xs font-semibold hover:bg-[#1d4ed8] transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">add_card</span>
            <span>Daftarkan Tag Baru</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white border border-[#e2e8f0] rounded-lg p-3 shadow-xs">
        <div className="p-3 border-r border-[#f1f5f9] last:border-none">
          <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider block">Total Tag Terdaftar</span>
          <span className="text-xl font-bold text-[#0f172a] mt-1 block">{tags.length} Unit</span>
          <span className="text-[11px] text-[#64748b]">NFC NTAG + RFID UHF</span>
        </div>
        <div className="p-3 border-r border-[#f1f5f9] last:border-none">
          <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider block">Tertaut ke Checkpoint</span>
          <span className="text-xl font-bold text-emerald-600 mt-1 block">
            {tags.filter((t) => t.linkedCheckpointId && t.linkedCheckpointId !== '-' && t.status !== 'Belum Ditautkan').length} Unit
          </span>
          <span className="text-[11px] text-emerald-700 font-medium">Aktif terhubung</span>
        </div>
        <div className="p-3 border-r border-[#f1f5f9] last:border-none">
          <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider block">Tag Siap Ditautkan</span>
          <span className="text-xl font-bold text-amber-600 mt-1 block">
            {tags.filter((t) => !t.linkedCheckpointId || t.linkedCheckpointId === '-' || t.status === 'Belum Ditautkan').length} Unit
          </span>
          <span className="text-[11px] text-amber-700 font-medium">Unassigned / Siaga</span>
        </div>
        <div className="p-3">
          <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider block">Protokol Keamanan</span>
          <span className="text-xl font-bold text-[#2563eb] mt-1 block">ISO/IEC 14443</span>
          <span className="text-[11px] text-[#64748b]">7-Byte UID Enkripsi</span>
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
              placeholder="Cari UID tag, checkpoint, tipe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
            />
          </div>

          <select
            value={selectedTagType}
            onChange={(e) => setSelectedTagType(e.target.value)}
            className="px-2.5 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
          >
            <option value="all">Semua Tipe Chip</option>
            <option value="NFC NTAG213">NFC NTAG213</option>
            <option value="NTAG215">NTAG215</option>
            <option value="RFID UHF 860MHz">RFID UHF 860MHz</option>
            <option value="Mifare Classic 1K">Mifare Classic 1K</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
          >
            <option value="all">Semua Status Koneksi</option>
            <option value="Terkoneksi Normal">Terkoneksi Normal</option>
            <option value="Belum Ditautkan">Belum Ditautkan (Unassigned)</option>
            <option value="Siaga Kalibrasi">Siaga Kalibrasi</option>
            <option value="Sinyal Lemah">Sinyal Lemah</option>
            <option value="Tag Rusak">Tag Rusak</option>
          </select>
        </div>

        <div className="text-xs text-[#64748b]">
          Menampilkan <strong className="text-[#0f172a]">{filteredTags.length}</strong> unit tag terverifikasi
        </div>
      </div>

      {/* Tags Inventory Table with Unassign action */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[11px] font-semibold text-[#64748b] uppercase tracking-wider h-10">
                <th className="px-4 py-2">UID Tag Fisik</th>
                <th className="px-4 py-2">Tipe Chip Hardware</th>
                <th className="px-4 py-2">Titik Checkpoint Terhubung</th>
                <th className="px-4 py-2">Kekuatan Sinyal</th>
                <th className="px-4 py-2">Status Daya</th>
                <th className="px-4 py-2">Protokol Enkripsi</th>
                <th className="px-4 py-2 text-center">Status</th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9] text-xs">
              {filteredTags.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#94a3b8]">
                    Tidak ada tag yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredTags.map((tag) => {
                  const isAssigned = Boolean(
                    tag.linkedCheckpointId &&
                    tag.linkedCheckpointId !== '-' &&
                    !tag.linkedCheckpointName.includes('Belum') &&
                    tag.status !== 'Belum Ditautkan'
                  );

                  return (
                    <tr key={tag.uid} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-[#2563eb]">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-[#64748b]">contactless</span>
                          <span>{tag.uid}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[#0f172a]">{tag.type}</span>
                        <div className="text-[11px] text-[#64748b]">Pasang: {tag.installedDate}</div>
                      </td>
                      <td className="px-4 py-3">
                        {isAssigned ? (
                          <div>
                            <div className="font-semibold text-[#0f172a] flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm text-[#2563eb]">location_on</span>
                              <span>{tag.linkedCheckpointName}</span>
                            </div>
                            <div className="text-[11px] text-[#2563eb] font-mono">{tag.linkedCheckpointId} · {tag.siteName}</div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium">
                            <span className="material-symbols-outlined text-xs">link_off</span>
                            <span>Belum Ditautkan (Unassigned)</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        <span className={tag.signalDbm > -70 ? 'text-emerald-700 font-semibold' : 'text-amber-600 font-semibold'}>
                          {tag.signalDbm} dBm
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {tag.batteryPercent === 'Pasif' ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-[#f1f5f9] text-[#64748b] text-[11px]">
                            Pasif (NFC Powered)
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                            Baterai {tag.batteryPercent}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#334155]">
                        <div className="flex items-center gap-1 font-medium">
                          <span className="material-symbols-outlined text-sm text-[#2563eb]">lock</span>
                          <span>{tag.encryption}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            tag.status === 'Terkoneksi Normal'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tag.status === 'Belum Ditautkan'
                              ? 'bg-amber-50 text-amber-800 border border-amber-300'
                              : tag.status === 'Siaga Kalibrasi'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {tag.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDiagnosingTag(tag)}
                            title="Uji Diagnostik Tag"
                            className="px-2 py-1 rounded border border-[#e2e8f0] text-[#334155] hover:bg-[#f8fafc] text-[11px] font-medium flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs text-[#2563eb]">settings_suggest</span>
                            <span className="hidden sm:inline">Tes</span>
                          </button>

                          {/* Unassign vs Assign Checkpoint Button */}
                          {isAssigned ? (
                            <button
                              onClick={() => setUnassigningTag(tag)}
                              title="Lepas Hubungan Checkpoint (Unassign)"
                              className="px-2 py-1 rounded border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors text-[11px] font-semibold flex items-center gap-1 shadow-xs"
                            >
                              <span className="material-symbols-outlined text-xs">link_off</span>
                              <span className="hidden md:inline">Lepas</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setAssigningTag(tag);
                                setSelectedCheckpointToAssign(checkpoints[0]?.id || '');
                              }}
                              title="Tautkan ke Checkpoint"
                              className="px-2 py-1 rounded border border-blue-300 bg-blue-50 text-[#2563eb] hover:bg-blue-100 transition-colors text-[11px] font-semibold flex items-center gap-1 shadow-xs"
                            >
                              <span className="material-symbols-outlined text-xs">add_link</span>
                              <span className="hidden md:inline">Tautkan</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(tag)}
                            title="Edit Konfigurasi Tag"
                            className="p-1 text-[#64748b] hover:text-[#2563eb] rounded hover:bg-[#f1f5f9]"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => setDeletingTag(tag)}
                            title="Hapus Tag dari Sistem"
                            className="p-1 text-[#64748b] hover:text-rose-600 rounded hover:bg-[#f1f5f9]"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: UNASSIGN CHECKPOINT DARI TAG NFC */}
      {unassigningTag && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-amber-300 overflow-hidden animate-in fade-in">
            <div className="px-5 py-3.5 border-b border-amber-200 flex items-center justify-between bg-amber-50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-700 text-lg">link_off</span>
                <h3 className="text-sm font-bold text-amber-950">Konfirmasi Lepas Hubungan Checkpoint (Unassign)</h3>
              </div>
              <button onClick={() => setUnassigningTag(null)} className="text-[#94a3b8] hover:text-[#0f172a]">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-[#334155]">
                Apakah Anda yakin ingin melepas hubungan checkpoint dari Tag NFC berikut?
              </p>

              <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">UID Tag Hardware:</span>
                  <span className="font-mono font-bold text-[#2563eb]">{unassigningTag.uid}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">Tipe Chip:</span>
                  <span className="font-semibold text-[#0f172a]">{unassigningTag.type}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-[#e2e8f0]">
                  <span className="text-[#64748b]">Titik Checkpoint Terhubung:</span>
                  <div className="text-right">
                    <div className="font-bold text-[#0f172a]">{unassigningTag.linkedCheckpointName}</div>
                    <div className="text-[11px] text-[#2563eb] font-mono">{unassigningTag.linkedCheckpointId}</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px] space-y-1">
                <div className="font-semibold text-amber-800">Catatan Sistem:</div>
                <p>
                  Setelah dilepas, status Tag NFC ini akan menjadi <strong>Belum Ditautkan</strong> dan checkpoint tersebut tidak memiliki tag aktif hingga ditautkan kembali.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setUnassigningTag(null)}
                  className="px-3 py-1.5 rounded border border-[#e2e8f0] text-[#334155] font-medium hover:bg-[#f8fafc]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUnassignTag}
                  className="px-3.5 py-1.5 rounded bg-amber-600 text-white font-semibold hover:bg-amber-700 shadow-xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-xs">link_off</span>
                  <span>Lepas Checkpoint Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN TAG KE CHECKPOINT */}
      {assigningTag && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-[#cbd5e1] overflow-hidden animate-in fade-in">
            <div className="px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563eb] text-lg">add_link</span>
                <h3 className="text-sm font-bold text-[#0f172a]">Tautkan Tag ke Titik Checkpoint</h3>
              </div>
              <button onClick={() => setAssigningTag(null)} className="text-[#94a3b8] hover:text-[#0f172a]">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmAssignTag} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded space-y-1">
                <div className="text-[#64748b]">Tag NFC Terpilih:</div>
                <div className="font-mono font-bold text-[#2563eb] text-sm">{assigningTag.uid}</div>
                <div className="text-[11px] text-[#0f172a]">{assigningTag.type} · {assigningTag.encryption}</div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                  Pilih Titik Checkpoint Patroli
                </label>
                <select
                  value={selectedCheckpointToAssign}
                  onChange={(e) => setSelectedCheckpointToAssign(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                >
                  {checkpoints.map((cp) => (
                    <option key={cp.id} value={cp.id}>
                      {cp.id} - {cp.name} ({cp.siteName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setAssigningTag(null)}
                  className="px-3 py-1.5 rounded border border-[#e2e8f0] text-[#334155] font-medium hover:bg-[#f8fafc]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-[#2563eb] text-white font-semibold hover:bg-[#1d4ed8] shadow-xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-xs">link</span>
                  <span>Tautkan Checkpoint</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Diagnostik Tag */}
      {diagnosingTag && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-[#cbd5e1] overflow-hidden animate-in fade-in">
            <div className="px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563eb] text-lg">settings_suggest</span>
                <h3 className="text-sm font-bold text-[#0f172a]">Diagnostik Tag NFC / RFID</h3>
              </div>
              <button onClick={() => setDiagnosingTag(null)} className="text-[#94a3b8] hover:text-[#0f172a]">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">UID Hardware:</span>
                  <span className="font-mono font-bold text-[#0f172a]">{diagnosingTag.uid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Tipe Chip:</span>
                  <span className="font-semibold text-[#0f172a]">{diagnosingTag.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Checkpoint Terkait:</span>
                  <span className="text-[#2563eb] font-semibold">{diagnosingTag.linkedCheckpointName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Sinyal Terukur:</span>
                  <span className="font-mono font-semibold text-emerald-600">{diagnosingTag.signalDbm} dBm (Stabil)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Integritas Kriptografi:</span>
                  <span className="text-emerald-700 font-semibold">PASS (Checksum Cocok)</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-[11px]">
                Chip beroperasi normal tanpa tanda kerusakan fisik atau kloning ilegal.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setDiagnosingTag(null)}
                  className="px-3 py-1.5 rounded bg-[#2563eb] text-white font-semibold hover:bg-[#1d4ed8]"
                >
                  Tutup Diagnostik
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Tag NFC / RFID */}
      {editingTag && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-[#cbd5e1] overflow-hidden animate-in fade-in">
            <div className="px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563eb] text-lg">edit</span>
                <h3 className="text-sm font-bold text-[#0f172a]">Edit Konfigurasi Tag NFC/RFID</h3>
              </div>
              <button onClick={() => setEditingTag(null)} className="text-[#94a3b8] hover:text-[#0f172a]">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditTag} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                  UID Tag Fisik (Read-Only)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingTag.uid}
                  className="w-full px-3 py-2 bg-[#f1f5f9] border border-[#cbd5e1] rounded font-mono text-[#475569] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                  Tipe Chip Hardware
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                >
                  <option value="NFC NTAG213">NFC NTAG213 (13.56 MHz Standard)</option>
                  <option value="NTAG215">NTAG215 (504 Bytes)</option>
                  <option value="RFID UHF 860MHz">RFID UHF 860MHz (Long Range)</option>
                  <option value="Mifare Classic 1K">Mifare Classic 1K</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-[#334155] uppercase">
                    Titik Checkpoint Terhubung
                  </label>
                  {editingTag.linkedCheckpointId && (
                    <button
                      type="button"
                      onClick={() => setEditCheckpointId('')}
                      className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <span className="material-symbols-outlined text-xs">link_off</span>
                      <span>Kosongkan (Unassign)</span>
                    </button>
                  )}
                </div>
                <select
                  value={editCheckpointId}
                  onChange={(e) => setEditCheckpointId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                >
                  <option value="">-- Belum Ditautkan (Unassigned) --</option>
                  {checkpoints.map((cp) => (
                    <option key={cp.id} value={cp.id}>
                      {cp.id} - {cp.name} ({cp.siteName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                    Status Koneksi
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                  >
                    <option value="Terkoneksi Normal">Terkoneksi Normal</option>
                    <option value="Belum Ditautkan">Belum Ditautkan</option>
                    <option value="Siaga Kalibrasi">Siaga Kalibrasi</option>
                    <option value="Sinyal Lemah">Sinyal Lemah</option>
                    <option value="Tag Rusak">Tag Rusak</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                    Sinyal (dBm)
                  </label>
                  <input
                    type="number"
                    value={editSignalDbm}
                    onChange={(e) => setEditSignalDbm(parseInt(e.target.value, 10) || -60)}
                    className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] font-mono focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                  Protokol Keamanan Enkripsi
                </label>
                <select
                  value={editEncryption}
                  onChange={(e) => setEditEncryption(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                >
                  <option value="AES-128 Enkripsi Aktif">AES-128 Enkripsi Aktif (Anti Kloning)</option>
                  <option value="Standard Read-Only">Standard Read-Only</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setEditingTag(null)}
                  className="px-3 py-1.5 rounded border border-[#e2e8f0] text-[#334155] font-medium hover:bg-[#f8fafc]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-[#2563eb] text-white font-semibold hover:bg-[#1d4ed8] shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Hapus Tag Confirmation */}
      {deletingTag && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-[#cbd5e1] overflow-hidden animate-in fade-in">
            <div className="px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between bg-rose-50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-600 text-lg">warning</span>
                <h3 className="text-sm font-bold text-rose-900">Konfirmasi Hapus Tag NFC/RFID</h3>
              </div>
              <button onClick={() => setDeletingTag(null)} className="text-[#94a3b8] hover:text-[#0f172a]">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-[#334155]">
                Apakah Anda yakin ingin menghapus tag fisik dengan UID berikut dari inventaris sistem?
              </p>

              <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded space-y-1">
                <div className="font-mono font-bold text-[#2563eb] text-sm">{deletingTag.uid}</div>
                <div className="text-[11px] text-[#0f172a] font-semibold">{deletingTag.type}</div>
                <div className="text-[11px] text-[#64748b]">
                  Terpasang di: <strong>{deletingTag.linkedCheckpointName}</strong> ({deletingTag.siteName})
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px]">
                <strong>Peringatan:</strong> Menghapus tag akan memutus verifikasi patroli otomatis di checkpoint terkait sampai tag pengganti didaftarkan.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setDeletingTag(null)}
                  className="px-3 py-1.5 rounded border border-[#e2e8f0] text-[#334155] font-medium hover:bg-[#f8fafc]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTag}
                  className="px-3 py-1.5 rounded bg-rose-600 text-white font-semibold hover:bg-rose-700 shadow-xs"
                >
                  Hapus Tag Permanen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Daftarkan Tag Baru */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-[#cbd5e1] overflow-hidden animate-in fade-in">
            <div className="px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563eb] text-lg">add_card</span>
                <h3 className="text-sm font-bold text-[#0f172a]">Daftarkan Tag NFC / RFID Baru</h3>
              </div>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-[#94a3b8] hover:text-[#0f172a]">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleRegisterTag} className="p-5 space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-[#334155] uppercase">
                    UID Tag Hardware
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomUid}
                    className="text-[10px] text-[#2563eb] hover:underline font-semibold"
                  >
                    Generate Random UID
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="04:A2:3B:5F:8C:1D:9E"
                  value={newTagUid}
                  onChange={(e) => setNewTagUid(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded font-mono text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                  Tipe Chip / Frekuensi
                </label>
                <select
                  value={newTagType}
                  onChange={(e) => setNewTagType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                >
                  <option value="NFC NTAG213">NFC NTAG213 (13.56 MHz - Standard)</option>
                  <option value="NTAG215">NTAG215 (High Memory 504 Bytes)</option>
                  <option value="RFID UHF 860MHz">RFID UHF 860MHz (Long Range 5-10m)</option>
                  <option value="Mifare Classic 1K">Mifare Classic 1K (S50 Compatible)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                  Site / Wilayah
                </label>
                <select
                  value={newTagSiteId}
                  onChange={(e) => setNewTagSiteId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
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
                  Hubungkan ke Checkpoint
                </label>
                <select
                  value={newTagCheckpointId}
                  onChange={(e) => setNewTagCheckpointId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                >
                  {checkpoints.map((cp) => (
                    <option key={cp.id} value={cp.id}>
                      {cp.id} - {cp.name} ({cp.siteName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-[#e2e8f0] text-[#334155] font-medium hover:bg-[#f8fafc]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-[#2563eb] text-white font-semibold hover:bg-[#1d4ed8] shadow-xs"
                >
                  Daftarkan &amp; Kunci AES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
