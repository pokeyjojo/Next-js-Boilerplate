'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { CounterValidation } from '@/validations/CounterValidation';

export const CounterForm = () => {
  const t = useTranslations('CounterForm');
  const form = useForm({
    resolver: zodResolver(CounterValidation),
    defaultValues: {
      increment: 0,
    },
  });
  const router = useRouter();

  const handleIncrement = form.handleSubmit(async (data) => {
    await fetch(`/api/counter`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    form.reset();
    router.refresh();
  });

  return (
    <form onSubmit={handleIncrement} className="space-y-4">
      <p className="text-sm sm:text-base">{t('presentation')}</p>
      <div className="space-y-2">
        <label className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm font-bold text-[#7F8B9F]" htmlFor="increment">
          <span>{t('label_increment')}</span>
          <input
            id="increment"
            type="number"
            className="w-full sm:w-32 appearance-none rounded-sm border border-[#BFC37C] px-3 py-2 text-sm leading-tight text-[#7F8B9F] focus:outline-hidden focus:ring-2 focus:ring-[#011B2E]"
            {...form.register('increment')}
          />
        </label>

        {form.formState.errors.increment?.message && (
          <div className="text-xs italic text-[#7F8B9F]">{form.formState.errors.increment?.message}</div>
        )}
      </div>

      <div>
        <button
          className="w-full sm:w-auto rounded-sm bg-[#BFC37C] px-6 py-2 font-bold text-[#7F8B9F] focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 transition-colors shadow-lg border border-[#BFC37C]"
          type="submit"
          disabled={form.formState.isSubmitting}
        >
          {t('button_increment')}
        </button>
      </div>
    </form>
  );
};
