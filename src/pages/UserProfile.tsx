import React, { useEffect, useState } from 'react';

interface UserProfileData {
  email: string;
  username: string;
  role: string;
  isVerified: boolean;
}

const UserProfile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/users/me', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setProfile(data);
        setUsername(data.username || '');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div className='text-red-600'>{error}</div>;
  if (!profile) return <div>No profile data found.</div>;

  return (
    <div className='max-w-xl mx-auto bg-white p-8 rounded shadow'>
      <h1 className='text-2xl font-bold mb-6'>User Profile</h1>
      <form onSubmit={handleSave} className='space-y-4'>
        <div>
          <label className='block font-medium'>Email</label>
          <input
            type='email'
            value={profile.email}
            disabled
            className='w-full border rounded px-3 py-2 bg-gray-100'
          />
        </div>
        <div>
          <label className='block font-medium'>Username</label>
          <input
            type='text'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className='w-full border rounded px-3 py-2'
          />
        </div>
        <div>
          <label className='block font-medium'>Role</label>
          <input
            type='text'
            value={profile.role}
            disabled
            className='w-full border rounded px-3 py-2 bg-gray-100'
          />
        </div>
        <div>
          <label className='block font-medium'>Verified</label>
          <input
            type='text'
            value={profile.isVerified ? 'Yes' : 'No'}
            disabled
            className='w-full border rounded px-3 py-2 bg-gray-100'
          />
        </div>
        <button
          type='submit'
          className='bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700'
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {success && <div className='text-green-600'>Profile updated!</div>}
        {error && <div className='text-red-600'>{error}</div>}
      </form>
    </div>
  );
};

export default UserProfile;
