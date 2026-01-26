import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Button } from '../../../../../components/ui/Button';
import { Card } from '../../../../../components/ui/Card';
import { Input } from '../../../../../components/ui/Input';

export default function PricingTiers() {
  const router = useRouter();
  const { id } = router.query;
  const [eventTitle, setEventTitle] = useState('');
  const [tier1Enabled, setTier1Enabled] = useState(false);
  const [tier1Name, setTier1Name] = useState('Tier 1');
  const [tier1Price, setTier1Price] = useState('');
  
  const [tier2Enabled, setTier2Enabled] = useState(false);
  const [tier2Name, setTier2Name] = useState('Tier 2');
  const [tier2Price, setTier2Price] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resolveEventId = () => {
    if (!id) return '';
    return Array.isArray(id) ? id[0] : id;
  };

  const getOrganizerSecret = () => {
    // Support both legacy and current storage keys
    return (
      localStorage.getItem('organizerSecret') ||
      localStorage.getItem('organizer_secret') ||
      ''
    );
  };

  useEffect(() => {
    const eventId = resolveEventId();
    if (!eventId) return;
    fetchEventData();
  }, [id]);

  const fetchEventData = async () => {
    try {
      const secret = getOrganizerSecret();
      const eventId = resolveEventId();

      if (!secret) {
        setError('Organizer secret missing. Please login via the organizer dashboard and try again.');
        return;
      }

      const response = await fetch(`/api/organizer/event-tiers?eventId=${encodeURIComponent(eventId)}`, {
        headers: {
          'x-organizer-secret': secret || '',
        },
      });
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch event data');
      }
      
      const data = await response.json();
      const event = data.event || {};
      setEventTitle(event.title || '');
      setTier1Enabled(Boolean(event.tier_1_enabled));
      setTier1Name(event.tier_1_name || 'Tier 1');
      setTier1Price(event.tier_1_price != null ? String(event.tier_1_price) : '');
      
      setTier2Enabled(Boolean(event.tier_2_enabled));
      setTier2Name(event.tier_2_name || 'Tier 2');
      setTier2Price(event.tier_2_price != null ? String(event.tier_2_price) : '');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load event pricing configuration';
      setError(message);
      console.error('Pricing tiers load error:', err);
    }
  };

  const savePricingTiers = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Validate that if tiers are enabled, they have prices
      if (tier1Enabled && (!tier1Price || isNaN(Number(tier1Price)))) {
        throw new Error('Tier 1 price is required and must be a valid number');
      }
      if (tier2Enabled && (!tier2Price || isNaN(Number(tier2Price)))) {
        throw new Error('Tier 2 price is required and must be a valid number');
      }
      
      // At least one tier must be enabled
      if (!tier1Enabled && !tier2Enabled) {
        throw new Error('At least one pricing tier must be enabled');
      }

      const secret = getOrganizerSecret();
      const eventId = resolveEventId();
      const response = await fetch('/api/organizer/event-tiers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organizer-secret': secret || '',
        },
        body: JSON.stringify({
          eventId,
          tier1Enabled,
          tier1Name,
          tier1Price: tier1Enabled ? Number(tier1Price) : null,
          tier2Enabled,
          tier2Name,
          tier2Price: tier2Enabled ? Number(tier2Price) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save pricing tiers');
      }

      setSuccess('Pricing tiers saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!id) {
    return <div className="text-white p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-slate-900 to-slate-800">
      <Head>
        <title>Pricing Tiers - {eventTitle}</title>
      </Head>
      
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-violet-400 hover:text-violet-300 text-sm mb-4">
            ← Back to organizer dashboard
          </button>
          <h1 className="text-3xl font-bold text-white">Pricing Tiers Configuration</h1>
          <p className="text-slate-400 mt-1">{eventTitle}</p>
        </div>

        {error && (
          <Card className="p-4 bg-red-500/10 border-red-500/50 mb-4">
            <p className="text-red-300">{error}</p>
          </Card>
        )}

        {success && (
          <Card className="p-4 bg-green-500/10 border-green-500/50 mb-4">
            <p className="text-green-300">{success}</p>
          </Card>
        )}

        <div className="space-y-6">
          {/* Tier 1 */}
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="tier1Enabled"
                checked={tier1Enabled}
                onChange={(e) => setTier1Enabled(e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-violet-500"
              />
              <label htmlFor="tier1Enabled" className="text-lg font-semibold text-white cursor-pointer">
                Enable Pricing Tier 1
              </label>
            </div>

            {tier1Enabled && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Tier Name</label>
                  <Input
                    value={tier1Name}
                    onChange={(e) => setTier1Name(e.target.value)}
                    placeholder="e.g., Early Bird, Member, Basic"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Price (₹)</label>
                  <Input
                    type="number"
                    value={tier1Price}
                    onChange={(e) => setTier1Price(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Tier 2 */}
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="tier2Enabled"
                checked={tier2Enabled}
                onChange={(e) => setTier2Enabled(e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-violet-500"
              />
              <label htmlFor="tier2Enabled" className="text-lg font-semibold text-white cursor-pointer">
                Enable Pricing Tier 2
              </label>
            </div>

            {tier2Enabled && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Tier Name</label>
                  <Input
                    value={tier2Name}
                    onChange={(e) => setTier2Name(e.target.value)}
                    placeholder="e.g., VIP, Non-Member, Premium"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Price (₹)</label>
                  <Input
                    type="number"
                    value={tier2Price}
                    onChange={(e) => setTier2Price(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Summary */}
          {(tier1Enabled || tier2Enabled) && (
            <Card className="p-4 bg-violet-500/10 border-violet-500/30">
              <p className="text-sm text-slate-300 mb-2">
                <strong>Registration Preview:</strong> Users will see
                {tier1Enabled && <span> {tier1Name} (₹{tier1Price})</span>}
                {tier1Enabled && tier2Enabled && <span> or </span>}
                {tier2Enabled && <span> {tier2Name} (₹{tier2Price})</span>}
              </p>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex gap-2">
            <Button
              onClick={savePricingTiers}
              isLoading={loading}
              variant="primary"
              className="flex-1"
            >
              Save Pricing Configuration
            </Button>
            <Button
              onClick={() => router.back()}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
