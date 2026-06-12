import type { ReactNode } from 'react';
import { DatePicker, Field, Icon, Input, Logo, Select, Textarea } from '@/components/ui';
import { CITIES, EDU_LEVELS, GENDERS, RELATIONS } from '@/constants/options';
import { digitsOnly } from '@/utils/format';
import {
  FORM_GRID,
  type EducationCoreForm,
  type FieldUpdater,
  type PersonCoreForm,
} from './useStepForm';

/**
 * Shared building blocks for the student registration forms: the public
 * invite form (WelcomeFormPage) and the staff manual entry form
 * (RegistrationFormPage). Both render the same welcome-themed shell and the
 * same personal/contact field groups.
 */

interface PersonalFieldsProps {
  form: PersonCoreForm;
  update: FieldUpdater<PersonCoreForm>;
  patch: (partial: Partial<PersonCoreForm>) => void;
  tcknReadOnly?: boolean;
  tcknHint?: string;
  tcknError?: string;
}

/** Identity basics: name, TCKN, birth date, gender, city, address. */
export function PersonalFields({
  form,
  update,
  patch,
  tcknReadOnly,
  tcknHint,
  tcknError,
}: PersonalFieldsProps) {
  return (
    <div className={FORM_GRID}>
      <Field label="Ad Soyad" required full>
        <Input value={form.name} onChange={update('name')} placeholder="Örn. Ayşe Yılmaz" />
      </Field>
      <Field label="T.C. Kimlik No" required hint={tcknHint} error={tcknError}>
        <Input
          value={form.tckn}
          onChange={(event) => patch({ tckn: digitsOnly(event.target.value).slice(0, 11) })}
          placeholder="Örn. 12345678901"
          className="font-mono"
          inputMode="numeric"
          readOnly={tcknReadOnly}
        />
      </Field>
      <Field label="Doğum Tarihi">
        <DatePicker
          value={form.birth}
          onChange={(iso) => patch({ birth: iso })}
          placeholder="gg.aa.yyyy"
          max={new Date().toISOString().slice(0, 10)}
        />
      </Field>
      <Field label="Cinsiyet">
        <Select value={form.gender} onChange={update('gender')}>
          <option value="">Seçiniz</option>
          {GENDERS.map((item) => (
            <option key={item}>{item}</option>
          ))}
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
        <Textarea rows={2} value={form.addr} onChange={update('addr')} placeholder="Mahalle, cadde, kapı no, ilçe" />
      </Field>
    </div>
  );
}

interface EducationFieldsProps {
  form: EducationCoreForm;
  update: FieldUpdater<EducationCoreForm>;
}

/** School background: education level, grade, school and department. */
export function EducationFields({ form, update }: EducationFieldsProps) {
  return (
    <div className={FORM_GRID}>
      <Field label="Öğrenim Durumu" icon="trend" required>
        <Select value={form.eduLevel} onChange={update('eduLevel')}>
          {EDU_LEVELS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
      </Field>
      <Field label="Sınıf / Yıl" icon="calendar" hint="Opsiyonel">
        <Input value={form.grade} onChange={update('grade')} placeholder="Örn. 3. sınıf" />
      </Field>
      <Field label="Okul / Üniversite" icon="book" required full>
        <Input value={form.school} onChange={update('school')} placeholder="Örn. İstanbul Üniversitesi" />
      </Field>
      <Field label="Bölüm" icon="graduation" full>
        <Input value={form.department} onChange={update('department')} placeholder="Örn. İşletme" />
      </Field>
    </div>
  );
}

interface ContactFieldsProps {
  form: PersonCoreForm;
  update: FieldUpdater<PersonCoreForm>;
}

/** Student contact details plus the primary contact person block. */
export function ContactFields({ form, update }: ContactFieldsProps) {
  return (
    <>
      <div className={FORM_GRID}>
        <Field label="E-posta" icon="mail" required>
          <Input type="email" value={form.email} onChange={update('email')} placeholder="ornek@mail.com" />
        </Field>
        <Field label="Cep Telefonu" icon="phone" required>
          <Input value={form.phone} onChange={update('phone')} placeholder="0 (5__) ___ __ __" inputMode="tel" />
        </Field>
      </div>
      <div className="divider my-4" />
      <span className="kicker mb-3 block">BİRİNCİL İLETİŞİM KİŞİSİ</span>
      <div className={FORM_GRID}>
        <Field label="Ad Soyad">
          <Input value={form.cName} onChange={update('cName')} placeholder="Veli / yakını" />
        </Field>
        <Field label="Yakınlık">
          <Select value={form.cRelation} onChange={update('cRelation')}>
            {RELATIONS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </Field>
        <Field label="Telefon" icon="phone" full>
          <Input value={form.cPhone} onChange={update('cPhone')} placeholder="0 (5__) ___ __ __" inputMode="tel" />
        </Field>
      </div>
    </>
  );
}

const SECTION_TONES = {
  accent: 'bg-gradient-to-br from-accent to-[hsl(0_60%_38%)] text-white shadow-accent',
  'accent-2': 'bg-gradient-to-br from-[hsl(8_80%_55%)] to-accent text-white shadow-accent',
  ok: 'bg-gradient-to-br from-accent-strong to-[hsl(0_60%_35%)] text-white shadow-accent',
} as const;

interface SectionHeadProps {
  icon: string;
  title: string;
  desc: string;
  tone?: keyof typeof SECTION_TONES;
}

/** Toned icon + title header that opens every form step. */
export function SectionHead({ icon, title, desc, tone = 'accent' }: SectionHeadProps) {
  return (
    <div className="anim-fade-in mb-4 flex items-center gap-3">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${SECTION_TONES[tone]}`}>
        <Icon name={icon} size={20} />
      </div>
      <div className="flex flex-col gap-0.5">
        <h3 className="m-0 text-lg font-bold tracking-[-0.01em]">{title}</h3>
        <span className="text-[13px] text-ink-3">{desc}</span>
      </div>
    </div>
  );
}

const BACKDROP_WORDS = ['başarı', 'gelecek', 'hedef', 'ayrıcalık', 'azim'] as const;

/** Faint oversized words drifting behind the form — pure decoration. */
function BackdropWords() {
  return (
    <div className="welcome-words" aria-hidden>
      {BACKDROP_WORDS.map((word) => (
        <span key={word}>{word}</span>
      ))}
    </div>
  );
}

/** Brand mark anchored at the bottom of every welcome-themed screen. */
function BrandFooter() {
  return (
    <div className="flex flex-col items-center gap-2 pb-7 pt-4">
      <Logo height={38} />
      <span className="font-mono text-[11px] tracking-[0.08em] text-ink-3">
        Crafted by{' '}
        <a
          href="https://selamet.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-inherit no-underline"
        >
          selamet.dev
        </a>
      </span>
    </div>
  );
}

interface WelcomeShellProps {
  /** Pill rendered fixed in the top-right corner (e.g. preview / admin badge). */
  badge?: ReactNode;
  children: ReactNode;
}

/** Full-screen welcome-themed backdrop with decorations and brand footer. */
export function WelcomeShell({ badge, children }: WelcomeShellProps) {
  return (
    <div className="welcome-bg flex min-h-screen flex-col">
      <BackdropWords />
      {badge && (
        <span className="fixed right-5 top-5 z-20 flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-[12px] font-semibold text-accent shadow-card">
          {badge}
        </span>
      )}
      {children}
      <BrandFooter />
    </div>
  );
}
