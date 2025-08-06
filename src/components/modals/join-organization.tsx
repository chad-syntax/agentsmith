'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import { useRouter } from 'next/navigation';
import { routes } from '@/utils/routes';
import { joinOrganization } from '@/app/actions/organization';

type JoinOrganizationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function JoinOrganizationModal({ open, onOpenChange }: JoinOrganizationModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const router = useRouter();

  const handleChange = (value: string) => {
    setErrors({});

    setInviteCode(value.toUpperCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await joinOrganization(inviteCode);
      if (result.success) {
        router.push(routes.studio.organization(result.data));
      } else if (!result.success) {
        setErrors({
          'join-organization': [result.message || 'Failed to join organization'],
        });
        setLoading(false);
      } else if (result.errors) {
        setErrors(result.errors);
        setLoading(false);
      } else {
        setErrors({
          'join-organization': ['Failed to join organization'],
        });
        setLoading(false);
      }
    } catch (error: any) {
      setErrors({
        'join-organization': [error?.message || 'Failed to join organization'],
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Organization</DialogTitle>
        </DialogHeader>
        <DialogDescription>Join an organization by entering the invite code.</DialogDescription>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <InputOTP
              id="invite-code"
              maxLength={6}
              value={inviteCode}
              onChange={handleChange}
              pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
              autoFocus
              disabled={loading}
              containerClassName="mb-2 justify-center "
            >
              <InputOTPGroup>
                {[...Array(6)].map((_, idx) => (
                  <InputOTPSlot
                    className="text-md p-4 2xs:text-xl 2xs:p-6 md:text-3xl md:p-8"
                    key={idx}
                    index={idx}
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <div className="text-muted-foreground text-sm mb-2">
            Your Organization admin can find the invite code on their Organization Page. They can
            also send you an invite link that you can click to join their organization.
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || inviteCode.length !== 6}>
              {loading ? 'Joining...' : 'Join'}
            </Button>
          </DialogFooter>
          {errors && (
            <div className="text-destructive text-sm">
              {Object.entries(errors).map(([key, value]) => (
                <div key={key}>{value}</div>
              ))}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
