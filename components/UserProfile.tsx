import React, { useState, useRef, useEffect } from 'react';
import {
  X, User, Mail, Shield, Cpu, Clock, Leaf,
  Edit2, Check, Camera, MapPin, Phone, Building2, Loader2, Download, Smartphone
} from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../services/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: import('firebase/auth').User | null;
  installPromptAvailable: boolean;
  onInstallApp: () => void;
}

export const UserProfile: React.FC<Props> = ({
  isOpen, onClose, user,
  installPromptAvailable, onInstallApp
}) => {
  const [editingName, setEditingName]   = useState(false);
  const [displayName, setDisplayName]   = useState('');
  const [organization, setOrganization] = useState('Polyhouse Farm');
  const [phone, setPhone]               = useState('');
  const [location, setLocation]         = useState('');
  const [editingOrg, setEditingOrg]     = useState(false);
  const [savingName, setSavingName]     = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoURL, setPhotoURL]         = useState('');
  const [toast, setToast]               = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local state with user on open
  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.displayName ?? '');
      setPhotoURL(user.photoURL ?? '');
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── Save display name to Firebase Auth ────────────────────────
  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setSavingName(true);
    try {
      await updateProfile(auth.currentUser!, { displayName: displayName.trim() });
      showToast('✅ Name updated successfully!');
      setEditingName(false);
    } catch (e) {
      showToast('❌ Failed to update name. Try again.');
    } finally {
      setSavingName(false);
    }
  };

  // ── Upload photo to Firebase Storage, then update Auth profile ─
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    // Validate type & size
    if (!file.type.startsWith('image/')) { showToast('❌ Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024)    { showToast('❌ Image must be under 5 MB.');    return; }

    setUploadingPhoto(true);
    try {
      const photoRef = storageRef(storage, `profile-photos/${auth.currentUser.uid}`);
      await uploadBytes(photoRef, file, { contentType: file.type });
      const url = await getDownloadURL(photoRef);
      await updateProfile(auth.currentUser, { photoURL: url });
      setPhotoURL(url);
      showToast('✅ Profile photo updated!');
    } catch (e) {
      showToast('❌ Upload failed. Check Firebase Storage rules.');
    } finally {
      setUploadingPhoto(false);
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const joined = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN',
        { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  const lastLogin = user.metadata.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleDateString('en-IN',
        { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Unknown';


  const initials = (user.displayName || user.email || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">

      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoChange}
      />

      {/* Toast message */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[400] bg-slate-800 text-white px-5 py-3 rounded-2xl text-sm font-medium shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          {toast}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-700 flex flex-col">

        {/* ── Header Banner ── */}
        <div className="relative h-28 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 shrink-0">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full hover:bg-white/20 transition-colors">
            <X size={20} />
          </button>
          <div className="absolute -bottom-10 left-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 p-1 shadow-xl ring-2 ring-emerald-500/30">
                {uploadingPhoto ? (
                  <div className="w-full h-full rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                    <Loader2 size={24} className="text-emerald-500 animate-spin" />
                  </div>
                ) : photoURL ? (
                  <img src={photoURL} alt="Profile" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <div className="w-full h-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-black">
                    {initials}
                  </div>
                )}
              </div>
              {/* Camera button triggers file input */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-md transition-colors disabled:opacity-50"
              >
                <Camera size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 mt-12 px-6 pb-6 space-y-5">

          {/* ── Name & Email ── */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              {editingName ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                    className="flex-1 font-bold text-xl bg-gray-50 dark:bg-slate-700 border border-emerald-400 rounded-lg px-3 py-1 outline-none dark:text-white"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="p-1.5 bg-emerald-500 text-white rounded-lg disabled:opacity-50"
                  >
                    {savingName ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  </button>
                  <button onClick={() => { setEditingName(false); setDisplayName(user.displayName ?? ''); }} className="p-1.5 bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300 rounded-lg">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-black text-gray-800 dark:text-white">
                    {user.displayName || 'Set your name'}
                  </h2>
                  <button
                    onClick={() => { setDisplayName(user.displayName ?? ''); setEditingName(true); }}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                </>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Mail size={13} /> {user.email}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              💡 Click the pencil to edit your name. Click the camera to change your photo.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                <Shield size={11} /> Google Verified
              </span>
              {user.emailVerified && (
                <span className="flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full">
                  <Check size={11} /> Email Verified
                </span>
              )}
            </div>
          </div>

          {/* ── Farm / Organization ── */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Farm Details</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl p-3">
                <Building2 size={16} className="text-gray-400 shrink-0" />
                {editingOrg ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      value={organization}
                      onChange={e => setOrganization(e.target.value)}
                      className="flex-1 text-sm bg-white dark:bg-slate-700 border border-emerald-400 rounded-lg px-2 py-1 outline-none dark:text-white"
                      autoFocus
                    />
                    <button onClick={() => setEditingOrg(false)} className="p-1 bg-emerald-500 text-white rounded-lg"><Check size={12} /></button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between flex-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{organization}</span>
                    <button onClick={() => setEditingOrg(true)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"><Edit2 size={12} /></button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl p-3">
                <MapPin size={16} className="text-gray-400 shrink-0" />
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Enter farm location..." className="flex-1 text-sm bg-transparent outline-none dark:text-gray-300 placeholder-gray-400" />
              </div>
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl p-3">
                <Phone size={16} className="text-gray-400 shrink-0" />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter phone number..." className="flex-1 text-sm bg-transparent outline-none dark:text-gray-300 placeholder-gray-400" />
              </div>
            </div>
          </section>

          {/* ── Account Info ── */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Account Info</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Member Since',  value: joined,                        icon: <User size={14} /> },
                { label: 'Last Login',    value: lastLogin,                     icon: <Clock size={14} /> },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                    {item.icon}
                    <span className="text-[10px] uppercase font-bold tracking-wider">{item.label}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          
          {/* ── App Installation ── */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">App & Shortcut</h3>
            <button 
              onClick={() => {
                if (installPromptAvailable) {
                  onInstallApp();
                } else {
                  showToast('💡 To download: Click your browser menu (⋮ or ⎙) and select "Add to Home Screen" or "Install App".');
                }
              }}
              className="w-full flex items-center gap-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl p-4 shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-1 group"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-colors">
                <Download size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Download Webapp</p>
                <p className="text-[10px] text-emerald-100 font-medium">
                  {installPromptAvailable ? 'Install PolyGuard for offline access' : 'Add shortcut to your home screen'}
                </p>
              </div>
              <Smartphone size={16} className="ml-auto opacity-50" />
            </button>
            {!installPromptAvailable && (
              <p className="text-[10px] text-gray-400 mt-2 italic px-1">
                Note: Offline caching is already active in your browser.
              </p>
            )}
          </section>

        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-5 pt-3 border-t border-gray-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <Leaf size={12} className="text-emerald-500" />
              <span className="font-bold text-emerald-600 dark:text-emerald-400">PolyGuard IoT Core</span>
              <span>— Automated Smart Polyhouse</span>
            </div>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
