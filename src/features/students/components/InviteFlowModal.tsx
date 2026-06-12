import { useState } from 'react';
import type { ApiError } from '@/api/axiosClient';
import { Button, Field, Icon, Input, Modal, Select, useToast } from '@/components/ui';
import { COURSES, LANGUAGES } from '@/constants/options';
import { welcomeLink } from '@/routes/paths';
import { digitsOnly } from '@/utils/format';
import { isValidPhone, isValidTckn } from '@/utils/validation';
import { invitesApi } from '../invitesApi';

interface InviteFlowModalProps {
  open: boolean;
  onClose: () => void;
  onPreview: () => void;
}

/** Two-step flow: collect minimal info, then generate and share an invite link. */
export function InviteFlowModal({ open, onClose, onPreview }: InviteFlowModalProps) {
  const toast = useToast();
  const [step, setStep] = useState<0 | 1>(0);
  const [tckn, setTckn] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [lang, setLang] = useState<string>(LANGUAGES[0]);
  const [course, setCourse] = useState<string>('Hafta İçi Akşam');
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  const link = `app.powerakademi.com${welcomeLink(tckn || '54091123456')}`;
  const valid = isValidTckn(tckn) && isValidPhone(phone);

  const reset = () => {
    setStep(0);
    setTckn('');
    setPhone('');
    setName('');
    setCopied(false);
    setCreating(false);
  };

  const generate = async () => {
    setCreating(true);
    try {
      await invitesApi.create({ tckn, phone, name: name || undefined, lang, course });
      setStep(1);
    } catch (error) {
      toast((error as ApiError)?.message ?? 'Davet oluşturulamadı, tekrar deneyin.', 'xCircle');
    } finally {
      setCreating(false);
    }
  };

  const close = () => {
    reset();
    onClose();
  };

  const copy = () => {
    navigator.clipboard?.writeText(`https://${link}`).catch(() => {});
    setCopied(true);
    toast('Link kopyalandı', 'copy');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal open={open} onClose={close} width={540}>
      {step === 0 ? (
        <div className="anim-fade-in">
          <div className="mb-1 flex items-start justify-between">
            <div className="flex flex-col">
              <span className="kicker">DAVET LİNKİ</span>
              <h2 className="mt-1 text-[22px] font-bold tracking-[-0.02em]">
                Kişiye özel form oluştur
              </h2>
            </div>
            <Button variant="quiet" onClick={close} className="p-2" aria-label="Kapat">
              <Icon name="x" size={20} />
            </Button>
          </div>
          <p className="mt-1.5 mb-[22px] text-[14.5px] text-ink-2">
            TCKN ve telefon ile öğrenciye özel bir hoşgeldin formu üretilir. Ön seçtiğin dil ve kur
            forma hazır gelir.
          </p>

          <div className="flex flex-col gap-4">
            <div className="invite-grid grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="T.C. Kimlik No" icon="id" required>
                <Input
                  value={tckn}
                  onChange={(event) => setTckn(digitsOnly(event.target.value).slice(0, 11))}
                  placeholder="11 haneli"
                  inputMode="numeric"
                  className="font-mono"
                />
              </Field>
              <Field label="Telefon" icon="phone" required>
                <Input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="0 (5__) ___ __ __"
                  inputMode="tel"
                />
              </Field>
            </div>
            <Field
              label="Ad Soyad"
              icon="user"
              hint="Opsiyonel — bilinmiyorsa öğrenci formda girer"
            >
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Örn. Aylin Şahin"
              />
            </Field>
            <div className="invite-grid grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Ön seçim — Dil" icon="globe">
                <Select value={lang} onChange={(event) => setLang(event.target.value)}>
                  {LANGUAGES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Ön seçim — Kur" icon="book">
                <Select value={course} onChange={(event) => setCourse(event.target.value)}>
                  {COURSES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          <div className="mt-[26px] flex items-center gap-3">
            <Button variant="ghost" block onClick={close}>
              Vazgeç
            </Button>
            <Button variant="primary" block disabled={!valid || creating} onClick={generate}>
              <Icon name="sparkle" size={17} />
              {creating ? 'Oluşturuluyor…' : 'Link Oluştur'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="anim-scale-in text-center">
          <div className="mx-auto mt-1 mb-4 flex size-16 items-center justify-center rounded-[18px] bg-ok-soft text-ok">
            <Icon name="checkCircle" size={34} />
          </div>
          <h2 className="m-0 text-[22px] font-bold tracking-[-0.02em]">Davet linki hazır!</h2>
          <p className="mt-2 mb-[22px] text-[14.5px] text-ink-2">
            {name || 'Öğrenci'} için kişiye özel link oluşturuldu. Aşağıdan paylaş.
          </p>

          <div className="mb-[18px] flex items-center gap-2 rounded-xl border border-dashed border-line-strong bg-bg-2 px-3.5 py-3">
            <Icon name="link" size={17} className="shrink-0 text-accent" />
            <span className="flex-1 truncate text-left font-mono text-[13px]">{link}</span>
            <Button variant="soft" onClick={copy} className="px-3 py-2 text-[13px]">
              <Icon name={copied ? 'check' : 'copy'} size={15} />
              {copied ? 'Kopyalandı' : 'Kopyala'}
            </Button>
          </div>

          <div className="mb-3 flex items-center gap-3">
            <Button
              block
              onClick={() => toast('WhatsApp ile gönderildi', 'whatsapp')}
              className="bg-[#25D366] text-white"
            >
              <Icon name="whatsapp" size={18} />
              WhatsApp
            </Button>
            <Button variant="ghost" block onClick={() => toast('SMS gönderildi', 'sms')}>
              <Icon name="sms" size={17} />
              SMS Gönder
            </Button>
          </div>

          <Button variant="quiet" block onClick={onPreview} className="text-accent">
            <Icon name="eye" size={17} />
            Öğrenci ne görecek? Önizle
          </Button>

          <div className="divider my-[18px]" />
          <Button variant="ghost" block onClick={close}>
            Kapat
          </Button>
        </div>
      )}
    </Modal>
  );
}
