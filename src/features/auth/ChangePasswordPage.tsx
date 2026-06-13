import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button, Field, Icon, Logo, PasswordInput, useToast } from '@/components/ui';
import {
  changePassword,
  fetchCurrentUser,
  logout,
  selectCurrentUser,
} from '@/features/auth/authSlice';
import { paths } from '@/routes/paths';

/**
 * Forced password reset shown on a provisioned user's first sign-in. The route
 * guard sends anyone with ``mustChangePassword`` here; once it's cleared the
 * page redirects back into the app.
 */
export function ChangePasswordPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAppSelector(selectCurrentUser);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) void dispatch(fetchCurrentUser());
  }, [user, dispatch]);

  const error = useMemo(() => {
    if (newPassword.length > 0 && newPassword.length < 8) return 'Yeni parola en az 8 karakter olmalı.';
    if (confirm.length > 0 && confirm !== newPassword) return 'Parolalar eşleşmiyor.';
    if (newPassword.length >= 8 && newPassword === currentPassword)
      return 'Yeni parola mevcut parolayla aynı olamaz.';
    return null;
  }, [currentPassword, newPassword, confirm]);

  const ready =
    currentPassword.length > 0 && newPassword.length >= 8 && confirm === newPassword && !error;

  // Loaded and no longer required (incl. right after a successful reset).
  if (user && !user.mustChangePassword) {
    return <Navigate to={paths.overview} replace />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready || submitting) return;
    setSubmitting(true);
    const result = await dispatch(changePassword({ currentPassword, newPassword }));
    setSubmitting(false);
    if (changePassword.fulfilled.match(result)) {
      toast('Parolanız güncellendi', 'checkCircle');
      navigate(paths.overview, { replace: true });
    } else {
      toast((result.payload as string) || 'Parola güncellenemedi', 'xCircle');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6 py-12">
      <form onSubmit={submit} className="anim-fade-up w-full max-w-[420px]">
        <div className="mb-7 flex justify-center">
          <Logo height={34} />
        </div>

        <div className="card p-7">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Icon name="lock" size={22} />
            </div>
            <div>
              <h1 className="m-0 text-[20px] font-bold tracking-[-0.01em]">Parolanızı belirleyin</h1>
              <p className="mt-1 text-[13.5px] leading-[1.5] text-ink-3">
                Hesabınıza ilk girişiniz. Devam etmeden önce kendi parolanızı oluşturun.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <Field label="Mevcut (geçici) parola" required>
              <PasswordInput
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>
            <Field label="Yeni parola" required hint="En az 8 karakter.">
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
            <Field label="Yeni parola (tekrar)" required error={error ?? undefined}>
              <PasswordInput
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>

            <Button type="submit" variant="primary" size="lg" block disabled={!ready || submitting} className="mt-1">
              {submitting ? (
                <>
                  <span className="spinner" />
                  Kaydediliyor…
                </>
              ) : (
                <>
                  Parolayı kaydet
                  <Icon name="arrowR" size={18} />
                </>
              )}
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            dispatch(logout());
            navigate(paths.login, { replace: true });
          }}
          className="mx-auto mt-5 flex items-center gap-1.5 text-[13px] font-medium text-ink-3 hover:text-ink-2"
        >
          <Icon name="logout" size={15} />
          Çıkış yap
        </button>
      </form>
    </div>
  );
}
