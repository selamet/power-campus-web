import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Field, Icon, Input, Logo, Select, Steps, Textarea } from '@/components/ui';
import {
  CITIES,
  COURSES,
  GOALS,
  LANGUAGES,
  LEVELS,
  PAYMENT_PLANS,
  PAY_METHODS,
} from '@/constants/options';
import { useStudentActions } from '@/features/students/useStudentActions';
import { paths } from '@/routes/paths';
import type { NewStudentInput } from '@/types/domain';
import { formatMoney } from '@/utils/format';

const FORM_STEPS = ['Kişisel', 'Eğitim', 'İletişim', 'Finans'] as const;

interface FormState {
  name: string;
  tckn: string;
  birth: string;
  gender: string;
  city: string;
  addr: string;
  email: string;
  phone: string;
  lang: string;
  level: string;
  goal: string;
  course: string;
  start: string;
  cName: string;
  cRelation: string;
  cPhone: string;
  fee: string;
  plan: string;
  payMethod: string;
  firstDate: string;
  discount: string;
}

const initialForm: FormState = {
  name: '',
  tckn: '',
  birth: '',
  gender: '',
  city: 'İstanbul',
  addr: '',
  email: '',
  phone: '',
  lang: LANGUAGES[0],
  level: LEVELS[0],
  goal: GOALS[0],
  course: COURSES[0],
  start: '',
  cName: '',
  cRelation: 'Anne',
  cPhone: '',
  fee: '',
  plan: 'Peşin',
  payMethod: PAY_METHODS[0],
  firstDate: '',
  discount: '0',
};

const GRID = 'form-grid grid grid-cols-1 gap-4 sm:grid-cols-2';

export function RegistrationFormPage() {
  const navigate = useNavigate();
  const { create } = useStudentActions();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);

  const update =
    (key: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const patch = (partial: Partial<FormState>) => setForm((prev) => ({ ...prev, ...partial }));

  const isLast = step === FORM_STEPS.length - 1;
  const next = () => setStep((s) => Math.min(s + 1, FORM_STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const close = () => navigate(paths.overview);

  const save = () => {
    const fee = Number(form.fee) || 18500;
    const newStudent: NewStudentInput = {
      name: form.name || 'Yeni Öğrenci',
      lang: form.lang,
      level: form.level,
      course: form.course,
      status: 'active',
      phone: form.phone || '0500 000 00 00',
      start: form.start || '2026-06-15',
      fee,
      paid: form.plan === 'Peşin' ? fee : 0,
      plan: form.plan,
      next: form.plan === 'Peşin' ? null : form.firstDate || '2026-07-01',
      joined: '2026-05-30',
      email: form.email || 'ogrenci@gmail.com',
      source: 'manuel',
    };
    create(newStudent);
    close();
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* header */}
      <div className="sticky top-0 z-20 flex items-center border-b border-line bg-[hsl(30_24%_97%/0.85)] px-6 py-3.5 backdrop-blur-[12px] dark:bg-[hsl(24_12%_8%/0.85)]">
        <Button variant="quiet" onClick={close}>
          <Icon name="arrowL" size={18} />
          Dashboard
        </Button>
        <div className="flex-1" />
        <Logo height={26} />
      </div>

      <div className="mx-auto max-w-[720px] px-5 pt-8 pb-20">
        <div className="mb-[26px] flex flex-col gap-1.5 text-center">
          <span className="kicker">MANUEL KAYIT</span>
          <h1 className="m-0 text-[27px] font-bold tracking-[-0.02em]">Yeni Öğrenci Kaydı</h1>
        </div>

        <div className="mb-[30px]">
          <Steps steps={FORM_STEPS} current={step} />
        </div>

        <div className="card p-7">
          {step === 0 && (
            <div className="anim-fade-in">
              <SectionHead
                icon="user"
                title="Kişisel Bilgiler"
                desc="Öğrencinin kimlik ve temel bilgileri"
              />
              <div className={GRID}>
                <Field label="Ad Soyad" required full>
                  <Input value={form.name} onChange={update('name')} placeholder="Ad Soyad" />
                </Field>
                <Field label="T.C. Kimlik No" required>
                  <Input
                    value={form.tckn}
                    onChange={(event) =>
                      patch({ tckn: event.target.value.replace(/\D/g, '').slice(0, 11) })
                    }
                    placeholder="11 haneli"
                    className="font-mono"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="Doğum Tarihi">
                  <Input type="date" value={form.birth} onChange={update('birth')} />
                </Field>
                <Field label="Cinsiyet">
                  <Select value={form.gender} onChange={update('gender')}>
                    <option value="">Seçiniz</option>
                    <option>Kadın</option>
                    <option>Erkek</option>
                    <option>Belirtmek istemiyor</option>
                  </Select>
                </Field>
                <Field label="Şehir">
                  <Select value={form.city} onChange={update('city')}>
                    {CITIES.map((city) => (
                      <option key={city}>{city}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Adres" full>
                  <Textarea rows={2} value={form.addr} onChange={update('addr')} placeholder="Açık adres" />
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="anim-fade-in">
              <SectionHead
                icon="graduation"
                title="Eğitim Bilgileri"
                desc="Hangi dil, hangi seviye ve hedef"
              />
              <div className={GRID}>
                <Field label="Dil" icon="globe" required>
                  <Select value={form.lang} onChange={update('lang')}>
                    {LANGUAGES.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Seviye" icon="trend" required>
                  <Select value={form.level} onChange={update('level')}>
                    {LEVELS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Hedef" icon="target">
                  <Select value={form.goal} onChange={update('goal')}>
                    {GOALS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Kur / Program" icon="book" required>
                  <Select value={form.course} onChange={update('course')}>
                    {COURSES.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Başlangıç Tarihi" icon="calendar" full>
                  <Input type="date" value={form.start} onChange={update('start')} />
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="anim-fade-in">
              <SectionHead
                icon="phone"
                title="İletişim & Acil Durum Kişisi"
                desc="Öğrenci ve birincil iletişim kişisi"
              />
              <div className={GRID}>
                <Field label="E-posta" icon="mail" required>
                  <Input type="email" value={form.email} onChange={update('email')} placeholder="ornek@mail.com" />
                </Field>
                <Field label="Cep Telefonu" icon="phone" required>
                  <Input value={form.phone} onChange={update('phone')} placeholder="0 (5__) ___ __ __" inputMode="tel" />
                </Field>
              </div>
              <div className="divider my-5" />
              <span className="kicker mb-3.5 block">BİRİNCİL İLETİŞİM KİŞİSİ</span>
              <div className={GRID}>
                <Field label="Ad Soyad">
                  <Input value={form.cName} onChange={update('cName')} placeholder="Veli / yakını" />
                </Field>
                <Field label="Yakınlık">
                  <Select value={form.cRelation} onChange={update('cRelation')}>
                    {['Anne', 'Baba', 'Eş', 'Kardeş', 'Vasi', 'Kendisi', 'Diğer'].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Telefon" icon="phone" full>
                  <Input value={form.cPhone} onChange={update('cPhone')} placeholder="0 (5__) ___ __ __" inputMode="tel" />
                </Field>
              </div>
            </div>
          )}

          {step === 3 && <FinanceSection form={form} update={update} patch={patch} />}
        </div>

        <div className="mt-[22px] flex items-center gap-3">
          <Button variant="ghost" onClick={step === 0 ? close : back}>
            <Icon name="arrowL" size={17} />
            {step === 0 ? 'Vazgeç' : 'Geri'}
          </Button>
          <div className="flex-1" />
          <span className="self-center font-mono text-xs text-ink-3">
            {step + 1} / {FORM_STEPS.length}
          </span>
          {!isLast ? (
            <Button variant="primary" onClick={next}>
              Devam et
              <Icon name="arrowR" size={17} />
            </Button>
          ) : (
            <Button variant="primary" onClick={save}>
              <Icon name="check" size={18} />
              Kaydı Tamamla
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHead({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="anim-fade-in mb-[22px] flex items-center gap-3">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
        <Icon name={icon} size={22} />
      </div>
      <div className="flex flex-col gap-0.5">
        <h3 className="m-0 text-lg font-bold tracking-[-0.01em]">{title}</h3>
        <span className="text-[13px] text-ink-3">{desc}</span>
      </div>
    </div>
  );
}

interface FinanceSectionProps {
  form: FormState;
  update: (
    key: keyof FormState,
  ) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  patch: (partial: Partial<FormState>) => void;
}

function FinanceSection({ form, update, patch }: FinanceSectionProps) {
  const fee = Number(form.fee) || 0;
  const discount = Number(form.discount) || 0;
  const net = Math.max(0, fee - (fee * discount) / 100);

  return (
    <div className="anim-fade-in">
      <SectionHead
        icon="wallet"
        title="Finans & Ödeme Planı"
        desc="Kayıt ücreti, indirim, taksit ve ödeme yöntemi"
      />
      <div className={GRID}>
        <Field label="Kayıt Ücreti (₺)" required>
          <Input
            value={form.fee}
            onChange={(event) => patch({ fee: event.target.value.replace(/\D/g, '') })}
            placeholder="18500"
            className="font-mono"
            inputMode="numeric"
          />
        </Field>
        <Field label="İndirim (%)" hint="Erken kayıt, kardeş vb.">
          <Input
            value={form.discount}
            onChange={(event) =>
              patch({ discount: event.target.value.replace(/\D/g, '').slice(0, 3) })
            }
            className="font-mono"
            inputMode="numeric"
          />
        </Field>
        <Field label="Ödeme Planı">
          <Select value={form.plan} onChange={update('plan')}>
            {PAYMENT_PLANS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </Field>
        <Field label="Ödeme Yöntemi">
          <Select value={form.payMethod} onChange={update('payMethod')}>
            {PAY_METHODS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </Field>
        <Field label="İlk Ödeme Tarihi" icon="calendar" full>
          <Input type="date" value={form.firstDate} onChange={update('firstDate')} />
        </Field>
      </div>

      {/* summary */}
      <div className="mt-[22px] rounded-[14px] border border-accent-soft-border bg-accent-soft p-[18px]">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13.5px] text-ink-2">Kayıt Ücreti</span>
          <span className="font-mono text-sm tabular-nums">{formatMoney(fee)}</span>
        </div>
        {discount > 0 && (
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13.5px] text-ink-2">İndirim (%{discount})</span>
            <span className="font-mono text-sm text-ok tabular-nums">
              −{formatMoney(Math.round((fee * discount) / 100))}
            </span>
          </div>
        )}
        <div className="divider my-2.5" style={{ background: 'var(--accent-soft-border)' }} />
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-bold text-accent-strong">Net Tutar</span>
          <span className="font-mono text-[20px] font-bold text-accent-strong tabular-nums">
            {formatMoney(Math.round(net))}
          </span>
        </div>
        {form.plan !== 'Peşin' && net > 0 && (
          <p className="mt-2 mb-0 text-right font-mono text-[11.5px] text-ink-3">
            {form.plan} · ayda {formatMoney(Math.round(net / parseInt(form.plan, 10)))}
          </p>
        )}
      </div>
    </div>
  );
}
