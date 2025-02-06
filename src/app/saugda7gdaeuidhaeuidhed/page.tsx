export default function AdminPage() {
  // ... rest of the component code

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        await supabase.auth.setSession(data.session);
        window.location.href = '/saugda7gdaeuidhaeuidhed/questions';
      }
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Error logging in');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of the component code
} 